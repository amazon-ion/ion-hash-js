## ion-hash-js

A JavaScript implementation of the Ion Hash Specification.

## License

This library is licensed under the Apache 2.0 License. 
=======
An implementation of [Amazon Ion Hash](https://amzn.github.io/ion-hash/docs/spec.html) for JavaScript.

[![Build Status](https://travis-ci.org/amzn/ion-hash-js.svg?branch=master)](https://travis-ci.org/amzn/ion-hash-js)
[![npm version](https://img.shields.io/npm/v/ion-hash-js.svg)](https://www.npmjs.com/package/ion-hash-js)
[![license](https://img.shields.io/hexpm/l/plug.svg)](https://github.com/amzn/ion-hash-js/blob/master/LICENSE)
[![docs](https://img.shields.io/badge/docs-api-green.svg?style=flat-square)](https://amzn.github.io/ion-hash-js/api)

# Getting Started

This library is designed to work with Node 8/ES5/CommonJS.

## Node

1. Add ion-hash-js to your dependencies using npm:
    ```
    npm install --save ion-hash-js
    ```
1. Use the library to read an Ion value and generate an Ion hash:
    ```javascript
    import * as ion from 'ion-js';
    import {cryptoIonHasherProvider, makeHashReader} from 'ion-hash-js';
    
    let ionStr = '[1, 2, 3]';
    let hashReader = makeHashReader(
            ion.makeReader(ionStr),
            cryptoIonHasherProvider('md5'));
    hashReader.next();
    hashReader.next();
    let digest = hashReader.digest();
    
    process.stdout.write('digest:  ');
    digest.forEach((b: number) => {
        process.stdout.write(('0' + (b & 0xFF).toString(16)).slice(-2) + ' ');
    });
    process.stdout.write('\n');
    ```

    produces:

    ```digest:  8f 3b f4 b1 93 5c f4 69 c9 c1 0c 31 52 4b 26 25```

1. Use the library to write Ion data:
    ```javascript
    import * as ion from 'ion-js';
    import {IonTypes} from 'ion-js';
    import {cryptoIonHasherProvider, makeHashWriter} from 'ion-hash-js';

    let hashWriter = makeHashWriter(
            ion.makeTextWriter(),
            cryptoIonHasherProvider('md5'));
    hashWriter.stepIn(IonTypes.LIST);
    hashWriter.writeInt(1);
    hashWriter.writeInt(2);
    hashWriter.writeInt(3);
    hashWriter.stepOut();
    let digest = hashWriter.digest();

    process.stdout.write('digest:  ');
    digest.forEach((b: number) => {
        process.stdout.write(('0' + (b & 0xFF).toString(16)).slice(-2) + ' ');
    });
    process.stdout.write('\n');
    ```

    produces:

    ```digest:  8f 3b f4 b1 93 5c f4 69 c9 c1 0c 31 52 4b 26 25```


## Development

This repository contains a [git submodule](https://git-scm.com/docs/git-submodule)
called `ion-hash-test`, which holds test data used by `ion-hash-js`'s unit tests.

The easiest way to clone the `ion-hash-js` repository and initialize its `ion-hash-test`
submodule is to run the following command:

```
$ git clone --recursive https://github.com/amzn/ion-hash-js.git ion-hash-js
```

Alternatively, the submodule may be initialized independently from the clone
by running the following commands:

```
$ git submodule init
$ git submodule update
```


## Known Issues

Any tests commented out in [tests/ion_hash_tests.ion](https://github.com/amzn/ion-hash-js/blob/master/tests/ion_hash_tests.ion)
are not expected to work at this time.
