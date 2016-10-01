/**
 * Created by Gilad Peleg on 25/11/13.
 */
'use strict';

var assign = require('lodash/assign');
var compact = require('lodash/compact');
var forEach = require('lodash/forEach');
var includes = require('lodash/includes');
var map = require('lodash/map');
var os = require('os');
var path = require('path');
var slash = require('slash');

var allowedExtnames = ['.jade', '.pug'];

function hasSrcResult(result) {
    if (!Array.isArray(result)) {
        return false;
    }
    return result[1];
}

var getFileSrc = function (str, type) {
    //jshint unused:false
    var result;
    result = str.match(/script.+src\s*=\s*['"]([^"']+)['"]/mi);
    if (hasSrcResult(result)) {
        return result[1];
    }
    // also treats link rel='prefetch' href='something'
    result = str.match(/link.+href\s*=\s*['"]([^"']+)['"]/mi);
    if (hasSrcResult(result)) {
        return result[1];
    }
    return false;
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
    forEach(keys, function (path, key) {
        src = src.replace(key, path);
    });
    return src;
};

exports.task = function (grunt) {

    var addSrcToTarget = function (tempExtraction, target, src) {
        grunt.verbose.writelns('Adding src file ' + src);
        tempExtraction[target].src.push(src);
    };

    var getCurTaskOptions = function (task) {
        var taskOptions = {};
        //get task options (if exists)
        taskOptions.global = grunt.config(task + '.options') || {};
        //get task:jadeUsemin options (if exists)
        taskOptions.options = grunt.config(task + '.jadeUsemin.options') || {};
        //get default options for task
        taskOptions.defaults = defaultTasks[task] && defaultTasks[task].options || {};
        //merge ==> task:jadeUsemin.options > task.options > default.options
        var opts = assign({}, taskOptions.defaults, taskOptions.global, taskOptions.options);
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
        forEach(files, function (file) {
            //reset jade src
            jadeSrc = '';
            //handle file src
            forEach(file.src, function (src) {
                grunt.log.writeln('Processing jade file', src);
                //skip non-jade files (could be re-written)
                if (allowedExtnames.indexOf(path.extname(src)) < 0) {
                    return grunt.log.warn('Not processing %s because of unsupported extension: %s', src);
                }
                //get actual file contents
                var jadeContents = grunt.file.read(src);
                //parse through optimizer
                jadeContents = jadeParser(jadeContents, extractedTargets, assign({}, options, {
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

    /**
     * Process the extracted targets
     * @returns {number} filesProccessed Total files processed as source files
     */
    var getTargetFiles = function (params) {
        var targets = params.targets;
        var filetype = params.filetype;
        var transformFn = params.transformFn;
        return map(targets, function (details, target) {
            if (filetype !== details.type) {
                return;
            }
            return transformFn(details.src, target);
        });
    };

    var processTasks = function (options, extractedTargets) {
        var tasksToRun = [];
        //temp fix for filerev
        var filerev = [];
        var taskKinds = options.tasks;
        var dirTasks = options.dirTasks;

        forEach(taskKinds, function (tasks, filetype) {
            var targetName = 'jadeUsemin-' + filetype;
            forEach(tasks, function (task, index) {
                var transformFn;
                //build initial task config
                var curTask = getCurTaskOptions(task);
                //first task in filetype runs the original files
                if (index === 0) {
                    transformFn = function (src, dest) {
                        return {
                            src: src,
                            dest: dest
                        };
                    };
                } else if (includes(dirTasks, task)) {
                    // a task that is a directory task
                    transformFn = function (src, dest) {
                        src = dest;
                        var newDest = curTask.options.noDest ? null : path.dirname(dest);
                        if (extractedTargets[dest].output) {
                            extractedTargets[dest].output.forEach(function (output) {
                                filerev.push({
                                    output: output,
                                    dest: dest
                                });
                            });
                        }
                        return {
                            dest: newDest,
                            src: src
                        };
                    };
                } else {
                    // a task running mid stream
                    transformFn = function (src, dest) {
                        return {
                            src: dest,
                            dest: dest
                        };
                    };
                }
                var files = compact(getTargetFiles({
                    targets: extractedTargets,
                    filetype: filetype,
                    transformFn: transformFn
                }));
                curTask.files = curTask.files.concat(files);

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

    var replaceRevContents = function (params) {
        //remove targetPrefix from targets to adjust directory
        var oldPath = params.oldTarget;
        var newPath = params.newTarget;
        if (params.targetPrefix) {
            var len = params.targetPrefix.length;
            oldPath = oldPath.substr(len);
            newPath = newPath.substr(len);
        }
        //apply a fix for windows paths. see https://github.com/pgilad/grunt-jade-usemin/pull/13
        return params.contents.replace(slash(oldPath), slash(newPath));
    };

    /**
     * rewriteRevs
     *
     * @param summary contains key values of { oldTarget: newTarget}
     * @param filerev contains dictionary of {output: 'jade output', dest: 'oldTarget'}
     * @param {String} [targetPrefix] A string to remove for targets
     */
    var rewriteRevs = function (summary, filerev, targetPrefix) {
        forEach(summary, function (newTarget, oldTarget) {
            forEach(filerev, function (file) {
                //if paths aren't the same - skip
                //apply a fix for windows paths. see https://github.com/pgilad/grunt-jade-usemin/pull/13
                if (slash(file.dest) !== slash(oldTarget)) {
                    return;
                }
                //re-write the file itself
                grunt.file.copy(file.output, file.output, {
                    process: function (contents) {
                        return replaceRevContents({
                            oldTarget: oldTarget,
                            newTarget: newTarget,
                            contents: contents,
                            targetPrefix: targetPrefix
                        });
                    }
                });
            });
        });
    };

    var jadeParser = function (jadeContents, extractedTargets, options) {
        var prefix = options.prefix;
        var replacePath = options.replacePath;
        var location = options.location;
        var output = options.output;
        var targetPrefix = options.targetPrefix;
        var failOnMissingSource = options.failOnMissingSource;

        var buildPattern, target, type, altPath, unprefixedTarget;
        var insideBuildFirstItem = {},
            optimizedSrc = [];

        var insideBuild = false;
        var tempExtraction = {};
        var lines = jadeContents.split('\n');

        forEach(lines, function (line, lineIndex) {
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
                    altPath = buildPattern.altPath;

                    if (!includes(['css', 'js'], type)) {
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
                        output: [output],
                        altPath: altPath
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
                //if target already exists, add it's output
                if (extractedTargets[target]) {
                    tempExtraction[target].output = tempExtraction[target].output.concat(extractedTargets[target].output);
                }
                extractedTargets[target] = assign({}, tempExtraction[target]);
                grunt.log.oklns('Finished with target block:', target);
                var oldTarget = unprefixedTarget || target;

                //make sure we got at least 1 src from this block
                if (insideBuildFirstItem.line) {
                    optimizedSrc.push(insideBuildFirstItem.line.replace(insideBuildFirstItem.src, oldTarget));
                }

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

                    //original path exists
                    if (grunt.file.exists(src)) {
                        return addSrcToTarget(tempExtraction, target, src);
                    }
                    //try to find using alternate path
                    if (tempExtraction[target].altPath) {
                        var altPathSrc = path.join(tempExtraction[target].altPath, src);
                        if (grunt.file.exists(altPathSrc)) {
                            return addSrcToTarget(tempExtraction, target, altPathSrc);
                        }
                    }
                    //attempt to resolve path relative to location (where jade file is)
                    grunt.verbose.writelns('Src file ' + src + " wasn't found. Looking for it relative to jade file");
                    var newSrcPath = path.resolve(path.dirname(location), src);
                    if (grunt.file.exists(newSrcPath)) {
                        return addSrcToTarget(tempExtraction, target, newSrcPath);
                    }
                    grunt.verbose.writelns('Src file ' + newSrcPath + " wasn't found relative to jade file as well.");
                    var logAction = failOnMissingSource ? grunt.fatal : grunt.log.warn;
                    logAction("Found script src that doesn't exist: " + src);
                }
            }
        });

        if (insideBuild) {
            grunt.fatal("Couldn't find '<!-- endbuild -->' in file: " + location + ', target: ' + target);
        }
        //return optimized src
        return optimizedSrc.join('\n');
    };

    return {
        jadeParser: jadeParser,
        processTasks: processTasks,
        iterateFiles: iterateFiles,
        rewriteRevs: rewriteRevs
    };
};
