/// <reference types="intern" />

const { registerSuite } = intern.getPlugin('interface.object');
const { assert } = intern.getPlugin('chai');
import { readFileSync } from 'fs';

import * as ion from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/Ion';
import { hashReader, hashWriter, IonHasher } from '../src/IonHash';
import { toHexString, writeln } from '../src/util';

class TestValue {
    private static ionPrefix = 'ion::';
    private static invalidIonPrefix = 'invalid_ion::';

    readonly validIon: boolean;

    constructor(public ion: string) {
        this.validIon = null;

        if (this.ion.startsWith(TestValue.ionPrefix)) {
            this.validIon = true;
            this.ion = this.ion.substring(TestValue.ionPrefix.length);
        }

        if (this.ion.startsWith(TestValue.invalidIonPrefix)) {
            this.validIon = false;
            this.ion = this.ion.substring(TestValue.invalidIonPrefix.length);
        }
    }

    symbol() {
        let s = this.ion;
        s = s.replace("\\", "\\\\");
        s = s.replace("'", "\\'");
        return "\'" + s + "\'";
    }

    string() {
        let s = this.ion;
        s = s.replace("\\", "\\\\");
        s = s.replace("\"", "\\\"");
        return "\"" + s + "\"";
    }

    long_string() {
        let s = this.ion;
        s = s.replace("\\", "\\\\");
        s = s.replace("'", "\\'");
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
        let buffer = Buffer.from(this.ion, 'utf8');
        return '{{' + buffer.toString('base64') + '}}';
    }
}

// build the suite based on the contents of big-list-of-naughty-strings.txt
let strings: string[] = [];
readFileSync('tests/big-list-of-naughty-strings.txt', 'utf-8')
    .split(/\r?\n/)
    .filter(line => !(line == '' || line[0] == '#'))
    .forEach(line => {
        let tv = new TestValue(line);

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
            strings.push(tv.ion);
            strings.push(tv.symbol() + "::" + tv.ion);
            strings.push(tv.symbol() + "::{" + tv.symbol() + ":" + tv.ion + "}");
            strings.push(tv.symbol() + "::{" + tv.symbol() + ":" + tv.symbol() + "::" + tv.ion + "}");
        }

        // list
        strings.push(
            tv.symbol() + "::["
                + tv.symbol() + ", "
                + tv.string() + ", "
                + tv.long_string() + ", "
                + tv.clob() + ", "
                + tv.blob() + ", "
                + (tv.validIon ? tv.ion : '')
                + "]");

        // sexp
        strings.push(
            tv.symbol() + "::("
                + tv.symbol() + " "
                + tv.string() + " "
                + tv.long_string() + " "
                + tv.clob() + " "
                + tv.blob() + " "
                + (tv.validIon ? tv.ion : '')
                + ")");

        // multiple annotations
        strings.push(tv.symbol() + "::" + tv.symbol() + "::" + tv.symbol() + "::" + tv.string());
    });

let suite = { };
let testCount = 0;
strings.forEach(str => {
    //if (str == "'undefined'::{'undefined':'undefined'}") {
        suite[str] = () => {
            runTest(str);
        };
        testCount++;
    //}
});
writeln("testCount: " + testCount);

// ask intern to execute the tests
registerSuite('BigListOfNaughtyStringsTests', suite);


// TBD this is a clone; promote to ion-js?
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

// TBD clone from IonHashTests
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
}

function testIonHasherProvider() {
    return new IdentityIonHasher();
}

function runTest(testString) {
    let tv = new TestValue(testString);
    let hw;
    try {
        let reader = ion.makeReader(tv.ion);
        let type = reader.next();
        hw = hashWriter(ion.makeBinaryWriter(), testIonHasherProvider);
        writeTo(reader, type, hw);
    } catch (e) {
        if (tv.validIon) {
            throw e;
        }
    }

    let hr;
    try {
        let reader = ion.makeReader(tv.ion);
        hr = hashReader(reader, testIonHasherProvider);
        hr.next();
        hr.next();
    } catch (e) {
        writeln(e);
        if (tv.validIon) {
            throw e;
        }
    }

    if (tv.validIon == null || tv.validIon) {
        assert.equal(toHexString(hw.digest()),
            toHexString(hr.digest()));
    }
}

