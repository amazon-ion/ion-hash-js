define([
        'intern',
        'intern!object',
        'intern/chai!assert',
        'intern/dojo/node!fs',
        '/Users/pcornell/dev/ion/ion-js.development/dist/browser/js/ion-bundle',
        'dist/amd/es6/IonHash',
        'dist/amd/es6/util',
    ],
    function(intern, registerSuite, assert, fs, ion, ionhash, util) {
        class TestValue {
            private static ionPrefix = 'ion::';
            private static invalidIonPrefix = 'invalid_ion::';

            readonly ion: string;
            readonly validIon: boolean;

            constructor(str) {
                this.ion = str;
                this.validIon = null;

                if (this.ion.startsWith(TestValue.ionPrefix)) {
                    this.validIon = true;
                    this.ion = this.ion.substring(TestValue.ionPrefix.length);
                }

                if (this.ion.startsWith(TestValue.invalidIonPrefix)) {
                    this.validIon = false;
                    this.ion = this.ion.substring(TestValue.invalidIonPrefix.length);
                }
            }

            symbol() {
                let s = this.ion;
                s = s.replace("\\", "\\\\");
                s = s.replace("'", "\\'");
                return "\'" + s + "\'";
            }

            string() {
                let s = this.ion;
                s = s.replace("\\", "\\\\");
                s = s.replace("\"", "\\\"");
                return "\"" + s + "\"";
            }

            long_string() {
                let s = this.ion;
                s = s.replace("\\", "\\\\");
                s = s.replace("'", "\\'");
                return "'''" + s + "'''";
            }

            clob() {
                let buffer = Buffer.from(this.string(), 'utf8');
                let sb = '';
                for (let i = 0; i < buffer.length; i++) {
                    let b = buffer[i];
                    if (b >= 128) {
                        sb += "\\x" + b.toString(16);
                    } else {
                        sb += String.fromCharCode(b);
                    }
                }
                return '{{' + sb + '}}';
            }

            blob() {
                let buffer = Buffer.from(this.ion, 'utf8');
                return '{{' + buffer.toString('base64') + '}}';
            }
        }

        // build the suite based on the contents of big-list-of-naughty-strings.txt
        let strings: string[] = [];
        fs.readFileSync('tests/big-list-of-naughty-strings.txt', 'utf-8')
            .split(/\r?\n/)
            .filter(line => !(line == '' || line[0] == '#'))
            .forEach(line => {
                let tv = new TestValue(line);

                strings.push(tv.symbol());
                strings.push(tv.string());
                strings.push(tv.long_string());
                strings.push(tv.clob());
                strings.push(tv.blob());

                strings.push(tv.symbol() + "::" + tv.symbol());
                strings.push(tv.symbol() + "::" + tv.string());
                strings.push(tv.symbol() + "::" + tv.long_string());
                strings.push(tv.symbol() + "::" + tv.clob());
                strings.push(tv.symbol() + "::" + tv.blob());

                strings.push(tv.symbol() + "::{" + tv.symbol() + ":" + tv.symbol() + "}");
                strings.push(tv.symbol() + "::{" + tv.symbol() + ":" + tv.string() + "}");
                strings.push(tv.symbol() + "::{" + tv.symbol() + ":" + tv.long_string() + "}");
                strings.push(tv.symbol() + "::{" + tv.symbol() + ":" + tv.clob() + "}");
                strings.push(tv.symbol() + "::{" + tv.symbol() + ":" + tv.blob() + "}");

                if (tv.validIon) {
                    strings.push(tv.ion);
                    strings.push(tv.symbol() + "::" + tv.ion);
                    strings.push(tv.symbol() + "::{" + tv.symbol() + ":" + tv.ion + "}");
                    strings.push(tv.symbol() + "::{" + tv.symbol() + ":" + tv.symbol() + "::" + tv.ion + "}");
                }

                // list
                strings.push(
                    tv.symbol() + "::["
                        + tv.symbol() + ", "
                        + tv.string() + ", "
                        + tv.long_string() + ", "
                        + tv.clob() + ", "
                        + tv.blob() + ", "
                        + (tv.validIon ? tv.ion : '')
                        + "]");

                // sexp
                strings.push(
                    tv.symbol() + "::("
                        + tv.symbol() + " "
                        + tv.string() + " "
                        + tv.long_string() + " "
                        + tv.clob() + " "
                        + tv.blob() + " "
                        + (tv.validIon ? tv.ion : '')
                        + ")");

                // multiple annotations
                strings.push(tv.symbol() + "::" + tv.symbol() + "::" + tv.symbol() + "::" + tv.string());
            });

        let suite = { name: 'BigListOfNaughtyStringsTests' };
        let testCount = 0;
        strings.forEach(str => {
            //if (str == "'undefined'::{'undefined':'undefined'}") {
                suite[str] = () => {
                    runTest(str);
                };
                testCount++;
            //}
        });
        util.writeln("testCount: " + testCount);

        // ask intern to execute the tests
        registerSuite(suite);

        // TBD this is a clone; promote to ion-js?
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
                    case ion.IonTypes.BLOB:      { writer.writeBlob(reader.byteValue(), reader.annotations()); break }
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

        // TBD clone from IonHashTests
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

        function runTest(testString) {
            let tv = new TestValue(testString);
            let hashWriter;
            try {
                let reader = ion.makeReader(tv.ion);
                let type = reader.next();
                hashWriter = ionhash.hashWriter(ion.makeBinaryWriter(), testIonHasherProvider);
                writeTo(reader, type, hashWriter);
            } catch (e) {
                if (tv.validIon) {
                    throw e;
                }
            }

            let hashReader;
            try {
                let reader = ion.makeReader(tv.ion);
                hashReader = ionhash.hashReader(reader, testIonHasherProvider);
                hashReader.next();
                hashReader.next();
            } catch (e) {
                util.writeln(e);
                if (tv.validIon) {
                    throw e;
                }
            }

            if (tv.validIon == null || tv.validIon) {
                assert.equal(util.toHexString(hashWriter.digest()),
                    util.toHexString(hashReader.digest()));
            }
        };
    }
);

