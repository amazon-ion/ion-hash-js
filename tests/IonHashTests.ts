const { registerSuite } = intern.getPlugin('interface.object');
const { assert } = intern.getPlugin('chai');
import { readFileSync } from 'fs';

import * as ion from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/Ion';
import { Reader as IonReader } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonReader';
import { Writer as IonWriter } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonWriter';
import { makeHashReader, makeHashWriter } from '../src/IonHash';
import { sexpToBytes, testIonHasherProvider, toHexString, toString, writeln, writeTo } from './testutil';

// builds a test suite based on the contents of ion_hash_tests.ion

let digesters = {
    // BinaryReader: binaryReaderDigester,  // TBD commented out for now
    BinaryWriter: binaryWriterDigester,
    ReaderSkip: readerSkipDigester,
    TextReader: textReaderDigester,
    TextWriter: textWriterDigester,
};

let suites = { };
for (const digester in digesters) {
    suites[digester] = { };
}

let ionTests = readFileSync('tests/ion_hash_tests.ion', 'utf8');
let testCount = 0;
let reader = ion.makeReader(ionTests);
for (let type; type = reader.next(); ) {
    let testName;

    if (reader.annotations().length > 0) {
        testName = reader.annotations()[0];
    }

    let ionData: string | Uint8Array;
    reader.stepIn();
    type = reader.next();   // ion or 10n
    if (reader.fieldName() == '10n') {
        ionData = sexpToBytes(reader, { asIonBinary: true });
    } else {
        ionData = toString(reader, type);
        if (!testName) {
            testName = ionData;
        }
    }

    reader.next();          // expect

    reader.stepIn();
    let expects = {};
    for (let t; t = reader.next(); ) {
        let algorithm = reader.fieldName();
        expects[algorithm] = toString(reader, t);
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

function test(ionData: string | Uint8Array,
              algorithm: string,
              expect: string,
              digester: (ionData: string | Uint8Array, algorithm: string, hasherLog: string[]) => void): void {

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

function binaryReaderDigester(ionData: string | Uint8Array, algorithm: string, hasherLog: string[]): void {
    let reader = ion.makeReader(ionData);
    let writer = ion.makeBinaryWriter();
    let type = reader.next();
    writeTo(reader, type, writer);
    writer.close();
    let ionBinary = writer.getBytes();
    readerDigester(ion.makeReader(ionBinary), algorithm, hasherLog);
}

function textReaderDigester(ionData: string | Uint8Array, algorithm: string, hasherLog: string[]): void {
    readerDigester(ion.makeReader(ionData), algorithm, hasherLog);
}

function readerDigester(reader: IonReader, algorithm: string, hasherLog: string[]): void {
    function traverse(reader) {
        for (let type; type = reader.next(); ) {
            if (type.container && !reader.isNull()) {
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

function readerSkipDigester(ionData: string | Uint8Array, algorithm: string, hasherLog: string[]): void {
    let hashReader = makeHashReader(
        ion.makeReader(ionData),
        testIonHasherProvider(algorithm, hasherLog));
    hashReader.next();
    hashReader.next();
    hashReader.digest();
}

function binaryWriterDigester(ionData: string | Uint8Array, algorithm: string, hasherLog: string[]): void {
    writerDigester(ion.makeBinaryWriter(), ionData, algorithm, hasherLog);
}

function textWriterDigester(ionData: string, algorithm: string, hasherLog: string[]): void {
    writerDigester(ion.makeTextWriter(), ionData, algorithm, hasherLog);
}

function writerDigester(writer: IonWriter, ionData: string | Uint8Array, algorithm: string, hasherLog: string[]): void {
    let reader = ion.makeReader(ionData);
    let type = reader.next();
    let hashWriter = makeHashWriter(writer, testIonHasherProvider(algorithm, hasherLog));
    writeTo(reader, type, hashWriter);
    hashWriter.digest();
}

function getExpectedIonHasherLog(expect): string[] {
    let log: string[] = [];
    let reader = ion.makeReader(expect);
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

