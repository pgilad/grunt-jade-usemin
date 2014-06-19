/**
 * Created by Gilad Peleg on 25/11/13.
 */
'use strict';

var path = require('path');
var os = require('os');
var _ = require('lodash');
var slash = require('slash');

var getFileSrc = function (str, type) {
    var result;
    if (type === 'js') {
        result = str.match(/script.+src\s*=\s*['"]([^"']+)['"]/mi);
    }
    if (type === 'css') {
        result = str.match(/link.+href\s*=\s*['"]([^"']+)['"]/mi);
    }

    return (result || [])[1];
};

//set up default tasks options
var defaultTasks = {
    concat: {
        options: {
            banner: '',
            footer: '',
            separator: os.EOL
        }
    },
    uglify: {
        options: {
            report: 'min',
            preserveComments: 'some',
            compress: false
        }
    },
    cssmin: {
        options: {
            report: 'min'
        }
    }
};

/**
 * extractBuildPattern
 *
 * @reference: https://github.com/yeoman/grunt-usemin/blob/master/lib/file.js#L36-L46
 * start build pattern: will match
 *  * <!-- build:[target] target -->
 *  * <!-- build:[target](alternate search path) target -->
 * The following matching param are set when there's a match
 *   * 0 : the whole matched expression
 *   * 1 : the target (i.e. type)    [required]
 *   * 2 : the alternate search path [optional]
 *   * 3 : the target                [required]
 *
 * @param str string to match for the pattern
 * @return {Null|Object}
 */
var extractBuildPattern = function (str) {
    if (!str) {
        return null;
    }

    var result = str.match(/<!--\s*build:\s*(\w+)\s*(?:\(([^\)]+)\))?\s*(\S+)\s*-->/i);

    //required params are type & target
    if (result && result.length && result[1] && result[3]) {
        return {
            type: result[1],
            altPath: result[2],
            target: result[3]
        };
    }
    return null;
};

var interpolateSrc = function (src, keys) {
    _.each(keys, function (path, key) {
        src = src.replace(key, path);
    });
    return src;
};

exports.task = function (grunt) {

    var addSrcToTarget = function (tempExtraction, target, src) {
        grunt.verbose.writelns('Adding src file ' + src);
        tempExtraction[target].src.push(src);
    };

    var buildTaskTarget = function (task) {
        var taskOptions = {};
        //get task options (if exists)
        taskOptions.global = grunt.config(task + '.options') || {};
        //get task:jadeUsemin options (if exists)
        taskOptions.options = grunt.config(task + '.jadeUsemin.options') || {};
        //get default options for task
        taskOptions.defaults = defaultTasks[task] && defaultTasks[task].options || {};
        //merge ==> task:jadeUsemin.options > task.options > default.options
        var opts = _.assign(taskOptions.defaults, taskOptions.global, taskOptions.options);
        //build jadeUsemin target for this task
        return {
            files: [],
            options: opts
        };
    };

    var iterateFiles = function (files, options) {
        var jadeSrc;
        var extractedTargets = {};
        //iterate through each file object
        _.each(files, function (file) {
            //reset jade src
            jadeSrc = '';
            //handle file src
            _.each(file.src, function (src) {
                grunt.log.writeln('Processing jade file', src);
                //skip non-jade files (could be re-written)
                if (path.extname(src) !== '.jade') {
                    return grunt.log.warn('Not processing %s because of unsupported extension: %s', src);
                }
                //get actual file contents
                var jadeContents = grunt.file.read(src);
                //parse through optimizer
                jadeContents = jadeParser(jadeContents, extractedTargets, _.assign(options, {
                    location: src,
                    output: file.dest
                }));
                //concat jade file src
                jadeSrc += jadeContents;
            });
            //if there is a target file
            if (file.dest) {
                //write output
                grunt.file.write(file.dest, jadeSrc);
            }
        });
        return extractedTargets;
    };

    var processTasks = function (options, extractedTargets) {
        var tasksToRun = [];
        //temp fix for filerev
        var filerev = [];
        var curTask = {};
        var tasks = options.tasks;
        var dirTasks = options.dirTasks;

        _.each(tasks, function (tasks, filetype) {
            _.each(tasks, function (task, index) {
                var targetName = 'jadeUsemin-' + filetype;
                //build initial task config
                curTask = buildTaskTarget(task);
                var transformFn;
                //first task in filetype runs the original files
                if (index === 0) {
                    transformFn = function (src, dest) {
                        return {
                            dest: dest,
                            src: src
                        };
                    };
                } else {
                    transformFn = function (src, dest) {
                        src = dest;
                        //adjust target to be a dir if required
                        if (dirTasks && _.contains(dirTasks, task)) {
                            var newDest = path.dirname(dest);
                            if (extractedTargets[dest].output) {
                                filerev.push({
                                    output: extractedTargets[dest].output,
                                    dest: dest
                                });
                            }
                            dest = newDest;
                        }
                        return {
                            dest: dest,
                            src: src
                        };
                    };
                }

                fillTargetFiles({
                    targets: extractedTargets,
                    filetype: filetype,
                    curTask: curTask,
                    transformFn: transformFn
                });

                //if task has any files, configure it, and set to run
                if (curTask.files.length) {
                    grunt.config(task + '.' + targetName, curTask);
                    tasksToRun.push(task + ':' + targetName);
                }
            });
        });
        return {
            tasksToRun: tasksToRun,
            filerev: filerev
        };
    };

    /**
     * rewriteRevs
     *
     * @param summary contains key values of { oldTarget: newTarget}
     * @param filerev contains dictionary of {output: 'jade output', dest: 'oldTarget'}
     * @param {String} [targetPrefix] A string to remove for targets
     */
    var rewriteRevs = function (summary, filerev, targetPrefix) {
        _.each(summary, function (newTarget, oldTarget) {
            _.each(filerev, function (file) {
                //apply a fix for windows paths. see https://github.com/pgilad/grunt-jade-usemin/pull/13
                var dest = slash(file.dest);
                var compareTarget = slash(oldTarget);
                //if paths aren't the same - skip
                if (dest !== compareTarget) {
                    return;
                }

                //re-write the file itself
                grunt.file.copy(file.output, file.output, {
                    process: function (contents) {
                        //remove targetPrefix from targets to adjust directory
                        if (targetPrefix) {
                            var len = targetPrefix.length;
                            oldTarget = oldTarget.substr(len);
                            newTarget = newTarget.substr(len);
                        }
                        //apply a fix for windows paths. see https://github.com/pgilad/grunt-jade-usemin/pull/13
                        oldTarget = slash(oldTarget);
                        newTarget = slash(newTarget);
                        return contents.replace(oldTarget, newTarget);
                    }
                });
            });
        });
    };

    /**
     * Process the extracted targets
     * @returns {number} filesProccessed Total files processed as source files
     */
    var fillTargetFiles = function (params) {
        _.each(params.targets, function (details, target) {
            if (params.filetype !== details.type) {
                return;
            }
            params.curTask.files.push(params.transformFn(details.src, target));
        });
    };

    var jadeParser = function (jadeContents, extractedTargets, options) {
        var prefix = options.prefix;
        var replacePath = options.replacePath;
        var location = options.location;
        var output = options.output;
        var targetPrefix = options.targetPrefix;

        var buildPattern, target, type,
            insideBuildFirstItem = {}, optimizedSrc = [],
            unprefixedTarget;

        var insideBuild = false;
        var tempExtraction = {};
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

                    if (!_.contains(['css', 'js'], type)) {
                        grunt.log.warn('Unsupported build type: ' + type);
                    }

                    //add prefix to target as well
                    if (targetPrefix) {
                        unprefixedTarget = target;
                        target = path.join(targetPrefix, target);
                    }

                    grunt.verbose.writelns('Found build:<type> pattern in line:', lineIndex);
                    //default empty target
                    tempExtraction[target] = {
                        type: type,
                        src: [],
                        output: output
                    };
                    insideBuild = true;
                } else {
                    //add line to return
                    optimizedSrc.push(line);
                }
            }
            //got to end of build: <!-- endbuild -->
            else if (line.match(/<!--\s*endbuild\s*-->/i) && type && target) {
                grunt.verbose.writelns('Found endbuild pattern in line ', lineIndex);
                extractedTargets[target] = {};
                _.merge(extractedTargets[target], tempExtraction[target]);
                grunt.log.oklns('Finished with target block:', target);
                var oldTarget = unprefixedTarget || target;
                optimizedSrc.push(insideBuildFirstItem.line.replace(insideBuildFirstItem.src, oldTarget));
                //reset build vars
                insideBuildFirstItem = {};
                type = target = insideBuild = unprefixedTarget = null;
            }
            //we are inside a build:<type> block
            else {
                if (replacePath) {
                    line = interpolateSrc(line, replacePath);
                }

                var src = getFileSrc(line, type);
                if (src) {
                    //assign first source
                    insideBuildFirstItem.src = insideBuildFirstItem.src || src;
                    insideBuildFirstItem.line = insideBuildFirstItem.line || line;

                    //remove prefix /
                    if (src.charAt(0) === '/') {
                        src = src.substr(1);
                    }

                    //add prefix to src
                    if (prefix) {
                        src = path.join(prefix, src);
                    }

                    //if path actually exists
                    if (grunt.file.exists(src)) {
                        addSrcToTarget(tempExtraction, target, src);
                    } else {
                        //attempt to resolve path relative to location (where jade file is)
                        //TODO: use altPath
                        grunt.verbose.writelns('Src file ' + src + " wasn't found. Looking for it relative to jade file");
                        var newSrcPath = path.resolve(path.dirname(location), src);
                        if (grunt.file.exists(newSrcPath)) {
                            //new src path exists
                            addSrcToTarget(tempExtraction, target, newSrcPath);
                        } else {
                            grunt.verbose.writelns('Src file ' + newSrcPath + " wasn't found relative to jade file as well.");
                            //src file wasn't found
                            grunt.log.warn("Found script src that doesn't exist: " + src);
                        }
                    }
                }
            }
        });

        if (insideBuild) {
            grunt.fatal("Couldn't find '<!-- endbuild -->' in file: " + location + ", target: " + target);
        }
        //return optimized src
        return optimizedSrc.join('\n');
    };

    return {
        jadeParser: jadeParser,
        buildTaskTarget: buildTaskTarget,
        fillTargetFiles: fillTargetFiles,
        processTasks: processTasks,
        iterateFiles: iterateFiles,
        rewriteRevs: rewriteRevs
    };
};
