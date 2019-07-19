const { registerSuite } = intern.getPlugin('interface.object');
const { assert } = intern.getPlugin('chai');

import * as ion from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/Ion';
import { Decimal } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonDecimal';
import { IonType } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonType';
import { Reader as IonReader } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonReader';
import { Timestamp } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonTimestamp';

import { IonHashReader, makeHashReader } from '../src/IonHash';
import {testIonHasherProvider, writeln} from './testutil';

class ReaderComparer implements IonReader {
    constructor(private readerA: IonReader, private readerB: IonReader) { }

    annotations(): string[] {
        assert.deepEqual(this.readerA.annotations(), this.readerB.annotations());
        return this.readerA.annotations();
    }
    booleanValue(): boolean {
        assert.deepEqual(this.readerA.booleanValue(), this.readerB.booleanValue());
        return this.readerA.booleanValue();
    }
    byteValue(): Uint8Array {
        assert.deepEqual(this.readerA.byteValue(), this.readerB.byteValue());
        return this.readerA.byteValue()
    }
    decimalValue(): Decimal {
        assert.deepEqual(this.readerA.decimalValue(), this.readerB.decimalValue());
        return this.readerA.decimalValue();
    }
    depth(): number {
        assert.deepEqual(this.readerA.depth(), this.readerB.depth());
        return this.readerA.depth()
    }
    fieldName(): string    {
        assert.deepEqual(this.readerA.fieldName(), this.readerB.fieldName());
        return this.readerA.fieldName();
    }
    isNull(): boolean {
        assert.deepEqual(this.readerA.isNull(), this.readerB.isNull());
        return this.readerA.isNull();
    }
    numberValue(): number {
        assert.deepEqual(this.readerA.numberValue(), this.readerB.numberValue());
        return this.readerA.numberValue();
    }
    stringValue(): string {
        assert.deepEqual(this.readerA.stringValue(), this.readerB.stringValue());
        return this.readerA.stringValue();
    }
    timestampValue(): Timestamp {
        assert.deepEqual(this.readerA.timestampValue(), this.readerB.timestampValue());
        return this.readerA.timestampValue();
    }
    value(): any {
        assert.deepEqual(this.readerA.value(), this.readerB.value());
        return this.readerA.value();
    }

    next(): IonType {
        let ionTypeA = this.readerA.next();
        let ionTypeB = this.readerB.next();
        assert.deepEqual(ionTypeA, ionTypeB);
        return ionTypeA;
    }

    stepIn() {
        this.readerA.stepIn();
        this.readerB.stepIn();
    }

    stepOut() {
        this.readerA.stepOut();
        this.readerB.stepOut();
    }
}

// asks the comparator to verify identical behavior for all the reader methods
function traverse(reader) {
    for (let type; type = reader.next(); ) {
        switch (type) {
            case ion.IonTypes.BOOL:      { reader.booleanValue(); break }
            case ion.IonTypes.INT:       { reader.numberValue(); break }
            case ion.IonTypes.FLOAT:     { reader.numberValue(); break }
            case ion.IonTypes.DECIMAL:   { reader.decimalValue(); break }
            case ion.IonTypes.TIMESTAMP: { reader.timestampValue(); break }
            case ion.IonTypes.SYMBOL:    { reader.stringValue(); break }
            case ion.IonTypes.STRING:    { reader.stringValue(); break }
            case ion.IonTypes.CLOB:      { reader.byteValue(); break }
            case ion.IonTypes.BLOB:      { reader.byteValue(); break }
        }
        reader.isNull();
        reader.value();
        if (type.container && !reader.isNull()) {
            reader.stepIn();
            traverse(reader);
            reader.stepOut();
        }
    }
}

registerSuite('IonHashReader', {
    verifyTypeBehavior: () => { test(
          'null'
        + ' true'
        + ' 1'
        + ' -1'
        + ' 1e0'
        + ' 1d0'
        + ' 2017-01-01T00:00:00-00:00'
        + ' hello'
        + ' "hello"'
        + ' {{"hello"}}'
        + ' {{aGVsbG8=}}'
        + ' [1,2,3]'
        + ' (1 2 3)'
        + ' { c:3, a:1, b:2 }'
        + ' hello::null') },
    verifyNestingBehavior: () => { test('{ a:1, b: [1, (2 3 4), 5], c: "hello" }') },
});

let test = (ionStr) => {
    let readerComparer = new ReaderComparer(
        ion.makeReader(ionStr),
        makeHashReader(ion.makeReader(ionStr), testIonHasherProvider('identity')));
    traverse(readerComparer);
};

