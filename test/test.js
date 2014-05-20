'use strict';
var grunt = require('grunt');

var fileCmp = function (test, fileName) {
    var actual = grunt.file.read('./test/compiled/' + fileName);
    var expected = grunt.file.read('./test/expected/' + fileName);
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
    }
};
