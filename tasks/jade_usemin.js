/*
 * grunt-jade-usemin
 *
 *
 * Copyright (c) 2014 Gilad Peleg
 * Licensed under the MIT license.
 */

'use strict';

var _ = require('lodash');
var os = require('os');
var path = require('path');

//set up default tasks options
var defaultTasks = {
    concat: {
        options: {
            banner: '',
            footer: '',
            separator: os.EOL
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

module.exports = function (grunt) {
    var jadeUsemin = require('./lib/jade_usemin').task(grunt);

    grunt.registerMultiTask('jadeUsemin', 'concat and minify scripts in Jade files with UseMin format', function () {
        var tasks = [];
        var tasksToRun = [];
        var extractedTargets = {};

        //set task options
        jadeUsemin.options = this.options({
            uglify: true
        });
        grunt.verbose.writeflags(jadeUsemin.options, 'Target Options');

        //iterate through each files
        _.each(this.files, function (file) {
            //handle file src
            _.each(file.src, function (src) {
                grunt.log.writeln('Processing jade file', src);
                //skip non-jade files (could be re-written)
                if (path.extname(src) !== '.jade') {
                    return grunt.log.warn('Not processing %s because of unsupported extension: %s', src);
                }
                jadeUsemin.extractTargetsFromJade(src, extractedTargets);
            });
            //TODO - handle file targets (file.dest)
            //Need to re-create jade file with build blocks replaced
        });

        var processOptions = {
            extractedTargets: extractedTargets
        };

        tasks.push('concat');
        if (jadeUsemin.options.uglify) {
            tasks.push('uglify');
        }
        tasks.push('cssmin');

        _.each(tasks, function (task) {
            //setup task global options
            jadeUsemin[task] = grunt.config(task) || {};
            //setup task target
            jadeUsemin[task].jadeUsemin = defaultTasks[task];
            processOptions[task] = jadeUsemin[task].jadeUsemin;
        });

        //process uglify and concat tasks
        jadeUsemin.totalFiles = jadeUsemin.processTasks(processOptions);

        //only run if there are src file located
        if (jadeUsemin.totalFiles > 0) {
            _.each(tasks, function (task) {
                if (jadeUsemin[task].jadeUsemin.files.length) {
                    //configure task for grunt
                    grunt.config(task, jadeUsemin[task]);
                    //we will add this at the end
                    if (task !== 'concat') {
                        tasksToRun.unshift(task + ':jadeUsemin');
                    }
                }
            });

            //make sure concat:jadeUsemin goes in first
            tasksToRun.unshift('concat:jadeUsemin');
        }

        tasksToRun.push('jadeUseminComplete');

        //assign a finalize task to notify user that task finished, and how many files processed
        grunt.registerTask('jadeUseminComplete', function () {
            grunt.log.oklns('jadeUsemin finished after processing ' + jadeUsemin.totalFiles + ' files.');
        });

        grunt.task.run(tasksToRun);
    });
};
