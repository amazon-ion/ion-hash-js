const { registerSuite } = intern.getPlugin('interface.object');
const { assert } = intern.getPlugin('chai');
import * as ion from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/Ion';
import { makeHashReader, makeHashWriter } from '../src/IonHash';
import { testIonHasherProvider } from './testutil';

registerSuite('InvalidDigestCalls', {
    readerTooEarly: () => {
        let str = '{ a: 1, b: 2 }';
        let hashReader = makeHashReader(ion.makeReader(str), testIonHasherProvider);
        hashReader.next();
        hashReader.stepIn();
        assert.throws(() => { hashReader.digest() });
    },

    readerTooLate: () => {
        let str = '{ a: 1, b: 2 }';
        let reader = ion.makeReader(str);
        reader.next();
        reader.stepIn();

        let hashReader = makeHashReader(reader, testIonHasherProvider);
        hashReader.next();
        assert.throws(() => { hashReader.stepOut() });
    },

    writerTooEarly: () => {
        let hashWriter = makeHashWriter(ion.makeBinaryWriter(), testIonHasherProvider);
        hashWriter.writeStruct();
        hashWriter.writeFieldName('a');
        hashWriter.writeInt(5);
        assert.throws(() => { hashWriter.digest() });
    },

    writerTooLate: () => {
        let writer = ion.makeBinaryWriter();
        writer.writeStruct();

        let hashWriter = makeHashWriter(writer, testIonHasherProvider);
        assert.throws(() => { hashWriter.endContainer() });
    },
});

