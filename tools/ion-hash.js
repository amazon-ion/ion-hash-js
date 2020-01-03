/*
 * Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

let ion = require('ion-js');
let ionhash = require('../dist/commonjs/es5/IonHash');
let fs = require('fs');
let readline = require('readline');

let algorithm = process.argv[2];
let inputStream = process.stdin;
if (process.argv.length > 3) {
  inputStream = fs.createReadStream(process.argv[3]);
}
let hasherProvider = new ionhash.cryptoHasherProvider(algorithm);

readline.createInterface({
    input: inputStream,
    output: process.stdout,
    terminal: false
}).on('line', (line) => {
    try {
        let reader = ion.makeReader(line);
        let hashReader = ionhash.makeHashReader(reader, hasherProvider);
        hashReader.next();
        hashReader.next();
        console.log(toHexString(hashReader.digest()));
    } catch (e) {
        console.log('[unable to digest: ' + e + ']');
    }
});

function toHexString(byteArray) {
    let sb = '';
    byteArray.forEach(b => {
        if (sb != '') { sb += ' ' }
        sb += ('0' + (b & 0xFF).toString(16)).slice(-2);
    });
    return sb;
}

