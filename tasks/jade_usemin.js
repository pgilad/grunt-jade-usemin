/*
 * grunt-jade-usemin
 *
 * Copyright (c) 2014 Gilad Peleg
 * Licensed under the MIT license.
 */

'use strict';
var _ = require('lodash');

module.exports = function (grunt) {
    var jadeUsemin = require('./lib/jade_usemin').task(grunt);

    grunt.registerMultiTask('jadeUsemin', 'concat, uglify & cssmin files with UseMin format', function () {
        var options = this.options({
            uglify: true, //DEPRECATION NOTICE: 0.6.0
            tasks: {
                js: ['concat', 'uglify'],
                css: ['concat', 'cssmin']
            }
        });

        //DEPRECATION NOTICE: 0.6.0
        //remove uglify from tasks.js if not specificed
        if (!options.uglify) {
            grunt.log.subhead('*Deprecation Notice* - Uglify option was deprecated in version 0.5.0.' +
                ' Please see the tasks option');
            options.tasks.js = _.without(options.tasks.js, 'uglify');
        }

        //force dirTasks to always be an array
        if (options.dirTasks && typeof options.dirTasks === 'string') {
            options.dirTasks = [options.dirTasks];
        }

        if (options.targetPrefix && !_.isString(options.targetPrefix)) {
            grunt.fail.warn('Option targetPrefix must be a string');
            options.targetPrefix = null;
        }

        if (options.prefix && !_.isString(options.prefix)) {
            grunt.fail.warn('Option prefix must be a string');
            options.prefix = null;
        }

        var extractedTargets = jadeUsemin.iterateFiles(this.files, options);

        //rules:
        //1. first task in each filetype gets the original src files and target
        //2. all following tasks in filetype get only the target file as src and dest
        //3. each task is named task.jadeUsemin-filetype. eg: concat.jadeUsemin-js
        var results = jadeUsemin.processTasks(options, extractedTargets);
        var tasksToRun = results.tasksToRun;
        var filerev = results.filerev;

        //to run when completed
        tasksToRun.push('jadeUseminComplete');
        //assign a finalize task to notify user that task finished, and how many files processed
        grunt.registerTask('jadeUseminComplete', function () {
            //apply name fix for filerev
            if (grunt.filerev && grunt.filerev.summary) {
                //replace file revs in target jade files
                jadeUsemin.rewriteRevs(grunt.filerev.summary, filerev, options.targetPrefix);
            }
            grunt.log.oklns('jadeUsemin finished successfully.');
        });

        return grunt.task.run(tasksToRun);
    });
};
