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

import {IonTypes, makeReader, makeTextWriter} from "ion-js";

const {registerSuite} = intern.getPlugin('interface.object');
const {assert} = intern.getPlugin('chai');

import {makeHashReader, makeHashWriter} from '../src/IonHash';
import {sexpStringToBytes, testHasherProvider} from './testutil';

registerSuite('FieldnameBehavior', {
    null:       () => { test("null", "(0x0b 0x0f 0x0e)") },
    bool:       () => { test("false", "(0x0b 0x10 0x0e)") },
    int:        () => { test("5", "(0x0b 0x20 0x05 0x0e)") },
    float:      () => { test("2e0", "(0x0b 0x40 0x40 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x0e)") },
    decimal:    () => { test("1234.500", "(0x0b 0x50 0xc3 0x12 0xd6 0x44 0x0e)") },
    timestamp:  () => { test("2017-01-01T00:00:00Z", "(0x0b 0x60 0x80 0x0f 0xe1 0x81 0x81 0x80 0x80 0x80 0x0e)") },
    symbol:     () => { test("hi", "(0x0b 0x70 0x68 0x69 0x0e)") },
    string:     () => { test("\"hi\"", "(0x0b 0x80 0x68 0x69 0x0e)") },
    clob:       () => { test("{{\"hi\"}}", "(0x0b 0x90 0x68 0x69 0x0e)") },
    blob:       () => { test("{{aGVsbG8=}}", "(0x0b 0xa0 0x68 0x65 0x6c 0x6c 0x6f 0x0e)") },
    list:       () => { test("[1,2,3]", "(0x0b 0xb0 0x0b 0x20 0x01 0x0e 0x0b 0x20 0x02 0x0e 0x0b 0x20 0x03 0x0e 0x0e)") },
    sexp:       () => { test("(1 2 3)", "(0x0b 0xc0 0x0b 0x20 0x01 0x0e 0x0b 0x20 0x02 0x0e 0x0b 0x20 0x03 0x0e 0x0e)") },
    struct:     () => { test("{a:1,b:2,c:3}",
                               "(0x0b 0xd0"
                             + "   0x0c 0x0b 0x70 0x61 0x0c 0x0e 0x0c 0x0b 0x20 0x01 0x0c 0x0e"
                             + "   0x0c 0x0b 0x70 0x62 0x0c 0x0e 0x0c 0x0b 0x20 0x02 0x0c 0x0e"
                             + "   0x0c 0x0b 0x70 0x63 0x0c 0x0e 0x0c 0x0b 0x20 0x03 0x0c 0x0e"
                             + " 0x0e)")
    },
    annotation: () => { test("hi::7", "(0x0b 0xe0 0x0b 0x70 0x68 0x69 0x0e 0x0b 0x20 0x07 0x0e 0x0e)") },
});

function test(ionStr: string, expectedSexpBytes: string) {
    let expectedDigest = sexpStringToBytes(expectedSexpBytes);

    // verify HashWriter behavior:
    let writer = makeTextWriter();
    writer.stepIn(IonTypes.STRUCT);

    let hashWriter = makeHashWriter(writer, testHasherProvider('identity'));
    hashWriter.writeFieldName("field_name");    // this fieldName should not become part of the hash

    let reader = makeReader(ionStr);
    reader.next();
    hashWriter.writeValue(reader);

    let writerActualDigest = hashWriter.digest();

    assert.deepEqual(writerActualDigest, expectedDigest);
    writer.stepOut();

    hashWriter.close();
    writer.close();
    let bytes = writer.getBytes();


    // verify HashReader behavior:
    reader = makeReader(bytes);
    reader.next();
    reader.stepIn();

    let hashReader = makeHashReader(reader, testHasherProvider('identity'));
    hashReader.next();
    hashReader.next();
    let readerActualDigest = hashReader.digest();
    assert.deepEqual(readerActualDigest, expectedDigest);

    // and we've transitively asserted that currentValue of reader and writer match
}

