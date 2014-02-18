/**
 * Created by Gilad Peleg on 25/11/13.
 */
'use strict';

var path = require('path'),
    _ = require('lodash');

exports.task = function (grunt) {
    var exports = {
        options: {}
    };

    //contains all of our targets
    exports.extractedTargets = {};

    // set up relevant regex for jade find
    exports.regex = {
        buildRegex: /<!-- build/,
        buildExtractRegex: /build:(\w+)\s+((\w*[\/._-]*)+)/,
        endBuildRegex: /<!-- endbuild/,
        jsSourceRegex: /src=['"]((\w*[\/._-]*)+)['"]/,
        cssSourceRegex: /href=['"]((\w*[\/._-]*)+)['"]/
    };

    //set up default tasks options
    exports.defaultTasks = {
        concat: {
            options: {
                banner: '',
                footer: '',
                separator: '\n',
                process: function (src, filepath) {
                    return '\n/*! START:' + filepath + '**/\n' +
                        src + '\n/*! END:' + filepath + '**/';
                }
            },
            files: []
        },

        uglify: {
            options: {
                report: 'min',
                preserveComments: 'some',
                compress: false
            },
            files: []
        },

        cssmin: {
            options: {
                report: 'min'
            },
            files: []
        }
    };

    /**
     * Add Concat file target
     * @param {Object} concat
     * @param src
     * @param dest
     */
    exports.addConcatFileTarget = function (concat, src, dest) {
        concat.files.push({
            src: src,
            dest: dest
        });
    };

    /**
     * Adds uglify target
     * @param uglify
     * @param target
     */
    exports.addUglifyTarget = function (uglify, target) {
        var uglifyTarget = {};
        uglifyTarget[target] = target;
        uglify.files.push(uglifyTarget);
    };

    /**
     * Process the extracted targets
     * @param parameters
     * @param {Object} parameters.extractedTargets
     * @param parameters.concat
     * @param parameters.uglify
     * @returns {number} totalFiles Total files processed as source files
     */
    exports.processTasks = function (parameters) {
        var extractedTargets, concat, uglify, cssmin, totalFiles;

        extractedTargets = parameters.extractedTargets;
        concat = parameters.concat;
        uglify = exports.options.uglify ? parameters.uglify : null;

        cssmin = parameters.cssmin;
        totalFiles = 0;

        _.each(extractedTargets, function (item, target) {

            exports.addConcatFileTarget(concat, item.src, target);
            grunt.log.oklns('Target ' + target + ' contains ' + item.src.length + ' files.');
            totalFiles += item.src.length;

            if (item.type === 'js' && uglify) {
                exports.addUglifyTarget(uglify, target);
            } else if (item.type === 'css') {
                exports.addUglifyTarget(cssmin, target);
            }
        });

        return totalFiles;
    };

    exports.getSrcRegex = function (type) {
        if (type === 'js') {
            return exports.regex.jsSourceRegex;
        } else if (type === 'css') {
            return exports.regex.cssSourceRegex;
        }
        return null;
    };

    exports.insertSrcIntoTargetObj = function (tempExtraction, target, src) {
        grunt.verbose.writelns('Adding src file ' + src);
        tempExtraction[target].src.push(src);
    };

    exports.extractTargetsFromJade = function (location, extractedTargets) {
        //current temp file
        var srcRegex, insideBuild = false;
        var target = null,
            extracted = [],
            type = null,
            tempExtraction = {};

        var file = grunt.file.read(location).split('\n');

        _.each(file, function (line, lineIndex) {

            //if still scanning for build:<type>
            if (!insideBuild) {

                //look for pattern build:<type>
                if (line.match(exports.regex.buildRegex)) {

                    //replace path from options.replacePath
                    _.each(exports.options.replacePath, function (path, key) {
                        line = line.replace(key, path);
                    });

                    extracted = line.match(exports.regex.buildExtractRegex);
                    type = extracted[1];
                    target = extracted[2];

                    //if unrecognized build type
                    if (!_.contains(['css', 'js'], type)) {
                        grunt.log.error('Unsupported build type: ' + type + ' in line number:' + lineIndex);
                        return;
                    } else if (!target) {
                        grunt.log.warn('Target not found in line:' + line);
                        return;
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
            else if (line.match(exports.regex.endBuildRegex) && type && target) {
                grunt.verbose.writelns('Found endbuild pattern in line ', lineIndex);
                extractedTargets[target] = {};

                _.merge(extractedTargets[target], tempExtraction[target]);

                grunt.log.oklns('Finished with target block:', target);
                type = target = insideBuild = null;
            }
            //we are inside a build:<type> block
            else {

                //replace path from options.replacePath
                _.each(exports.options.replacePath, function (path, key) {
                    line = line.replace(key, path);
                });

                srcRegex = exports.getSrcRegex(type);
                var src = line.match(srcRegex);

                if (src && src[1]) {
                    src = src[1];
                    if (src.charAt(0) === '/') {
                        src = src.substr(1);
                    }

                    //if prefix option exists than concat it
                    if (exports.options.prefix) {
                        src = exports.options.prefix + src;
                    }

                    //if path actually exists
                    if (grunt.file.exists(src)) {
                        exports.insertSrcIntoTargetObj(tempExtraction, target, src);
                    } else {
                        //attempt to resolve path relative to location (where jade file is)
                        var locationPath = path.dirname(location);
                        var newSrcPath = path.resolve(locationPath, src);
                        grunt.verbose.writelns('Src file ' + src + " wasn't found. Looking for it relative to jade file");
                        if (grunt.file.exists(newSrcPath)) {
                            exports.insertSrcIntoTargetObj(tempExtraction, target, newSrcPath);
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
            grunt.fatal("Couldn't find `endbuild` in file: " + location + ", target: " + target);
        }
    };

    return exports;
};
