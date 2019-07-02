define([
        'intern',
        'intern!object',
        'intern/chai!assert',
        'ion-bundle',
        'dist/amd/es6/IonHash',
    ],
    function(intern, registerSuite, assert, ion, ionhash) {
        function ionHasherProvider() {
            return new IdentityIonHasher();
        };

        class IdentityIonHasher implements ionhash.IonHasher {
            private allBytes: number[] = [];
            update(bytes) {
                if (!(bytes instanceof Array)) {
                    bytes = [bytes];
                }
                bytes.forEach((b) => {
                    this.allBytes.push(b);
                });
            }
            digest() { return this.allBytes }
        };

        registerSuite({
            name: 'HashReader',
            base: () => {
                let reader = ion.makeReader('null null.string true 5 -5 2019-07-01T hello "hello"');
                //let reader = ion.makeReader('[1, 2, 3] (1 2 3) {a: 1, b: 2, c: 3}');
                //let reader = ion.makeReader('5 6 7');
                let hashReader = ionhash.hashReader(reader, ionHasherProvider);
                while (true) {
                    let ionType = hashReader.next();
                    if (ionType == undefined) {
                        break;
                    }
                    writeln("next(): " + ionType.name + ", " + ionType.bid + ", " + hashReader.value());
                }
                let digest = hashReader.digest();
                writeln("digest = " + toHexString(digest));
                assert(digest, "digest bytes");
            },
        });

        function toHexString(byteArray) {
            return Array.from(byteArray, function(b) {
                return ('0' + ((b as number) & 0xFF).toString(16)).slice(-2);
            }).join(' ')
        }

        let write = function (s) {
            process.stdout.write(s);
        };

        let writeln = function (s = "") {
            write(s + "\n");
        };

    }
);

