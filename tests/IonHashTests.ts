/// <reference types="intern" />

const { registerSuite } = intern.getPlugin('interface.object');
const { assert } = intern.getPlugin('chai');
import { readFileSync } from 'fs';

import * as ion from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/Ion';
import { hashReader, hashWriter, IonHasher } from '../src/IonHash';
import { toHexString, writeln } from '../src/util';


/*
let reader = ion.makeReader(
    'null null.null null.bool null.int null.float null.decimal null.timestamp'
    + ' null.symbol null.string null.clob null.blob null.list null.sexp null.struct'
    + ' false 5 5e0 5d0 2017T hi "hi" {{"hi"}} {{aGVsbGB=}} [] () {}'
    + ' 0 -0 0e0 -0e0 0d0 -0d0'
);
writeln('isNull: ' + reader.isNull());
for (let type; type = reader.next(); ) {
    let value;
    try {
        value = reader.value();
    } catch (e) {
        writeln('  ' + e);
    }
    writeln('type: ' + type.name + ', isNull: ' + reader.isNull() + ', value: ' + value + ',  sign: ' + Math.sign(value));
}
writeln('isNull: ' + reader.isNull());
 */


class IdentityIonHasher implements IonHasher {
    private allBytes: number[] = [];
    update(bytes: number | Uint8Array) {
        if (bytes['forEach'] != undefined) {
            (bytes as Uint8Array).forEach((b) => {
                this.allBytes.push(b);
            });
        } else {
            this.allBytes.push(bytes as number);
        }
    }
    digest() {
        let digest = this.allBytes;
        this.allBytes = [];
        return digest;
    }
};

function testIonHasherProvider() {
    return new IdentityIonHasher();
};

function writeTo(reader, type, writer, depth = 0) {
    if (depth > 0) {
        if (reader.fieldName() != undefined) {
            writer.writeFieldName(reader.fieldName());
        }
    }
    if (reader.isNull()) {
        writer.writeNull(type.bid, reader.annotations());
    } else {
        switch (type) {
            case ion.IonTypes.BOOL:      { writer.writeBoolean(reader.booleanValue(), reader.annotations()); break }
            case ion.IonTypes.INT:       { writer.writeInt(reader.numberValue(), reader.annotations()); break }
            case ion.IonTypes.FLOAT:     { writer.writeFloat64(reader.numberValue(), reader.annotations()); break }
            case ion.IonTypes.DECIMAL:   { writer.writeDecimal(reader.decimalValue(), reader.annotations()); break }
            case ion.IonTypes.TIMESTAMP: { writer.writeTimestamp(reader.timestampValue(), reader.annotations()); break }
            case ion.IonTypes.SYMBOL:    { writer.writeSymbol(reader.stringValue(), reader.annotations()); break }
            case ion.IonTypes.STRING:    { writer.writeString(reader.stringValue(), reader.annotations()); break }
            case ion.IonTypes.CLOB:      { writer.writeClob(reader.value(), reader.annotations()); break }
            case ion.IonTypes.BLOB:      { writer.writeBlob(reader.byteValue(), reader.annotations()); break }
            case ion.IonTypes.LIST:      { writer.writeList(reader.annotations()); break }
            case ion.IonTypes.SEXP:      { writer.writeSexp(reader.annotations()); break }
            case ion.IonTypes.STRUCT:    { writer.writeStruct(reader.annotations()); break }
            default: throw new Error('unrecognized type' + type);
        }
        if (type.container) {
            reader.stepIn();
            for (let t; t = reader.next(); ) {
                writeTo(reader, t, writer, depth + 1);
            }
            writer.endContainer();
            reader.stepOut();
        }
    }
}

function toString(reader, type): string {
    let writer = ion.makeTextWriter();
    writeTo(reader, type, writer);
    return String.fromCharCode.apply(null, writer.getBytes());
}


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

