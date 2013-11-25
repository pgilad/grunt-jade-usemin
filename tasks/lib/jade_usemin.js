/**
 * Created by Gilad Peleg on 25/11/13.
 */

'use strict';

var moment = require('moment'),
    fs = require('fs'),
    _ = require('lodash');

exports.task = function (grunt) {
    var exports = {
        options: {}
    };

    exports.extractedTargets = {};

    // set up relevant regex for jade find
    exports.regex = {
        buildRegex        : /<!-- build/,
        buildExtractRegex : /build:(\w+)\s+((\w*[\/._]*)+)/,
        endBuildRegex     : /<!-- endbuild/,
        extractSourceRegex: /src=['"]((\w*[\/._-]*)+)['"]/
    };

    exports.prepareConcatAndUglify = function () {
        //define concat settings
        exports.concat.jadeUsemin = {
            options: {
                banner   : '',
                footer   : '',
                separator: '\n',
                process  : function (src, filepath) {
                    return '\n/*! START:' + filepath +
                        ', COMPILED:' + moment().format('MMMM Do YYYY, hh:mm') +
                        '**/\n' +
                        src + '\n/*! END:' + filepath + '**/';
                }
            },
            files  : []
        };

        exports.uglify.jadeUsemin = {
            options: {
                report          : 'min',
                preserveComments: 'some',
                compress        : false
            },
            files  : []
        };
    };

    exports.processTasks = function () {
        var uglifyTarget, totalFiles = 0;

        _.each(exports.extractedTargets, function (item, target) {
            exports.concat.jadeUsemin.files.push({
                src : item.src,
                dest: target
            });

            grunt.log.oklns('Target ' + target + ' contains ' + item.src.length + ' files.');
            totalFiles += item.src.length;

            uglifyTarget = {};
            uglifyTarget[target] = target;
            exports.uglify.jadeUsemin.files.push(uglifyTarget);
        });

        exports.totalFiles = totalFiles;
    };

    exports.buildObjectFromJade = function (location) {
        //current temp file
        var file = grunt.file.read(location).split('\n');

        for (var i = 0; i < file.length; i++) {
            var line = file[i];
            if (line.match(exports.regex.buildRegex)) {
                var extracted = line.match(exports.regex.buildExtractRegex);
                var type = extracted[1];
                var target = extracted[2];

                if (!_.contains(['css', 'js'], type)) {
                    grunt.log.warn('Invalid build:' + type + ' in line:' + line);
                    continue;
                }
                else if (!target) {
                    grunt.log.warn('Invalid target:' + target + ' in line:' + line);
                    continue;
                }

                //default empty target
                exports.extractedTargets[target] = {
                    type: type,
                    src : []
                };

                ++i;
                //scan to endbuild
                //TODO handle lack of endbuild (report error)
                for (var j = i; j < file.length; j++) {
                    var nextLine = file[j];

                    //end of build, skip to next
                    if (nextLine.match(exports.regex.endBuildRegex)) {
                        i = ++j;
                        break;
                    }
                    //inside build
                    else {
                        var src = nextLine.match(exports.regex.extractSourceRegex);
                        if (src && src[1]) {
                            src = src[1];
                            if (src.charAt(0) === '/') {
                                src = src.substr(1);
                            }

                            //if path actually exists
                            if (fs.existsSync(src)) {
                                exports.extractedTargets[target].src.push(src);
                            }
                            else {
                                grunt.log.warn('Found script src that doesn\'t exist: ' + src);
                            }
                        }
                    }
                }
            }
        }
    };

    return exports;
};
