define([
        'intern',
        'intern!object',
        'intern/chai!assert',
        '/Users/pcornell/dev/ion/ion-hash-js/ion-bundle.js',
        'dist/commonjs/es6/IonHash',
        'intern/dojo/node!http',
    ],
    function(intern, registerSuite, assert, ion, ionhash, http) {
        var suite = {
            name: 'Text nulls'
        };

        suite['null'] = function() {
            // test byteArrayComparator:
            assert(0, byteArrayComparator([0x01, 0x02, 0x03], [0x01, 0x02, 0x03]));
            assert(-1, byteArrayComparator([0x01, 0x02, 0x03], [0x01, 0x02, 0x04]));
            assert(-1, byteArrayComparator([0x01, 0x02, 0x03], [0x01, 0x02, 0x03, 0x04]));
            assert(1, byteArrayComparator([0x01, 0x02, 0x04], [0x01, 0x02, 0x03]));
            assert(1, byteArrayComparator([0x01, 0x02, 0x03, 0x04], [0x01, 0x02, 0x03]));

            // test unsigned behavior:
            assert(-1, byteArrayComparator([0x01], [0x7f]));
            assert(-1, byteArrayComparator([0x01], [0x80]));
            assert(-1, byteArrayComparator([0x01], [0xff]));
            assert(1, byteArrayComparator([0x7f], [0x01]));
            assert(1, byteArrayComparator([0x80], [0x01]));
            assert(1, byteArrayComparator([0xff], [0x01]));
        };

        registerSuite(suite);
    }
);

