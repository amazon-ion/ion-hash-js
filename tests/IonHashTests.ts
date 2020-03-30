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

import {Tests} from "intern/lib/interfaces/object";

const {registerSuite} = intern.getPlugin('interface.object');
const {assert} = intern.getPlugin('chai');
import {readFileSync} from 'fs';

import {load, makeBinaryWriter, makeReader, makeTextWriter, Reader, Writer} from 'ion-js';
import {makeHashReader, makeHashWriter} from '../src/IonHash';
import * as ionhash from '../src/IonHash';
import {sexpToBytes, testHasherProvider, toHexString, readerToString, writeln} from './testutil';

// builds a test suite based on the contents of ion_hash_tests.ion


interface Digester {
    (ionData: string | Uint8Array, algorithm: string, hasherLog: string[]): void;
}

let binaryReaderDigester: Digester = (ionData: string | Uint8Array,
                                      algorithm: string,
                                      hasherLog: string[]): void => {
    let reader = makeReader(ionData);
    let writer = makeBinaryWriter();
    reader.next();
    writer.writeValue(reader);
    writer.close();
    let ionBinary = writer.getBytes();
    readerDigester(makeReader(ionBinary), algorithm, hasherLog);
};

let textReaderDigester: Digester = (ionData: string | Uint8Array,
                                    algorithm: string,
                                    hasherLog: string[]): void => {
    readerDigester(makeReader(ionData), algorithm, hasherLog);
};

function readerDigester(reader: Reader, algorithm: string, hasherLog: string[]): void {
    function traverse(reader: Reader) {
        for (let type; type = reader.next(); ) {
            if (type.isContainer && !reader.isNull()) {
                reader.stepIn();
                traverse(reader);
                reader.stepOut();
            }
        }
    }
    let hashReader = makeHashReader(reader, testHasherProvider(algorithm, hasherLog));
    traverse(hashReader);
    hashReader.digest();
}

let readerSkipDigester: Digester = (ionData: string | Uint8Array,
                                    algorithm: string,
                                    hasherLog: string[]): void => {
    let hashReader = makeHashReader(
        makeReader(ionData),
        testHasherProvider(algorithm, hasherLog));
    hashReader.next();
    hashReader.next();
    hashReader.digest();
};

let binaryWriterDigester: Digester = (ionData: string | Uint8Array,
                                      algorithm: string,
                                      hasherLog: string[]): void => {
    writerDigester(makeBinaryWriter(), ionData, algorithm, hasherLog);
};

let textWriterDigester: Digester = (ionData: string | Uint8Array,
                                    algorithm: string,
                                    hasherLog: string[]): void => {
    writerDigester(makeTextWriter(), ionData, algorithm, hasherLog);
};

function writerDigester(writer: Writer,
                        ionData: string | Uint8Array,
                        algorithm: string,
                        hasherLog: string[]): void {
    let reader = makeReader(ionData);
    reader.next();
    let hashWriter = makeHashWriter(writer, testHasherProvider(algorithm, hasherLog));
    hashWriter.writeValue(reader);
    hashWriter.digest();
}

let digestFunctionDigester: Digester = (ionData: string | Uint8Array,
                                        algorithm: string,
                                        hasherLog: string[]): void => {
    let value = load(ionData);
    let digest = ionhash.digest(value, algorithm);
    hasherLog.push('final_digest::(' + toHexString(digest) + ')');
};

let digesters: { [digesterName: string]: Digester } = {
    BinaryReader: binaryReaderDigester,
    BinaryWriter: binaryWriterDigester,
    ReaderSkip: readerSkipDigester,
    TextReader: textReaderDigester,
    TextWriter: textWriterDigester,
    digestFunction: digestFunctionDigester,
};

function test(ionData: string | Uint8Array,
              algorithm: string,
              expect: string,
              digester: Digester): void {

    let expectedHasherLog = getExpectedHasherLog(expect);
    let actualHasherLog: string[] = [];

    digester(ionData, algorithm, actualHasherLog);

    if (expectedHasherLog.length == 1
            && expectedHasherLog[0].startsWith('final_digest::')) {
        assert.deepEqual('final_' + actualHasherLog.pop(), expectedHasherLog[0]);

    } else if (actualHasherLog.length == 1
            && actualHasherLog[0].startsWith('final_digest::')) {
        // added so the digestFunction digester can assert against just the final
        // expected md5 hash (as it can't provide intermediate md5 hashes):
        assert.deepEqual(actualHasherLog[0], 'final_' + expectedHasherLog.pop());

    } else {
        if (algorithm == 'md5') {
            expectedHasherLog = expectedHasherLog.filter(
                entry => entry.startsWith('digest::'));
        }
        assert.deepEqual(actualHasherLog, expectedHasherLog);
    }
}

let suites: { [digesterName: string]: Tests } = { };
for (const digester in digesters) {
    suites[digester] = { };
}

let ionTests = readFileSync('tests/ion_hash_tests.ion', 'utf8');
let testCount = 0;
let reader = makeReader(ionTests);
for (let type; type = reader.next(); ) {
    let testName = '';

    if (reader.annotations().length > 0) {
        testName = reader.annotations()[0];
    }

    let ionData: string | Uint8Array;
    reader.stepIn();
    reader.next();   // ion or 10n
    if (reader.fieldName() == '10n') {
        ionData = sexpToBytes(reader, { asIonBinary: true });
    } else {
        ionData = readerToString(reader);
        if (!testName) {
            testName = ionData;
        }
    }

    reader.next();          // expect

    reader.stepIn();
    let expects: { [algorithm: string]: string } = {};
    for (let t; t = reader.next(); ) {
        let algorithm = reader.fieldName();
        if (algorithm !== null) {
            expects[algorithm] = readerToString(reader);
        }
    }
    reader.stepOut();

    reader.stepOut();

    for (let algorithm in expects) {
        let theTestName = testName;
        if (algorithm != 'identity') {
            theTestName = testName + '.' + algorithm;
        }

        for (const digester in digesters) {
            if (!(digester == 'digestFunction' && algorithm == 'identity')) {
                suites[digester][theTestName] = () => {
                    test(ionData, algorithm, expects[algorithm], digesters[digester]);
                }
            }
        }
    }
    testCount++;
}
writeln("testCount: " + testCount);


// ask intern to execute the tests in each suite
for (const suite in suites) {
    registerSuite('IonHashTests.' + suite, suites[suite]);
}


function getExpectedHasherLog(expect: string): string[] {
    let log: string[] = [];
    let reader = makeReader(expect);
    reader.next();
    reader.stepIn();
    for (let type; type = reader.next(); ) {
        let annotation = reader.annotations()[0];
        let byteString = annotation + '::(' + toHexString(sexpToBytes(reader)) + ')';
        if (annotation == 'final_digest') {
            log = [byteString];
        } else {
            log.push(byteString);
        }
    }
    return log;
}

