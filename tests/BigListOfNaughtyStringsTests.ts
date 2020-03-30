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

import {load, makeBinaryWriter, makeReader} from 'ion-js';

const {registerSuite} = intern.getPlugin('interface.object');
const {assert} = intern.getPlugin('chai');
import {readFileSync} from 'fs';

import {digest, HashReader, HashWriter, makeHashReader, makeHashWriter} from '../src/IonHash';
import {testHasherProvider, toHexString, writeln} from './testutil';

class TestValue {
    private static ionPrefix = 'ion::';
    private static invalidIonPrefix = 'invalid_ion::';

    readonly validIon: boolean | null;

    constructor(public readonly inputValue: string) {
        this.validIon = null;

        if (this.inputValue.startsWith(TestValue.ionPrefix)) {
            this.validIon = true;
            this.inputValue = this.inputValue.substring(TestValue.ionPrefix.length);
        }

        if (this.inputValue.startsWith(TestValue.invalidIonPrefix)) {
            this.validIon = false;
            this.inputValue = this.inputValue.substring(TestValue.invalidIonPrefix.length);
        }
    }

    symbol() {
        let s = this.inputValue;
        s = s.replace(/\\/g, '\\\\');
        s = s.replace(/'/g, "\\'");
        return "\'" + s + "\'";
    }

    string() {
        let s = this.inputValue;
        s = s.replace(/\\/g, '\\\\');
        s = s.replace(/"/g, '\\\"');
        return "\"" + s + "\"";
    }

    long_string() {
        let s = this.inputValue;
        s = s.replace(/\\/g, '\\\\');
        s = s.replace(/'/g, "\\'");
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
        let buffer = Buffer.from(this.inputValue, 'utf8');
        return '{{' + buffer.toString('base64') + '}}';
    }
}

// build the suite based on the contents of big_list_of_naughty_strings.txt
let suite: { [testName: string]: () => void } = { };
readFileSync('ion-hash-test/big_list_of_naughty_strings.txt', 'utf-8')
    .split(/\r?\n/)
    .filter(line => !(line == '' || line[0] == '#'))
    .forEach(line => {
        let tv = new TestValue(line);

        let strings: string[] = [];
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
            strings.push(tv.inputValue);
            strings.push(tv.symbol() + "::" + tv.inputValue);
            strings.push(tv.symbol() + "::{" + tv.symbol() + ":" + tv.inputValue + "}");
            strings.push(tv.symbol() + "::{" + tv.symbol() + ":" + tv.symbol() + "::" + tv.inputValue + "}");
        }

        // list
        strings.push(
            tv.symbol() + "::["
                + tv.symbol() + ", "
                + tv.string() + ", "
                + tv.long_string() + ", "
                + tv.clob() + ", "
                + tv.blob() + ", "
                + (tv.validIon ? tv.inputValue : '')
                + "]");

        // sexp
        strings.push(
            tv.symbol() + "::("
                + tv.symbol() + " "
                + tv.string() + " "
                + tv.long_string() + " "
                + tv.clob() + " "
                + tv.blob() + " "
                + (tv.validIon ? tv.inputValue : '')
                + ")");

        // multiple annotations
        strings.push(tv.symbol() + "::" + tv.symbol() + "::" + tv.symbol() + "::" + tv.string());

        strings.forEach(str => {
            suite[str] = () => runTest(tv, str);
        });
    });

// ask intern to execute the tests
registerSuite('BigListOfNaughtyStringsTests', suite);


function runTest(tv: TestValue, testString: string) {
    let hashWriter: HashWriter;
    try {
        let reader = makeReader(testString);
        hashWriter = makeHashWriter(makeBinaryWriter(), testHasherProvider('md5'));
        reader.next();
        hashWriter.writeValue(reader);
    } catch (e) {
        writeln(e);
        if (tv.validIon) {
            throw e;
        }
    }

    let hashReader: HashReader;
    try {
        let reader = makeReader(testString);
        hashReader = makeHashReader(reader, testHasherProvider('md5'));
        hashReader.next();
        hashReader.next();
    } catch (e) {
        writeln(e);
        if (tv.validIon) {
            throw e;
        }
    }

    if (tv.validIon == null || tv.validIon) {
        let writerDigest = toHexString(hashWriter!.digest());
        assert.deepEqual(writerDigest, toHexString(hashReader!.digest()));
        assert.deepEqual(writerDigest, toHexString(digest(load(testString), 'md5')));
    }
}

