define([
        'intern',
        'intern!object',
        'intern/chai!assert',
        'dist/amd/es6/IonHash',
    ],
    function(intern, registerSuite, assert, ionhash) {
        registerSuite({
            name: "byteArrayComparator",
            equals: () => { test([0x01, 0x02, 0x03], [0x01, 0x02, 0x03], 0); },
            lessThan: () => { test([0x01, 0x02, 0x03], [0x01, 0x02, 0x04], -1); },
            lessThanDueToLength: () => { test([0x01, 0x02, 0x03], [0x01, 0x02, 0x03, 0x04], -1); },
            greaterThan: () => { test([0x01, 0x02, 0x04], [0x01, 0x02, 0x03], 1); },
            greaterThanDueToLength: () => { test([0x01, 0x02, 0x03, 0x04], [0x01, 0x02, 0x03], 1); },
            unsignedBehavior: () => {
                test([0x01], [0x7f], -1);
                test([0x01], [0x80], -1);
                test([0x01], [0xff], -1);
                test([0x7f], [0x01], 1);
                test([0x80], [0x01], 1);
                test([0xff], [0x01], 1);
            },
        });

        let test = function(a, b, expected) { assert.equal(ionhash.byteArrayComparator(a, b), expected); };
    }
);

