/*
 * grunt-jade-usemin
 *
 * Copyright (c) 2014 Gilad Peleg
 * Licensed under the MIT license.
 */

'use strict';

var os = require('os');
var path = require('path');
var _ = require('lodash');

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

    grunt.registerMultiTask('jadeUsemin', 'concat, uglify & cssmin files with UseMin format', function () {
        var tasks = [];
        var tasksToRun = [];
        var extractedTargets = {};
        var jadeSrc;

        //set task options
        var options = this.options({
            uglify: true
        });

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

        //add tasks to run
        tasks.push('concat', 'cssmin');
        if (options.uglify) {
            tasks.push('uglify');
        }

        var tasksConfig = {};

        //setup according grunt tasks
        _.each(tasks, function (task) {
            //get task from user's config
            tasksConfig[task] = grunt.config(task) || {};
            //setup task:jadeUsemin target
            tasksConfig[task].jadeUsemin = defaultTasks[task];
        });

        //process tasks
        var totalFiles = jadeUsemin.processTasks(extractedTargets, tasksConfig);

        //only run if there are src file located
        if (totalFiles > 0) {
            _.each(tasks, function (task) {
                if (tasksConfig[task].jadeUsemin.files.length) {
                    //apply config to grunt (for runtime config)
                    grunt.config(task, tasksConfig[task]);
                    //we will add this at the end
                    if (task !== 'concat') {
                        tasksToRun.unshift(task + ':jadeUsemin');
                    }
                }
            });

            //make sure concat:jadeUsemin goes in first
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
