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

import JSBI from "jsbi";

const {registerSuite} = intern.getPlugin('interface.object');
const {assert} = intern.getPlugin('chai');

import {
    Decimal,
    IntSize,
    IonType,
    IonTypes,
    makeReader,
    Reader,
    ReaderScalarValue,
    Timestamp
} from 'ion-js';

import {HashReader, makeHashReader} from '../src/IonHash';
import {sexpToBytes, testHasherProvider} from './testutil';

class ReaderComparer implements Reader {
    constructor(private readerA: Reader, private readerB: Reader) { }

    annotations(): string[] {
        assert.deepEqual(this.readerA.annotations(), this.readerB.annotations());
        return this.readerA.annotations();
    }
    bigIntValue(): JSBI | null {
        assert.deepEqual(this.readerA.bigIntValue(), this.readerB.bigIntValue());
        return this.readerA.bigIntValue();
    }
    booleanValue(): boolean | null {
        assert.deepEqual(this.readerA.booleanValue(), this.readerB.booleanValue());
        return this.readerA.booleanValue();
    }
    byteValue(): Uint8Array | null {
        assert.deepEqual(this.readerA.byteValue(), this.readerB.byteValue());
        return this.readerA.byteValue()
    }
    decimalValue(): Decimal | null {
        assert.deepEqual(this.readerA.decimalValue(), this.readerB.decimalValue());
        return this.readerA.decimalValue();
    }
    depth(): number {
        assert.deepEqual(this.readerA.depth(), this.readerB.depth());
        return this.readerA.depth()
    }
    fieldName(): string | null {
        assert.deepEqual(this.readerA.fieldName(), this.readerB.fieldName());
        return this.readerA.fieldName();
    }
    intSize(): IntSize {
        assert.deepEqual(this.readerA.intSize(), this.readerB.intSize());
        return this.readerA.intSize();
    }
    isNull(): boolean {
        assert.deepEqual(this.readerA.isNull(), this.readerB.isNull());
        return this.readerA.isNull();
    }
    numberValue(): number | null {
        assert.deepEqual(this.readerA.numberValue(), this.readerB.numberValue());
        return this.readerA.numberValue();
    }
    stringValue(): string | null {
        assert.deepEqual(this.readerA.stringValue(), this.readerB.stringValue());
        return this.readerA.stringValue();
    }
    timestampValue(): Timestamp | null {
        assert.deepEqual(this.readerA.timestampValue(), this.readerB.timestampValue());
        return this.readerA.timestampValue();
    }
    type(): IonType | null {
        assert.deepEqual(this.readerA.type(), this.readerB.type());
        return this.readerA.type();
    }
    value(): ReaderScalarValue | null {
        assert.deepEqual(this.readerA.value(), this.readerB.value());
        return this.readerA.value();
    }

