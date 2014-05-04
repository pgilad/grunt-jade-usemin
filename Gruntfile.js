/*
 * grunt-jade-usemin
 *
 *
 * Copyright (c) 2013 Gilad Peleg
 * Licensed under the MIT license.
 */
'use strict';

module.exports = function (grunt) {
    // load all npm grunt tasks
    require('load-grunt-tasks')(grunt);

    // Project configuration.
    grunt.initConfig({

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp', 'test/compiled']
        },

        // Configuration to be run (and then tested).
        jadeUsemin: {
            options: {
                uglify: true,
                replacePath: {
                    '#{baseDir}': 'test' //optional - key value to replace in src path
                }
            },
            test: {
                src: 'test/fixtures/*.jade'
            }
        },

        devUpdate: {
            main: {
                options: {
                    //should task report already updated dependencies
                    reportUpdated: false,
                    //can be 'force'|'report'|'prompt'
                    updateType: 'prompt',
                    semver: false,
                    packages: {
                        //only devDependencies by default
                        devDependencies: true,
                        dependencies: true
                    }
                }
            }
        },

        // Unit tests.
        nodeunit: {
            tests: ['test/*_test.js']
        }

    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', ['clean', 'jadeUsemin:test', 'nodeunit']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint', 'test']);
};
