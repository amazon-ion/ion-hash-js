import { Reader as IonReader } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonReader';
import { Writer as IonWriter } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonWriter';
import { _HashReaderImpl, _HashWriterImpl, _CryptoIonHasher } from './internal/IonHashImpl';

export function makeHashReader(reader: IonReader,
                               hashFunctionProvider: IonHasherProvider): IonHashReader {
    return new _HashReaderImpl(reader, hashFunctionProvider);
}

export function makeHashWriter(writer: IonWriter,
                               hashFunctionProvider: IonHasherProvider): IonHashWriter {
    return new _HashWriterImpl(writer, hashFunctionProvider);
}

export interface IonHashReader extends IonReader {
    digest(): Buffer;
}

export interface IonHashWriter extends IonWriter {
    digest(): Buffer;
}

export interface IonHasherProvider {
    (): IonHasher;
}

export interface IonHasher {
    update(bytes: Uint8Array);
    digest(): Buffer;
}

export function cryptoIonHasherProvider(algorithm: string): IonHasherProvider {
    return (): IonHasher => { return new _CryptoIonHasher(algorithm) };
}

