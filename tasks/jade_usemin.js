/*
 * grunt-jade-usemin
 *
 * Copyright © 2015 Gilad Peleg
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    var jadeUsemin = require('./lib/jade_usemin').task(grunt);

    grunt.registerMultiTask('jadeUsemin', 'concat, uglify & cssmin files with UseMin format', function () {
        var options = this.options({
            dirTasks: [],
            failOnMissingSource: false,
            prefix: null,
            replacePath: {},
            targetPrefix: null,
            tasks: {
                js: ['concat', 'uglify'],
                css: ['concat', 'cssmin']
            },
        });

        //force dirTasks to always be an array
        if (options.dirTasks && !Array.isArray(options.dirTasks)) {
            options.dirTasks = [options.dirTasks];
        }

        //targetPrefix must be a string
        if (options.targetPrefix && typeof options.targetPrefix !== 'string') {
            grunt.warn('Option targetPrefix must be a string');
            options.targetPrefix = null;
        }

        //if targetPrefix exists - make sure it ends with a /
        if (options.targetPrefix && options.targetPrefix.slice(-1) !== '/') {
            options.targetPrefix += '/';
        }

        if (options.prefix && typeof options.prefix !== 'string') {
            grunt.warn('Option prefix must be a string');
            options.prefix = null;
        }

        if (options.prefix && options.prefix.slice(-1) !== '/') {
            options.prefix += '/';
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
