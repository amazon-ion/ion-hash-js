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

import {IonTypes, makeReader, makeTextWriter} from 'ion-js';

const {registerSuite} = intern.getPlugin('interface.object');
const {assert} = intern.getPlugin('chai');

import {cryptoHasherProvider, makeHashReader, makeHashWriter} from '../src/IonHash';
import {toHexString} from './testutil';

registerSuite('CryptoHasherProviderTests', {
    cryptoMD5reader: () => testReader(
        '[1, 2, {a: 3, b: (4 {c: 5} 6) }, 7]',
        'dd 20 84 69 9a 2e 85 fe ef 64 c8 79 57 b6 9f cd'),

    cryptoMD5readerStructWithMultipleScalarFields: () => testReader(
        '{a: 1, b: 2}',
        '52 30 a3 c4 0d a0 d5 95 28 bb e5 01 90 f4 0c 23'),

    cryptoMD5writer: () => {
        let expectedIon = '[1,2,{a:3,b:(4 {c:5} 6)},7]';
        let expectedDigest = 'dd 20 84 69 9a 2e 85 fe ef 64 c8 79 57 b6 9f cd';

        let writer = makeTextWriter();
        let hashWriter = makeHashWriter(writer, cryptoHasherProvider('md5'));

        hashWriter.stepIn(IonTypes.LIST);
          hashWriter.writeInt(1);
          hashWriter.writeInt(2);
          hashWriter.stepIn(IonTypes.STRUCT);
            hashWriter.writeFieldName('a');
            hashWriter.writeInt(3);
            hashWriter.writeFieldName('b');
            hashWriter.stepIn(IonTypes.SEXP);
              hashWriter.writeInt(4);
              hashWriter.stepIn(IonTypes.STRUCT);
                hashWriter.writeFieldName('c');
                hashWriter.writeInt(5);
              hashWriter.stepOut();
              hashWriter.writeInt(6);
            hashWriter.stepOut();
          hashWriter.stepOut();
          hashWriter.writeInt(7);
        hashWriter.stepOut();

        let actualDigest = hashWriter.digest();
        assert.equal(toHexString(actualDigest), expectedDigest);
        assert.equal(String.fromCharCode.apply(null, hashWriter.getBytes()), expectedIon);
        assert.equal(String.fromCharCode.apply(null, writer.getBytes()), expectedIon);
    },

    unknownAlgorithm: () => {
        assert.throws(() => {
            makeHashWriter(makeTextWriter(), cryptoHasherProvider('unknownAlgorithm'))
        });
    },
});

function testReader(input: string, expectedDigest: string) {
    let hashReader = makeHashReader(makeReader(input), cryptoHasherProvider('md5'));
    hashReader.next();
    hashReader.next();
    let actualDigest = hashReader.digest();

    assert.equal(toHexString(actualDigest), expectedDigest);
}

