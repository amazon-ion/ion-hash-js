define([
        'intern',
        'intern!object',
        'intern/chai!assert',
        //'dist/amd/es6/IonTests',
    ],
    function(intern, registerSuite, assert, ion) {
        var suite = {
            name: 'Text nulls'
        };

        suite['null'] = function() {
            process.stdout.write("BEGIN test_escape null test!\n");
            assert([], escape([]));
            assert([0x10, 0x11, 0x12, 0x13], escape([0x10, 0x11, 0x12, 0x13]));
            assert([0x0c, 0x0b], escape([0x0b]));
            assert([0x0c, 0x0e], escape([0x0e]));
            assert([0x0c, 0x0c], escape([0x0c]));
            assert([0x0c, 0x0b, 0x0c, 0x0e, 0x0c, 0x0c], escape([0x0b, 0x0e, 0x0c]));
            assert([0x0c, 0x0c, 0x0c, 0x0c], escape([0x0c, 0x0c]));
            assert([0x0c, 0x0c, 0x10, 0x0c, 0x0c, 0x11, 0x0c, 0x0c, 0x12, 0x0c, 0x0c], escape([0x0c, 0x10, 0x0c, 0x11, 0x0c, 0x12, 0x0c]));
        };


        /*
            var reader = ion.makeReader("null");
            assert.equal(reader.next(), ion.IonTypes.NULL);
            assert.equal(reader.next(), undefined);
        };

        suite['stepIntoNullContainer'] = function() {
            var reader = ion.makeReader("null.list");
            assert.equal(reader.next(), ion.IonTypes.LIST);
            assert.isTrue(reader.isNull());

            var fail = true;
            try {
                reader.stepIn();
            } catch(e) {
                fail = false;
            }
            assert.isFalse(fail, "Stepped into null container");
        }
        */

        registerSuite(suite);
    }
);
