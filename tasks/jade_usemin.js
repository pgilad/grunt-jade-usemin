/*
 * grunt-jade-usemin
 *
 * Copyright (c) 2014 Gilad Peleg
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');
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
            options.tasks.js = _.without(options.tasks.js, 'uglify');
        }

        var jadeSrc;
        var extractedTargets = {};

        //iterate through each file object
        _.each(this.files, function (file) {
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
                jadeContents = jadeUsemin.jadeParser(jadeContents, extractedTargets, _.assign(options, {
                    location: src
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

        //get unique tasks to setup
        var tasks = _.unique(_.flatten(_.values(options.tasks)));
        var tasksConfig = {};

        //assign jadeUsemin target to each task
        //building just the initial ugliy.jadeUsemin target
        _.each(tasks, function (task) {
            tasksConfig[task] = jadeUsemin.buildTaskTarget(task);
        });

        //fill task target with files
        var totalFiles = jadeUsemin.fillTargetFiles(extractedTargets, tasksConfig, options);
        //only run if there are src file located
        var tasksToRun = [];
        if (totalFiles > 0) {
            _.each(_.without(tasks, 'concat'), function (task) {
                //if task has any files to be added
                if (tasksConfig[task].files.length) {
                    //apply config to grunt (for runtime config)
                    grunt.config(task + '.jadeUsemin', tasksConfig[task]);
                    //add task target to run
                    tasksToRun.push(task + ':jadeUsemin');
                }
            });

            //make sure concat:jadeUsemin goes in first
            grunt.config('concat.jadeUsemin', tasksConfig.concat);
            tasksToRun.unshift('concat:jadeUsemin');
        }

        //to run when completed
        tasksToRun.push('jadeUseminComplete');

        //assign a finalize task to notify user that task finished, and how many files processed
        grunt.registerTask('jadeUseminComplete', function () {
            grunt.log.oklns('jadeUsemin finished after processing ' + totalFiles + ' files.');
        });

        return grunt.task.run(tasksToRun);
    });
};
