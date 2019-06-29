define([
        'intern',
        'intern!object',
        'intern/chai!assert',
        'ion-bundle',
        'dist/amd/es6/IonHash',
    ],
    function(intern, registerSuite, assert, ion, ionhash) {
        registerSuite({
            name: 'HashReader',
            base: () => {
                let reader = ion.makeReader('null true 5');
                let hashReader = ionhash.HashReader(reader, undefined);
                assert(hashReader.digest(), "digest bytes");
            },
        });
    }
);

