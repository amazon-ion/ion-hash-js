# Amazon Ion Hash JavaScript

An implementation of [Amazon Ion Hash](http://amzn.github.io/ion-hash) in JavaScript.

[![Build Status](https://travis-ci.org/amzn/ion-hash-js.svg?branch=master)](https://travis-ci.org/amzn/ion-hash-js)
[![npm version](https://img.shields.io/npm/v/ion-hash-js.svg)](https://www.npmjs.com/package/ion-hash-js)
[![license](https://img.shields.io/hexpm/l/plug.svg)](https://github.com/amzn/ion-hash-js/blob/master/LICENSE)
[![docs](https://img.shields.io/badge/docs-api-green.svg?style=flat-square)](https://amzn.github.io/ion-hash-js/api)

## Getting Started

This library is designed to work with Node 8/ES5/CommonJS.

## Node

1. Add dependencies for ion-hash-js and its peerDependencies:
    ```
    npm install --save-dev ion-hash-js
    npm install --save-dev ion-js
    npm install --save-dev jsbi
    ```

1. Note the examples below assume the availability of
   the following utility method:
    ```javascript
    function toHexString(byteArray) {
        let sb = '';
        byteArray.forEach(b => {
            if (sb != '') { sb += ' ' }
            sb += ('0' + (b & 0xFF).toString(16)).slice(-2);
        });
        return sb;
    }
    ```

1. Use the library to generate the Ion hash of any value:
    ```javascript
    let ionHash = require('ion-hash-js');

    let digest = ionHash.digest([1, 2, 3], 'md5');
    console.log('digest: ' + toHexString(digest));
    ```

    produces:

    ```digest:  8f 3b f4 b1 93 5c f4 69 c9 c1 0c 31 52 4b 26 25```

1. Use cases for which a more efficient API is preferable
   should consider using the low-level HashReader API
   to generate an Ion hash:

    ```javascript
    let ion = require('ion-js');
    let ionHash = require('ion-hash-js');

    let ionStr = '[1, 2, 3]';
    let hashReader = ionHash.makeHashReader(
        ion.makeReader(ionStr),
        ionHash.cryptoHasherProvider('md5'));
    hashReader.next();
    hashReader.next();

    let digest = hashReader.digest();
    console.log('digest: ' + toHexString(digest));
    ```

    produces:

    ```digest:  8f 3b f4 b1 93 5c f4 69 c9 c1 0c 31 52 4b 26 25```

1. A low-level HashWriter API may be used to generate an Ion hash
   while writing Ion data:
    ```javascript
    let ion = require('ion-js');
    let ionHash = require('ion-hash-js');

    let hashWriter = ionHash.makeHashWriter(
        ion.makeTextWriter(),
        ionHash.cryptoHasherProvider('md5'));
    hashWriter.stepIn(ion.IonTypes.LIST);
    hashWriter.writeInt(1);
    hashWriter.writeInt(2);
    hashWriter.writeInt(3);
    hashWriter.stepOut();

    let digest = hashWriter.digest();
    console.log('digest: ' + toHexString(digest));
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


## License

This library is licensed under the Apache 2.0 License. 
