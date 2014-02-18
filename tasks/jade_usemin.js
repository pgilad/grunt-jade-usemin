/*
 * grunt-jade-usemin
 *
 *
 * Copyright (c) 2013 Gilad Peleg
 * Licensed under the MIT license.
 */

'use strict';

var _ = require('lodash'),
    path = require('path');

module.exports = function (grunt) {
    var jadeUsemin = require('./lib/jade_usemin').task(grunt);

    grunt.registerMultiTask('jadeUsemin', 'concat and minify scripts in Jade files with UseMin format', function () {

        jadeUsemin.options = this.options({
            uglify: true
        });
        grunt.verbose.writeflags(jadeUsemin.options, 'Target Options');

        var tasks = [];
        if (!jadeUsemin.options.uglify) {
            grunt.log.writeln('Running only concat & cssmin');
            tasks.push('concat');
            tasks.push('cssmin');
        } else {
            grunt.log.writeln('Running concat, cssmin & uglify');
            tasks.push('concat');
            tasks.push('uglify');
            tasks.push('cssmin');
        }

        _.each(tasks, function (task) {
            //use original options of uglify & concat
            jadeUsemin[task] = grunt.config(task) || {};
            //get default options for the task
            jadeUsemin[task].jadeUsemin = _.defaults({}, jadeUsemin.defaultTasks[task]);
        });

        //go through each expanded file src to create extracted files
        _.each(this.filesSrc, function (file) {
            var ext;
            grunt.log.writeln('Processing jade file', file);
            ext = path.extname(file);
            if (ext !== '.jade') {
                grunt.log.warn('Not processing %s because of unsupported extension: %s', file, ext);
            } else {
                jadeUsemin.extractTargetsFromJade(file, jadeUsemin.extractedTargets);
            }
        });

        var processOptions = {
            extractedTargets: jadeUsemin.extractedTargets
        };

        _.each(tasks, function (task) {
            processOptions[task] = jadeUsemin[task].jadeUsemin;
        });

        //process uglify and concat tasks
        jadeUsemin.totalFiles = jadeUsemin.processTasks(processOptions);

        //set temporary configs and choose whether to run scripts
        var tasksToRun = ['jadeUseminComplete'];

        //only run if there are src file located
        if (jadeUsemin.totalFiles > 0) {
            _.each(tasks, function (task) {
                //if task
                if (jadeUsemin[task].jadeUsemin.files.length) {
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

        //assign a finalize task to notify user that task finished, and how many files processed
        grunt.registerTask('jadeUseminComplete', function () {
            grunt.log.oklns('jadeUsemin finished after processing ' + jadeUsemin.totalFiles + ' files.');
        });

        grunt.task.run(tasksToRun);
    });
};
