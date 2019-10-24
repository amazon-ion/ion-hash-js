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

const {registerSuite} = intern.getPlugin('interface.object');
const {assert} = intern.getPlugin('chai');

import {IonTypes, makeBinaryWriter, makeTextWriter} from 'ion-js';

import {makeHashWriter} from '../src/IonHash';
import {testHasherProvider} from './testutil';

registerSuite('HashWriter', {
    topLevelValues: () => {
        let writer = makeTextWriter();
        let hashWriter = makeHashWriter(writer, testHasherProvider('identity'));

        assert.deepEqual(hashWriter.digest(), new Uint8Array());

        hashWriter.writeInt(1);
        assert.deepEqual(hashWriter.digest(), Uint8Array.from([0x0b, 0x20, 0x01, 0x0e]));

        hashWriter.writeInt(2);
        assert.deepEqual(hashWriter.digest(), Uint8Array.from([0x0b, 0x20, 0x02, 0x0e]));

        hashWriter.writeInt(3);
        assert.deepEqual(hashWriter.digest(), Uint8Array.from([0x0b, 0x20, 0x03, 0x0e]));

        assert.deepEqual(hashWriter.digest(), new Uint8Array());
        assert.deepEqual(writer.getBytes(), Uint8Array.from([0x31, 0x0a, 0x32, 0x0a, 0x33]));
    },

    initialValue: () => {
        let md5initialDigest = Uint8Array.from(
            [0xd4, 0x1d, 0x8c, 0xd9, 0x8f, 0x00, 0xb2, 0x04, 0xe9, 0x80, 0x09, 0x98, 0xec, 0xf8, 0x42, 0x7e]);

        let writer = makeTextWriter();
        let hashWriter = makeHashWriter(writer, testHasherProvider('md5'));

        assert.deepEqual(hashWriter.digest(), md5initialDigest);
        hashWriter.writeNull(IonTypes.NULL);
        assert.deepEqual(hashWriter.digest(), Uint8Array.from(
            [0x0f, 0x50, 0xc5, 0xe5, 0xe8, 0x77, 0xb4, 0x45, 0x1a, 0xa9, 0xfe, 0x77, 0xc3, 0x76, 0xcd, 0xe4]));
        assert.deepEqual(hashWriter.digest(), md5initialDigest);
    },

    writeScalarNull: () => {
        let writer = makeTextWriter();
        let hashWriter = makeHashWriter(writer, testHasherProvider('identity'));

        hashWriter.writeNull(IonTypes.STRING);
        let writeNullDigest = hashWriter.digest();

        hashWriter.writeString((null as unknown) as string);
        let writeStringDigest = hashWriter.digest();

        assert.deepEqual(writeStringDigest, writeNullDigest);
    },

    digestTooEarly: () => {
        let hashWriter = makeHashWriter(makeBinaryWriter(), testHasherProvider('identity'));
        hashWriter.stepIn(IonTypes.STRUCT);
        hashWriter.writeFieldName('a');
        hashWriter.writeInt(5);
        assert.throws(() => { hashWriter.digest() });
    },

    digestTooLate: () => {
        let writer = makeBinaryWriter();
        writer.stepIn(IonTypes.STRUCT);

        let hashWriter = makeHashWriter(writer, testHasherProvider('identity'));
        assert.throws(() => { hashWriter.stepOut() });
    },
});

