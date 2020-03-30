/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

import {Decimal, load, Timestamp} from 'ion-js';

const {registerSuite} = intern.getPlugin('interface.object');
const {assert} = intern.getPlugin('chai');

import {digest} from '../src/IonHash';

registerSuite('digest', {
    true: () => assert.deepEqual(
        digest(true, 'md5'),
        Uint8Array.from([0xa7, 0x51, 0x0a, 0x8e, 0x9a, 0x56, 0xd0, 0x23,
                         0x29, 0x27, 0x2e, 0xb4, 0x96, 0x66, 0xde, 0x12])
    ),
    allTypes: () => assert.deepEqual(
        digest([
            null,
            true,
            1,
            -1,
            load('1e0'),
            Decimal.parse('1d0'),
            Timestamp.parse('2017-01-01T00:00:00-00:00'),
            load('hello'),
            "hello",
            load('{{"hello"}}'),
            load('{{aGVsbG8=}}'),
            [1, 2, 3],
            load('(1 2 3)'),
            { c:3, a:1, b:2 },
            load('hello::null')],
            'md5'),
        Uint8Array.from([0xb0, 0xd9, 0x03, 0x45, 0xdb, 0x55, 0x79, 0xf1,
                         0xd8, 0x2f, 0x12, 0xae, 0x92, 0xc3, 0x23, 0xb5])
    ),
    unknownAlgorithm: () => assert.throws(() => digest(5, 'unknownAlgorithm')),
});

