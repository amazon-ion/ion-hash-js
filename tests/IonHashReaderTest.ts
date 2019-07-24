const {registerSuite} = intern.getPlugin('interface.object');
const {assert} = intern.getPlugin('chai');

import * as ion from 'ion-js';
import {Decimal, IonType, IonTypes, Reader as IonReader, Timestamp} from 'ion-js';

import {IonHashReader, makeHashReader} from '../src/IonHash';
import {sexpToBytes, testIonHasherProvider} from './testutil';

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
function traverse(reader: IonReader) {
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

    emptyString: () => {
        let hashReader = makeHashReader(ion.makeReader(''), testIonHasherProvider('identity'));
        assert.isUndefined(hashReader.next());
        assert.deepEqual(hashReader.digest(), new Uint8Array());
        assert.isUndefined(hashReader.next());
        assert.deepEqual(hashReader.digest(), new Uint8Array());
    },

    topLevelValues: () => {
        let hashReader = makeHashReader(ion.makeReader('1 2 3'), testIonHasherProvider('identity'));

        assert.equal(hashReader.next(), IonTypes.INT);
        assert.deepEqual(hashReader.digest(), new Uint8Array());

        assert.equal(hashReader.next(), IonTypes.INT);
        assert.deepEqual(hashReader.digest(), Uint8Array.from([0x0b, 0x20, 0x01, 0x0e]));

        assert.equal(hashReader.next(), IonTypes.INT);
        assert.deepEqual(hashReader.digest(), Uint8Array.from([0x0b, 0x20, 0x02, 0x0e]));

        assert.isUndefined(hashReader.next());
        assert.deepEqual(hashReader.digest(), Uint8Array.from([0x0b, 0x20, 0x03, 0x0e]));

        assert.isUndefined(hashReader.next());
        assert.deepEqual(hashReader.digest(), new Uint8Array());
    },

    initialValue: () => {
        let md5initialDigest = Uint8Array.from(
            [0xd4, 0x1d, 0x8c, 0xd9, 0x8f, 0x00, 0xb2, 0x04, 0xe9, 0x80, 0x09, 0x98, 0xec, 0xf8, 0x42, 0x7e]);

        let hashReader = makeHashReader(ion.makeReader('null'), testIonHasherProvider('md5'));

        assert.deepEqual(hashReader.digest(), md5initialDigest);

        assert.equal(hashReader.next(), IonTypes.NULL);
        assert.deepEqual(hashReader.digest(), md5initialDigest);

        assert.isUndefined(hashReader.next());
        assert.deepEqual(hashReader.digest(), Uint8Array.from(
            [0x0f, 0x50, 0xc5, 0xe5, 0xe8, 0x77, 0xb4, 0x45, 0x1a, 0xa9, 0xfe, 0x77, 0xc3, 0x76, 0xcd, 0xe4]));

        assert.isUndefined(hashReader.next());
        assert.deepEqual(hashReader.digest(), md5initialDigest);
    },

    digestTooEarly: () => {
        let str = '{ a: 1, b: 2 }';
        let hashReader = makeHashReader(ion.makeReader(str), testIonHasherProvider('identity'));
        hashReader.next();
        hashReader.stepIn();
        assert.throws(() => { hashReader.digest() });
    },

    digestTooLate: () => {
        let str = '{ a: 1, b: 2 }';
        let reader = ion.makeReader(str);
        reader.next();
        reader.stepIn();

        let hashReader = makeHashReader(reader, testIonHasherProvider('identity'));
        hashReader.next();
        assert.throws(() => { hashReader.stepOut() });
    },

    consumeRemainder_partialConsume: () => {
        consume((hr: IonHashReader) => {
            hr.next();
            hr.stepIn();
              hr.next();
              hr.next();
              hr.next();
              hr.stepIn();
                hr.next();
              hr.stepOut();    // we've only partially consumed the struct
            hr.stepOut();      // we've only partially consumed the list
        });
    },
    consumeRemainder_stepInStepOutNested: () => {
        consume((hr: IonHashReader) => {
            hr.next();
            hr.stepIn();
              hr.next();
              hr.next();
              hr.next();
              hr.stepIn();
              hr.stepOut();    // we haven't consumed ANY of the struct
            hr.stepOut();      // we've only partially consumed the list
        });
    },
    consumeRemainder_stepInNextStepOut: () => {
        consume((hr: IonHashReader) => {
            hr.next();
            hr.stepIn();
              hr.next();
            hr.stepOut();      // we've partially consumed the list
        });
    },
    consumeRemainder_stepInStepOutTopLevel: () => {
        consume((hr: IonHashReader) => {
            hr.next();
            assert.deepEqual(hr.digest(), new Uint8Array());

            hr.stepIn();
              assert.throws(() => { hr.digest() });
            hr.stepOut();      // we haven't consumed ANY of the list
        });
    },
    consumeRemainder_singleNext: () => {
        consume((hr: IonHashReader) => {
            hr.next();
            hr.next();
        });
    },
});

let test = (ionStr: string) => {
    let readerComparer = new ReaderComparer(
        ion.makeReader(ionStr),
        makeHashReader(ion.makeReader(ionStr), testIonHasherProvider('identity')));
    traverse(readerComparer);
};

let consume = (consumer: (hr: IonHashReader) => void) => {
    let reader = ion.makeReader('(0x0b 0xb0'
                              + '   0x0b 0x20 0x01 0x0e'
                              + '   0x0b 0x20 0x02 0x0e'
                              + '   0x0b 0xd0'
                              + '     0x0c 0x0b 0x70 0x61 0x0c 0x0e 0x0c 0x0b 0x20 0x03 0x0c 0x0e'
                              + '     0x0c 0x0b 0x70 0x62 0x0c 0x0e 0x0c 0x0b 0x20 0x04 0x0c 0x0e'
                              + '   0x0e'
                              + '   0x0b 0x20 0x05 0x0e'
                              + ' 0x0e)');
    reader.next();
    let expectedBytes = sexpToBytes(reader);

    let hr = makeHashReader(ion.makeReader('[1,2,{a:3,b:4},5]'), testIonHasherProvider('identity'));
    assert.deepEqual(hr.digest(), new Uint8Array());
    consumer(hr);

    assert.deepEqual(hr.digest(), expectedBytes);
    assert.isUndefined(hr.next());
    assert.deepEqual(hr.digest(), new Uint8Array());
}

