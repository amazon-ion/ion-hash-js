const { registerSuite } = intern.getPlugin('interface.object');
const { assert } = intern.getPlugin('chai');
import * as ion from 'ion-js';

import { cryptoIonHasherProvider, makeHashReader, makeHashWriter } from '../src/IonHash';
import { toHexString } from './testutil';

registerSuite('CryptoIonHasherProviderTests', {
    cryptoMD5reader: () => {
        let str = '[1, 2, {a: 3, b: (4 {c: 5} 6) }, 7]';
        let expectedDigest = 'dd 20 84 69 9a 2e 85 fe ef 64 c8 79 57 b6 9f cd';

        let hashReader = makeHashReader(ion.makeReader(str), cryptoIonHasherProvider('md5'));
        hashReader.next();
        hashReader.next();
        let actualDigest = hashReader.digest();

        assert.equal(toHexString(actualDigest), expectedDigest);
    },

    cryptoMD5writer: () => {
        let expectedIon = '[1,2,{a:3,b:(4 {c:5} 6)},7]';
        let expectedDigest = 'dd 20 84 69 9a 2e 85 fe ef 64 c8 79 57 b6 9f cd';

        let writer = ion.makeTextWriter();
        let hashWriter = makeHashWriter(writer, cryptoIonHasherProvider('md5'));

        hashWriter.writeList();
          hashWriter.writeInt(1);
          hashWriter.writeInt(2);
          hashWriter.writeStruct();
            hashWriter.writeFieldName('a');
            hashWriter.writeInt(3);
            hashWriter.writeFieldName('b');
            hashWriter.writeSexp();
              hashWriter.writeInt(4);
              hashWriter.writeStruct();
                hashWriter.writeFieldName('c');
                hashWriter.writeInt(5);
              hashWriter.endContainer();
              hashWriter.writeInt(6);
            hashWriter.endContainer();
          hashWriter.endContainer();
          hashWriter.writeInt(7);
        hashWriter.endContainer();

        let actualDigest = hashWriter.digest();
        assert.equal(toHexString(actualDigest), expectedDigest);
        assert.equal(String.fromCharCode.apply(null, hashWriter.getBytes()), expectedIon);
        assert.equal(String.fromCharCode.apply(null, writer.getBytes()), expectedIon);
    },
});

