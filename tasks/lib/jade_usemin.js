/**
 * Created by Gilad Peleg on 25/11/13.
 */
'use strict';

var path = require('path');
var _ = require('lodash');

var getFileSrc = function (str, type) {
    if (type === 'js') {
        return str.match(/script.+src=['"]([^"']+)['"]/mi);
    }
    if (type === 'css') {
        return str.match(/link.+href=['"]([^"']+)['"]/mi);
    }
    return null;
};

/**
 * extractBuildPattern
 * TODO write this as an npm module and add relative dir
 *
 * @param str string to match for the pattern
 * @return {Null|Object}
 */
var extractBuildPattern = function (str) {
    if (!str) {
        return null;
    }
    // @reference: https://github.com/yeoman/grunt-usemin/blob/master/lib/file.js#L36-L46
    // start build pattern: will match
    //  * <!-- build:[target] target -->
    //  * <!-- build:[target](alternate search path) target -->
    // The following matching param are set when there's a match
    //   * 0 : the whole matched expression
    //   * 1 : the target (i.e. type)    [required]
    //   * 2 : the alternate search path [optional]
    //   * 3 : the target                [required]

    var result = str.match(/<!--\s*build:\s*(\w+)\s*(?:\(([^\)]+)\))?\s*(\S+)\s*-->/i);

    if (result && result.length && result[1] && result[3]) {
        return {
            type: result[1],
            altPath: result[2],
            target: result[3]
        };
    }
    return null;
};

/**
 * Add Concat file target
 * @param {Object} concat
 * @param src
 * @param dest
 */
var addToConcatTask = function (concat, src, dest) {
    concat.files.push({
        src: src,
        dest: dest
    });
};

var interpolateSrc = function (src, keys) {
    _.each(keys, function (path, key) {
        src = src.replace(key, path);
    });
    return src;
};

var addTargetToTask = function (task, target) {
    var targetObj = {};
    targetObj[target] = target;
    task.files.push(targetObj);
};

exports.task = function (grunt) {

    var addSrcToTarget = function (tempExtraction, target, src) {
        grunt.verbose.writelns('Adding src file ' + src);
        tempExtraction[target].src.push(src);
    };

    /**
     * Process the extracted targets
     * @param params
     * @param {Object} params.extractedTargets
     * @param {Object} params.concat
     * @param {Object} params.uglify
     * @param {Object} params.cssmin
     * @returns {number} filesProccessed Total files processed as source files
     */
    var processTasks = function (params) {
        var extractedTargets = params.extractedTargets;
        var concat = params.concat;
        var uglify = params.uglify;
        var cssmin = params.cssmin;

        //total src files processed
        var filesProccessed = 0;

        _.each(extractedTargets, function (item, target) {
            addToConcatTask(concat, item.src, target);
            grunt.log.oklns('Target ' + target + ' contains ' + item.src.length + ' files.');
            filesProccessed += item.src.length;

            if (item.type === 'js' && uglify) {
                addTargetToTask(uglify, target);
            } else if (item.type === 'css') {
                addTargetToTask(cssmin, target);
            } else {
                return null;
            }
        });

        return filesProccessed;
    };

    var jadeParser = function (jadeContents, extractedTargets, options) {
        var insideBuild = false;
        var buildPattern;
        var target;
        var type;
        var tempExtraction = {};
        var prefix = options.prefix;
        var replacePath = options.replacePath;
        var lines = jadeContents.split('\n');

        _.each(lines, function (line, lineIndex) {
            //if still scanning for build:<type>
            if (!insideBuild) {
                if (replacePath) {
                    line = interpolateSrc(line, replacePath);
                }

                //match for build pattern
                buildPattern = extractBuildPattern(line);
                //if found a valid build pattern
                if (buildPattern) {
                    type = buildPattern.type;
                    target = buildPattern.target;
                    //TODO altPath = buildPattern.altPath;

                    //if unrecognized build type
                    if (type !== 'css' && type !== 'js') {
                        return grunt.log.error('Unsupported build type: ' + type + ' in line number:' + lineIndex);
                    } else if (!target) {
                        return grunt.log.warn('Target not found in line:' + line);
                    }
                    grunt.verbose.writelns('Found build:<type> pattern in line:', lineIndex);
                    //default empty target
                    tempExtraction[target] = {
                        type: type,
                        src: []
                    };
                    insideBuild = true;
                }
            }
            //got to end of build: <!-- endbuild -->
            else if (line.match(/<!--\s*endbuild\s*-->/i) && type && target) {
                grunt.verbose.writelns('Found endbuild pattern in line ', lineIndex);
                extractedTargets[target] = {};
                _.merge(extractedTargets[target], tempExtraction[target]);

                grunt.log.oklns('Finished with target block:', target);
                type = target = insideBuild = null;
            }
            //we are inside a build:<type> block
            else {
                if (replacePath) {
                    line = interpolateSrc(line, replacePath);
                }

                var src = getFileSrc(line, type);

                if (src && src[1]) {
                    src = src[1];
                    //remove prefix /
                    if (src.charAt(0) === '/') {
                        src = src.substr(1);
                    }

                    //if prefix option exists than concat it
                    if (prefix) {
                        src = prefix + src;
                    }

                    //if path actually exists
                    if (grunt.file.exists(src)) {
                        addSrcToTarget(tempExtraction, target, src);
                    } else {
                        //attempt to resolve path relative to location (where jade file is)
                        //TODO: use altPath
                        var locationPath = path.dirname(location);
                        var newSrcPath = path.resolve(locationPath, src);
                        grunt.verbose.writelns('Src file ' + src + " wasn't found. Looking for it relative to jade file");

                        //let's see if we found it
                        if (grunt.file.exists(newSrcPath)) {
                            addSrcToTarget(tempExtraction, target, newSrcPath);
                        }
                        //src file wasn't found
                        else {
                            grunt.log.warn("Found script src that doesn't exist: " + src);
                        }
                    }
                }
            }
        });

        if (insideBuild) {
            grunt.fatal("Couldn't find '<!-- endbuild -->' in file: " + location + ", target: " + target);
        }
    };

    return {
        jadeParser: jadeParser,
        processTasks: processTasks
    };
};
