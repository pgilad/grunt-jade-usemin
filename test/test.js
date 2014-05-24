'use strict';
var grunt = require('grunt');
var path = require('path');

var fileCmp = function (test, origin, target) {
    target = target || origin;
    var actual = grunt.file.read('./test/compiled/' + origin);
    var expected = grunt.file.read('./test/expected/' + target);
    test.equal(actual.trim(), expected.trim(), 'files should be equal');
};

exports.jadeUsemin = {
    setUp: function (done) {
        // setup here if necessary
        done();
    },
    basic: function (test) {
        test.expect(2);
        fileCmp(test, 'basic.min.js');
        fileCmp(test, 'basic.jade');
        test.done();
    },
    multiple: function (test) {
        test.expect(2);
        fileCmp(test, 'multiple.min.js');
        fileCmp(test, 'multiple.min.css');
        test.done();
    },
    replacePath: function (test) {
        test.expect(1);
        fileCmp(test, 'replacePath.min.js');
        test.done();
    },
    production: function (test) {
        test.expect(1);
        fileCmp(test, 'production.jade');
        test.done();
    },
    solvePath: function (test) {
        test.expect(1);
        fileCmp(test, 'solvePath.jade');
        test.done();
    },
    autoprefixer: function (test) {
        test.expect(3);
        fileCmp(test, 'autoprefixer.min.css');
        var filename = grunt.file.expand('test/compiled/filerev.min.*.js')[0];
        filename = path.basename(filename);
        fileCmp(test, filename, 'filerev.min.js');
        var filerev = grunt.file.read('test/compiled/autoprefixer.jade');
        // script(src='test/compiled/filerev.min.da5bd415.js')
        test.ok(/test\/compiled\/filerev\.min\.(\w+)\.js/.test(filerev));
        test.done();
    }
};
