/// <reference types="intern" />

const { registerSuite } = intern.getPlugin('interface.object');
const { assert } = intern.getPlugin('chai');
import { readFileSync } from 'fs';

import * as ion from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/Ion';
import { hashReader, hashWriter, IonHasher } from '../src/IonHash';
import { toHexString, writeln } from '../src/util';
import { testIonHasherProvider, toString, writeTo } from './testutil';

// build the suite based on the contents of ion_hash_tests.ion
let suites = { };
['ReaderTest', 'WriterTest'].forEach(suite => {
    suites[suite] = { };
});

let ionTests = readFileSync('tests/ion_hash_tests.ion', 'utf8');
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
            suites['ReaderTest'][theTestName] = () => { runReaderTest(ionStr, algorithm, expects[algorithm]) };
            suites['WriterTest'][theTestName] = () => { runWriterTest(ionStr, algorithm, expects[algorithm]) };
        }
    }
    testCount++;
}
writeln("testCount: " + testCount);


// ask intern to execute the tests in each suite
for (const suite in suites) {
    registerSuite('IonHashTests.' + suite, suites[suite]);
}


function getExpectedDigest(expect): string {
    let expectedDigest;
    let reader = ion.makeReader(expect);
    reader.next();
    reader.stepIn();
    for (let type; type = reader.next(); ) {
        let annotation = reader.annotations()[0];
        if (annotation == 'digest' || annotation == 'final_digest') {
            expectedDigest = toHexString(sexpToBytes(reader));
        }
    }
    return expectedDigest;
}

function runReaderTest(ionStr, algorithm, expect) {
    let expectedDigest = getExpectedDigest(expect);
    let hr = hashReader(ion.makeReader(ionStr), testIonHasherProvider);
    traverse(hr);
    let actualDigest = toHexString(hr.digest());

    assert.equal(actualDigest, expectedDigest);
}

function runWriterTest(ionStr, algorithm, expect) {
    let expectedDigest = getExpectedDigest(expect);
    let reader = ion.makeReader(ionStr);
    let type = reader.next();
    let hw = hashWriter(ion.makeBinaryWriter(), testIonHasherProvider);
    writeTo(reader, type, hw);
    let actualDigest = toHexString(hw.digest());

    assert.equal(actualDigest, expectedDigest);
}

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
}

