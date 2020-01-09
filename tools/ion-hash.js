/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

let fs = require('fs');
let ion = require('ion-js');
let ionhash = require('../dist/commonjs/es5/IonHash');

if (process.argv.length < 4) {
    console.log("Utility that prints the Ion Hash of the top-level values in a file.");
    console.log();
    console.log("Usage:");
    console.log("  ion-hash [algorithm] [filename]");
    console.log();
    console.log("where [algorithm] is a hash function such as sha256");
    console.log();
    process.exit(1);
}

let algorithm = process.argv[2];
let filename = process.argv[3];

let values = fs.readFileSync(filename);
let reader = ion.makeReader(values);
let hasherProvider = new ionhash.cryptoHasherProvider(algorithm);
let hashReader = ionhash.makeHashReader(reader, hasherProvider);

let ionType = hashReader.next();
while (ionType) {
    try {
        ionType = hashReader.next();
        console.log(toHexString(hashReader.digest()));
    } catch (e) {
        console.log('[unable to digest: ' + e + ']');
    }
}

function toHexString(byteArray) {
    let sb = '';
    byteArray.forEach(b => {
        if (sb != '') { sb += ' ' }
        sb += ('0' + (b & 0xFF).toString(16)).slice(-2);
    });
    return sb;
}

