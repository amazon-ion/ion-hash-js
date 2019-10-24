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

import {_escape} from '../src/internal/IonHashImpl';

registerSuite('_escape', {
    empty: () => { test([], []); },
    noop: () => { test([0x10, 0x11, 0x12, 0x13], [0x10, 0x11, 0x12, 0x13]); },
    escape_b: () => { test([0x0b], [0x0c, 0x0b]); },
    escape_e: () => { test([0x0e], [0x0c, 0x0e]); },
    escape_c: () => { test([0x0c], [0x0c, 0x0c]); },
    escape_bec: () => { test([0x0b, 0x0e, 0x0c], [0x0c, 0x0b, 0x0c, 0x0e, 0x0c, 0x0c]); },
    escape_cc: () => { test([0x0c, 0x0c], [0x0c, 0x0c, 0x0c, 0x0c]); },
    escape_multiple: () => { test([0x0c, 0x10, 0x0c, 0x11, 0x0c, 0x12, 0x0c], [0x0c, 0x0c, 0x10, 0x0c, 0x0c, 0x11, 0x0c, 0x0c, 0x12, 0x0c, 0x0c]); },
});

let test = (actual: number[], expected: number[]) => {
    assert.deepEqual(_escape(new Uint8Array(actual)), new Uint8Array(expected));
};

