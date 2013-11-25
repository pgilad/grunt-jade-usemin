/*
 * grunt-jade-usemin
 * 
 *
 * Copyright (c) 2013 Gilad Peleg
 * Licensed under the MIT license.
 */

var _ = require('lodash');

module.exports = function (grunt) {
    var jadeUsemin = require('./lib/jade_usemin').task(grunt);

    grunt.registerMultiTask('jadeUseMin', 'concat and minify scripts in Jade files with UseMin format', function () {

        jadeUsemin.options = this.options();
        grunt.verbose.writeflags(jadeUsemin.options, 'Target ' + this.target + ' Options:');

        jadeUsemin.uglify = grunt.config('uglify') || {};
        jadeUsemin.concat = grunt.config('concat') || {};

        jadeUsemin.prepareConcatAndUglify();

        //go through each expanded file src to create extracted files
        _.each(this.filesSrc, function (file) {
            jadeUsemin.buildObjectFromJade(file);
        });

        //add to concat task
        jadeUsemin.processTasks();

        //set temporary configs
        grunt.config('concat', jadeUsemin.concat);
        grunt.config('uglify', jadeUsemin.uglify);

        //assign a finalize task to notify user that task finished, and how many files processed
        grunt.registerTask('jadeUseMinComplete', function () {
            grunt.log.oklns('jadeUseMin finished after processing ' + jadeUsemin.totalFiles + ' files.');
        });

        grunt.task.run(['concat:jadeUseMin', 'uglify:jadeUseMin', 'jadeUseMinComplete']);
    });
};