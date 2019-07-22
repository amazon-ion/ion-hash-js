const { registerSuite } = intern.getPlugin('interface.object');
const { assert } = intern.getPlugin('chai');
import { _Uint8ArrayComparator } from '../src/internal/IonHashImpl';

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

let test = function(a, b, expected) { assert.equal(_Uint8ArrayComparator(a, b), expected); };

