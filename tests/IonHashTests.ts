define([
        'intern',
        'intern!object',
        'intern/chai!assert',
        'intern/dojo/node!fs',
        'ion-bundle',
        'dist/amd/es6/IonHash',
        'dist/amd/es6/util',
    ],
    function(intern, registerSuite, assert, fs, ion, ionhash, util) {
        class IdentityIonHasher implements ionhash.IonHasher {
            private allBytes: number[] = [];
            update(bytes: number | Uint8Array) {
                if (bytes['forEach'] != undefined) {
                    bytes.forEach((b) => {
                        this.allBytes.push(b);
                    });
                } else {
                    this.allBytes.push(bytes);
                }
            }
            digest() {
                let digest = this.allBytes;
                this.allBytes = [];
                return digest;
            }
        };

        function testIonHasherProvider() {
            return new IdentityIonHasher();
        };

        function writeTo(reader, type, writer, depth = 0) {
            if (depth > 0) {
                if (reader.fieldName() != undefined) {
                    writer.writeFieldName(reader.fieldName());
                }
            }
            if (reader.isNull()) {
                writer.writeNull(type.bid, reader.annotations());
            } else {
                switch (type) {
                    case ion.IonTypes.BOOL:      { writer.writeBoolean(reader.booleanValue(), reader.annotations()); break }
                    case ion.IonTypes.INT:       { writer.writeInt(reader.numberValue(), reader.annotations()); break }
                    case ion.IonTypes.FLOAT:     { writer.writeFloat64(reader.numberValue(), reader.annotations()); break }
                    case ion.IonTypes.DECIMAL:   { writer.writeDecimal(reader.decimalValue(), reader.annotations()); break }
                    case ion.IonTypes.TIMESTAMP: { writer.writeTimestamp(reader.timestampValue(), reader.annotations()); break }
                    case ion.IonTypes.SYMBOL:    { writer.writeSymbol(reader.stringValue(), reader.annotations()); break }
                    case ion.IonTypes.STRING:    { writer.writeString(reader.stringValue(), reader.annotations()); break }
                    case ion.IonTypes.CLOB:      { writer.writeClob(reader.value(), reader.annotations()); break }
                    case ion.IonTypes.BLOB:      { writer.writeBlob([1,2,3] /* TBD reader.byteValue()*/, reader.annotations()); break }
                    case ion.IonTypes.LIST:      { writer.writeList(reader.annotations()); break }
                    case ion.IonTypes.SEXP:      { writer.writeSexp(reader.annotations()); break }
                    case ion.IonTypes.STRUCT:    { writer.writeStruct(reader.annotations()); break }
                    default: throw new Error('unrecognized type' + type);
                }
                if (type.container) {
                    reader.stepIn();
                    for (let t; t = reader.next(); ) {
                        writeTo(reader, t, writer, depth + 1);
                    }
                    writer.endContainer();
                    reader.stepOut();
                }
            }
        }

        function toString(reader, type): string {
            let writer = ion.makeTextWriter();
            writeTo(reader, type, writer);
            return String.fromCharCode.apply(null, writer.getBytes());
        }


        // build the suite based on the contents of ion_hash_tests.ion
        let suite = { name: 'IonHashTests' };

        let ionTests = fs.readFileSync('tests/ion_hash_tests.ion', 'utf8');
        //let ionTests = fs.readFileSync('tests/test.ion', 'utf8');
        let testCount = 0;
        let reader = ion.makeReader(ionTests);
        for (let type; type = reader.next(); ) {
            let testName;

            if (reader.annotations().length > 0) {
                testName = reader.annotations()[0];
            }

            reader.stepIn();
            type = reader.next();   // ion or 10n
            let ionStr = toString(reader, type);

            reader.next();          // expect

            reader.stepIn();
            let expects = {};
            for (let t; t = reader.next(); ) {
                let algorithm = reader.fieldName();
                expects[algorithm] = toString(reader, t);
            }
            reader.stepOut();

            reader.stepOut();

            if (!testName) {
                testName = ionStr;
            }

            for (let algorithm in expects) {
                let theTestName = testName;
                if (algorithm != 'identity') {
                    theTestName = testName + '.' + algorithm;
                }

                if (algorithm == 'identity') {   // TBD remove to enable MD5 tests
                    suite[theTestName] = () => {
                        runTest(ionStr, algorithm, expects[algorithm]);
                    };
                }
            }
            testCount++;
        }
        util.writeln("testCount: " + testCount);


        // ask intern to execute the tests
        registerSuite(suite);


        function runTest(ionStr, algorithm, expect) {
            let expectedDigest;
            let reader = ion.makeReader(expect);
            reader.next();
            reader.stepIn();
            for (let type; type = reader.next(); ) {
                let annotation = reader.annotations()[0];
                if (annotation == 'digest' || annotation == 'final_digest') {
                    expectedDigest = util.toHexString(sexpToBytes(reader));
                }
            }

            let hashReader = ionhash.hashReader(ion.makeReader(ionStr), testIonHasherProvider);
            traverse(hashReader);
            //hashReader.next();
            let actualDigest = util.toHexString(hashReader.digest());

            assert.equal(actualDigest, expectedDigest);
        };

        function traverse(reader) {
            for (let type; type = reader.next(); ) {
                if (type.container && !reader.isNull()) {
                    reader.stepIn();
                    traverse(reader);
                    reader.stepOut();
                }
            }
        }

        function sexpToBytes(reader): number[] {
            let bytes: number[] = [];
            reader.stepIn();
            for (let type; type = reader.next(); ) {
                bytes.push(reader.numberValue());
            }
            reader.stepOut();
            return bytes;
        };
    }
);

