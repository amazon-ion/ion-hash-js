const { registerSuite } = intern.getPlugin('interface.object');
const { assert } = intern.getPlugin('chai');
import { readFileSync } from 'fs';

import * as ion from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/Ion';
import { makeHashReader, makeHashWriter } from '../src/IonHash';
import { sexpToBytes, testIonHasherProvider, toHexString, toString, writeln, writeTo } from './testutil';

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
            //suites['ReaderTest'][theTestName] = () => { runReaderTest(ionStr, algorithm, expects[algorithm]) };
            suites['WriterTest'][theTestName] = () => { runWriterTest(ionStr, algorithm, expects[algorithm]) };
        }
    }
    testCount++;
    //if (testCount >= 1) break;
}
writeln("testCount: " + testCount);


// ask intern to execute the tests in each suite
for (const suite in suites) {
    registerSuite('IonHashTests.' + suite, suites[suite]);
}


function getExpectedIonHasherLog(expect): string[] {
    let log: string[] = [];
    let reader = ion.makeReader(expect);
    reader.next();
    reader.stepIn();
    for (let type; type = reader.next(); ) {
        let annotation = reader.annotations()[0];
        let byteString = toHexString(sexpToBytes(reader));
        if (annotation == 'final_digest') {
            log = [annotation + '::(' + byteString + ')'];
        } else {
            log.push(annotation + '::(' + byteString + ')');
        }
    }
    return log;
}

function runReaderTest(ionStr, algorithm, expect) {
    let expectedIonHasherLog = getExpectedIonHasherLog(expect);
    let actualIonHasherLog: string[] = [];

    let hashReader = makeHashReader(
            ion.makeReader(ionStr),
            testIonHasherProvider('identity', actualIonHasherLog));
    traverse(hashReader);
    hashReader.digest();

    if (expectedIonHasherLog.length == 1
            && expectedIonHasherLog[0].startsWith('final_digest::')) {
        assert.deepEqual('final_' + actualIonHasherLog.pop(), expectedIonHasherLog[0]);
    } else {
        assert.deepEqual(actualIonHasherLog, expectedIonHasherLog);
    }
}

function runWriterTest(ionStr, algorithm, expect) {
    let expectedIonHasherLog = getExpectedIonHasherLog(expect);
    let actualIonHasherLog: string[] = [];

    let reader = ion.makeReader(ionStr);
    let type = reader.next();
    let hashWriter = makeHashWriter(
        ion.makeBinaryWriter(),
        testIonHasherProvider('identity', actualIonHasherLog));
    writeTo(reader, type, hashWriter);
    hashWriter.digest();

    if (expectedIonHasherLog.length == 1
            && expectedIonHasherLog[0].startsWith('final_digest::')) {
        assert.deepEqual('final_' + actualIonHasherLog.pop(), expectedIonHasherLog[0]);
    } else {
        assert.deepEqual(actualIonHasherLog, expectedIonHasherLog);
    }
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


