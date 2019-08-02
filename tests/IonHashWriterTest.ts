const {registerSuite} = intern.getPlugin('interface.object');
const {assert} = intern.getPlugin('chai');

import {makeBinaryWriter, makeTextWriter, TypeCodes} from 'ion-js';

import {makeHashWriter} from '../src/IonHash';
import {testIonHasherProvider} from './testutil';

registerSuite('IonHashWriter', {
    topLevelValues: () => {
        let writer = makeTextWriter();
        let hashWriter = makeHashWriter(writer, testIonHasherProvider('identity'));

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
        let hashWriter = makeHashWriter(writer, testIonHasherProvider('md5'));

        assert.deepEqual(hashWriter.digest(), md5initialDigest);
        hashWriter.writeNull(TypeCodes.NULL);
        assert.deepEqual(hashWriter.digest(), Uint8Array.from(
            [0x0f, 0x50, 0xc5, 0xe5, 0xe8, 0x77, 0xb4, 0x45, 0x1a, 0xa9, 0xfe, 0x77, 0xc3, 0x76, 0xcd, 0xe4]));
        assert.deepEqual(hashWriter.digest(), md5initialDigest);
    },

    writeScalarNull: () => {
        let writer = makeTextWriter();
        let hashWriter = makeHashWriter(writer, testIonHasherProvider('identity'));

        hashWriter.writeNull(TypeCodes.STRING);
        let writeNullDigest = hashWriter.digest();

        hashWriter.writeString((null as unknown) as string);
        let writeStringDigest = hashWriter.digest();

        assert.deepEqual(writeStringDigest, writeNullDigest);
    },

    writeContainerNull: () => {
        let writer = makeTextWriter();
        let hashWriter = makeHashWriter(writer, testIonHasherProvider('identity'));

        hashWriter.writeNull(TypeCodes.LIST);
        let writeNullDigest = hashWriter.digest();

        hashWriter.writeList(undefined, true);
        let writeListDigest = hashWriter.digest();

        assert.deepEqual(writeListDigest, writeNullDigest);
    },

    digestTooEarly: () => {
        let hashWriter = makeHashWriter(makeBinaryWriter(), testIonHasherProvider('identity'));
        hashWriter.writeStruct();
        hashWriter.writeFieldName('a');
        hashWriter.writeInt(5);
        assert.throws(() => { hashWriter.digest() });
    },

    digestTooLate: () => {
        let writer = makeBinaryWriter();
        writer.writeStruct();

        let hashWriter = makeHashWriter(writer, testIonHasherProvider('identity'));
        assert.throws(() => { hashWriter.endContainer() });
    },
});