    next(): IonType | null {
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
function traverse(reader: Reader) {
    for (let type; type = reader.next(); ) {
        switch (type) {
            case IonTypes.BOOL:      { reader.booleanValue(); break }
            case IonTypes.INT:       { reader.numberValue(); break }
            case IonTypes.FLOAT:     { reader.numberValue(); break }
            case IonTypes.DECIMAL:   { reader.decimalValue(); break }
            case IonTypes.TIMESTAMP: { reader.timestampValue(); break }
            case IonTypes.SYMBOL:    { reader.stringValue(); break }
            case IonTypes.STRING:    { reader.stringValue(); break }
            case IonTypes.CLOB:      { reader.byteValue(); break }
            case IonTypes.BLOB:      { reader.byteValue(); break }
        }
        reader.isNull();
        if (!type.isContainer) {
            reader.value();
        } else {
            if (!reader.isNull()) {
                reader.stepIn();
                traverse(reader);
                reader.stepOut();
            }
        }
    }
}

registerSuite('HashReader', {
    verifyTypeBehavior: () => { readerCompareTest(
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

    verifyNestingBehavior: () => { readerCompareTest('{ a:1, b: [1, (2 3 4), 5], c: "hello" }') },

    emptyString: () => {
        let hashReader = makeHashReader(makeReader(''), testHasherProvider('identity'));
        assert.isNull(hashReader.next());
        assert.deepEqual(hashReader.digest(), new Uint8Array());
        assert.isNull(hashReader.next());
        assert.deepEqual(hashReader.digest(), new Uint8Array());
    },

    topLevelValues: () => {
        let hashReader = makeHashReader(makeReader('1 2 3'), testHasherProvider('identity'));

        assert.equal(hashReader.next(), IonTypes.INT);
        assert.deepEqual(hashReader.digest(), new Uint8Array());

        assert.equal(hashReader.next(), IonTypes.INT);
        assert.deepEqual(hashReader.digest(), Uint8Array.from([0x0b, 0x20, 0x01, 0x0e]));

        assert.equal(hashReader.next(), IonTypes.INT);
        assert.deepEqual(hashReader.digest(), Uint8Array.from([0x0b, 0x20, 0x02, 0x0e]));

        assert.isNull(hashReader.next());
        assert.deepEqual(hashReader.digest(), Uint8Array.from([0x0b, 0x20, 0x03, 0x0e]));

        assert.isNull(hashReader.next());
        assert.deepEqual(hashReader.digest(), new Uint8Array());
    },

    initialValue: () => {
        let md5initialDigest = Uint8Array.from(
            [0xd4, 0x1d, 0x8c, 0xd9, 0x8f, 0x00, 0xb2, 0x04, 0xe9, 0x80, 0x09, 0x98, 0xec, 0xf8, 0x42, 0x7e]);

        let hashReader = makeHashReader(makeReader('null'), testHasherProvider('md5'));

        assert.deepEqual(hashReader.digest(), md5initialDigest);

        assert.equal(hashReader.next(), IonTypes.NULL);
        assert.deepEqual(hashReader.digest(), md5initialDigest);

        assert.isNull(hashReader.next());
        assert.deepEqual(hashReader.digest(), Uint8Array.from(
            [0x0f, 0x50, 0xc5, 0xe5, 0xe8, 0x77, 0xb4, 0x45, 0x1a, 0xa9, 0xfe, 0x77, 0xc3, 0x76, 0xcd, 0xe4]));

        assert.isNull(hashReader.next());
        assert.deepEqual(hashReader.digest(), md5initialDigest);
    },

    digestTooEarly: () => {
        let str = '{ a: 1, b: 2 }';
        let hashReader = makeHashReader(makeReader(str), testHasherProvider('identity'));
        hashReader.next();
        hashReader.stepIn();
        assert.throws(() => { hashReader.digest() });
    },

    digestTooLate: () => {
        let str = '{ a: 1, b: 2 }';
        let reader = makeReader(str);
        reader.next();
        reader.stepIn();

        let hashReader = makeHashReader(reader, testHasherProvider('identity'));
        hashReader.next();
        assert.throws(() => { hashReader.stepOut() });
    },

    consumeRemainder_partialConsume: () => {
        consume((hr: HashReader) => {
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
        consume((hr: HashReader) => {
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
        consume((hr: HashReader) => {
            hr.next();
            hr.stepIn();
              hr.next();
            hr.stepOut();      // we've partially consumed the list
        });
    },
    consumeRemainder_stepInStepOutTopLevel: () => {
        consume((hr: HashReader) => {
            hr.next();
            assert.deepEqual(hr.digest(), new Uint8Array());

            hr.stepIn();
              assert.throws(() => { hr.digest() });
            hr.stepOut();      // we haven't consumed ANY of the list
        });
    },
    consumeRemainder_singleNext: () => {
        consume((hr: HashReader) => {
            hr.next();
            hr.next();
        });
    },
});

let readerCompareTest = (ionStr: string) => {
    let readerComparer = new ReaderComparer(
        makeReader(ionStr),
        makeHashReader(makeReader(ionStr), testHasherProvider('identity')));
    traverse(readerComparer);
};

let consume = (consumer: (hr: HashReader) => void) => {
    let reader = makeReader('(0x0b 0xb0'
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

    let hr = makeHashReader(makeReader('[1,2,{a:3,b:4},5]'), testHasherProvider('identity'));
    assert.deepEqual(hr.digest(), new Uint8Array());
    consumer(hr);

    assert.deepEqual(hr.digest(), expectedBytes);
    assert.isNull(hr.next());
    assert.deepEqual(hr.digest(), new Uint8Array());
}

