import {makeBinaryWriter, makeReader} from 'ion-js';

const {registerSuite} = intern.getPlugin('interface.object');
const {assert} = intern.getPlugin('chai');
import {readFileSync} from 'fs';

import {IonHashReader, IonHashWriter, makeHashReader, makeHashWriter} from '../src/IonHash';
import {testIonHasherProvider, toHexString, writeln} from './testutil';

class TestValue {
    private static ionPrefix = 'ion::';
    private static invalidIonPrefix = 'invalid_ion::';

    readonly validIon: boolean | null;

    constructor(public inputValue: string) {
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
        s = s.replace("\\", "\\\\");
        s = s.replace("'", "\\'");
        return "\'" + s + "\'";
    }

    string() {
        let s = this.inputValue;
        s = s.replace("\\", "\\\\");
        s = s.replace("\"", "\\\"");
        return "\"" + s + "\"";
    }

    long_string() {
        let s = this.inputValue;
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
        let buffer = Buffer.from(this.inputValue, 'utf8');
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
    });

let suite: { [testName: string]: () => void } = { };
let testCount = 0;
strings.forEach(str => {
    suite[str] = () => {
        runTest(str);
    };
    testCount++;
});
writeln("testCount: " + testCount);

// ask intern to execute the tests
registerSuite('BigListOfNaughtyStringsTests', suite);


function runTest(testString: string) {
    let tv = new TestValue(testString);
    let hashWriter: IonHashWriter | null = null;
    try {
        let reader = makeReader(tv.inputValue);
        reader.next();
        hashWriter = makeHashWriter(makeBinaryWriter(), testIonHasherProvider('identity'));
        hashWriter.writeValue(reader);
    } catch (e) {
        if (tv.validIon) {
            throw e;
        }
    }

    let hashReader: IonHashReader | null = null;
    try {
        let reader = makeReader(tv.inputValue);
        hashReader = makeHashReader(reader, testIonHasherProvider('identity'));
        hashReader.next();
        hashReader.next();
    } catch (e) {
        writeln(e);
        if (tv.validIon) {
            throw e;
        }
    }

    if (tv.validIon == null || tv.validIon) {
        assert.equal(toHexString(hashWriter!.digest()),
            toHexString(hashReader!.digest()));
    }
}

