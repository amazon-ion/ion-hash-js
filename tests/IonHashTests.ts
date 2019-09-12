import {Tests} from "intern/lib/interfaces/object";

const {registerSuite} = intern.getPlugin('interface.object');
const {assert} = intern.getPlugin('chai');
import {readFileSync} from 'fs';

import {makeBinaryWriter, makeReader, makeTextWriter, Reader as IonReader, Writer as IonWriter} from 'ion-js';
import {makeHashReader, makeHashWriter} from '../src/IonHash';
import {sexpToBytes, testIonHasherProvider, toHexString, readerToString, writeln} from './testutil';

// builds a test suite based on the contents of ion_hash_tests.ion


interface Digester {
    (ionData: string | Uint8Array, algorithm: string, hasherLog: string[]): void;
}

let binaryReaderDigester: Digester = (ionData: string | Uint8Array, algorithm: string, hasherLog: string[]): void => {
    let reader = makeReader(ionData);
    let writer = makeBinaryWriter();
    reader.next();
    writer.writeValue(reader);
    writer.close();
    let ionBinary = writer.getBytes();
    readerDigester(makeReader(ionBinary), algorithm, hasherLog);
};

let textReaderDigester: Digester = (ionData: string | Uint8Array, algorithm: string, hasherLog: string[]): void => {
    readerDigester(makeReader(ionData), algorithm, hasherLog);
};

function readerDigester(reader: IonReader, algorithm: string, hasherLog: string[]): void {
    function traverse(reader: IonReader) {
        for (let type; type = reader.next(); ) {
            if (type.isContainer && !reader.isNull()) {
                reader.stepIn();
                traverse(reader);
                reader.stepOut();
            }
        }
    }
    let hashReader = makeHashReader(reader, testIonHasherProvider(algorithm, hasherLog));
    traverse(hashReader);
    hashReader.digest();
}

let readerSkipDigester: Digester = (ionData: string | Uint8Array, algorithm: string, hasherLog: string[]): void => {
    let hashReader = makeHashReader(
        makeReader(ionData),
        testIonHasherProvider(algorithm, hasherLog));
    hashReader.next();
    hashReader.next();
    hashReader.digest();
};

let binaryWriterDigester: Digester = (ionData: string | Uint8Array, algorithm: string, hasherLog: string[]): void => {
    writerDigester(makeBinaryWriter(), ionData, algorithm, hasherLog);
};

let textWriterDigester: Digester = (ionData: string | Uint8Array, algorithm: string, hasherLog: string[]): void => {
    writerDigester(makeTextWriter(), ionData, algorithm, hasherLog);
};

function writerDigester(writer: IonWriter, ionData: string | Uint8Array, algorithm: string, hasherLog: string[]): void {
    let reader = makeReader(ionData);
    reader.next();
    let hashWriter = makeHashWriter(writer, testIonHasherProvider(algorithm, hasherLog));
    hashWriter.writeValue(reader);
    hashWriter.digest();
}

let digesters: { [digesterName: string]: Digester } = {
    // BinaryReader: binaryReaderDigester,  // https://github.com/amzn/ion-hash-js/issues/3
    BinaryWriter: binaryWriterDigester,
    ReaderSkip: readerSkipDigester,
    TextReader: textReaderDigester,
    TextWriter: textWriterDigester,
};

function test(ionData: string | Uint8Array,
              algorithm: string,
              expect: string,
              digester: Digester): void {

    let expectedIonHasherLog = getExpectedIonHasherLog(expect);
    let actualIonHasherLog: string[] = [];

    digester(ionData, algorithm, actualIonHasherLog);

    if (expectedIonHasherLog.length == 1
        && expectedIonHasherLog[0].startsWith('final_digest::')) {
        assert.deepEqual('final_' + actualIonHasherLog.pop(), expectedIonHasherLog[0]);
    } else {
        if (algorithm == 'md5') {
            expectedIonHasherLog = expectedIonHasherLog.filter(
                entry => entry.startsWith('digest::'));
        }
        assert.deepEqual(actualIonHasherLog, expectedIonHasherLog);
    }
}

//let suites: { [digesterName: string]: [testName: string]: () => void } = { };
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
            suites[digester][theTestName] = () => {
                test(ionData, algorithm, expects[algorithm], digesters[digester]);
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


function getExpectedIonHasherLog(expect: string): string[] {
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

