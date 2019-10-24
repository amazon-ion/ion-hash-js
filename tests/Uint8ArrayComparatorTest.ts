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
import {_Uint8ArrayComparator} from '../src/internal/IonHashImpl';

registerSuite('_Uint8ArrayComparator', {
    equals: () => { test([0x01, 0x02, 0x03], [0x01, 0x02, 0x03], 0); },
    lessThan: () => { test([0x01, 0x02, 0x03], [0x01, 0x02, 0x04], -1); },
    lessThanDueToLength: () => { test([0x01, 0x02, 0x03], [0x01, 0x02, 0x03, 0x04], -1); },
    greaterThan: () => { test([0x01, 0x02, 0x04], [0x01, 0x02, 0x03], 1); },
    greaterThanDueToLength: () => { test([0x01, 0x02, 0x03, 0x04], [0x01, 0x02, 0x03], 1); },
    unsignedBehavior: () => {
        test([0x01], [0x7f], -1);
        test([0x01], [0x80], -1);
        test([0x01], [0xff], -1);
        test([0x7f], [0x01], 1);
        test([0x80], [0x01], 1);
        test([0xff], [0x01], 1);
    },
});

let test = function(a: number[], b: number[], expected: number) {
    assert.equal(_Uint8ArrayComparator(new Uint8Array(a), new Uint8Array(b)), expected);
};

