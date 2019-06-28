define([
        'intern',
        'intern!object',
        'intern/chai!assert',
        'dist/amd/es6/IonHash',
    ],
    function(intern, registerSuite, assert, ionhash) {
        var suite = {
            name: 'byteArrayComparator'
        };

        suite['equals'] = function() {
            assert.equal(ionhash.byteArrayComparator([0x01, 0x02, 0x03], [0x01, 0x02, 0x03]), 0);
        };

        suite['lessThan'] = function() {
            assert.equal(ionhash.byteArrayComparator([0x01, 0x02, 0x03], [0x01, 0x02, 0x04]), -1);
        };

        suite['lessThanDueToLength'] = function() {
            assert.equal(ionhash.byteArrayComparator([0x01, 0x02, 0x03], [0x01, 0x02, 0x03, 0x04]), -1);
        };

        suite['greaterThan'] = function() {
            assert.equal(ionhash.byteArrayComparator([0x01, 0x02, 0x04], [0x01, 0x02, 0x03]), 1);
        };

        suite['greaterThanDueToLength'] = function() {
            assert.equal(ionhash.byteArrayComparator([0x01, 0x02, 0x03, 0x04], [0x01, 0x02, 0x03]), 1);
        };

        suite['unsignedBehavior'] = function() {
            assert.equal(ionhash.byteArrayComparator([0x01], [0x7f]), -1);
            assert.equal(ionhash.byteArrayComparator([0x01], [0x80]), -1);
            assert.equal(ionhash.byteArrayComparator([0x01], [0xff]), -1);
            assert.equal(ionhash.byteArrayComparator([0x7f], [0x01]), 1);
            assert.equal(ionhash.byteArrayComparator([0x80], [0x01]), 1);
            assert.equal(ionhash.byteArrayComparator([0xff], [0x01]), 1);
        };

        registerSuite(suite);
    }
);

