import { Reader as IonReader } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonReader';
import { Writer as IonWriter } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonWriter';

import { _HashReaderImpl, _HashWriterImpl, _CryptoIonHasher } from './internal/IonHashImpl';

/**
 * Wraps the provided IonReader as an IonHashReader.
 *
 * @param reader
 * @param hashFunctionProvider
 */
export function makeHashReader(reader: IonReader,
                               hashFunctionProvider: IonHasherProvider): IonHashReader {
    return new _HashReaderImpl(reader, hashFunctionProvider);
}

/**
 * Wraps the provided IonWriter as an IonHashWriter.
 *
 * @param writer
 * @param hashFunctionProvider
 */
export function makeHashWriter(writer: IonWriter,
                               hashFunctionProvider: IonHasherProvider): IonHashWriter {
    return new _HashWriterImpl(writer, hashFunctionProvider);
}


/**
 * TBD is this accurate?
 *
 * Provides the Ion hash of the value just nexted past or stepped out of;
 * hashes of partial Ion values are not provided.  If there is no current
 * hash value, returns an empty array.
 *
 * Implementations must calculate the hash independently of how the Ion
 * is traversed (e.g., the hash of a container must be identical whether
 * the caller skips over it, steps into it, or any combination thereof).
 *
 * @see Reader
 */
export interface IonHashReader extends IonReader {
    /**
     * TBD
     *
     * Provides the Ion hash of the value just nexted written or stepped out of;
     * hashes of partial Ion values are not provided.  If there is no current
     * hash value, returns an empty array.
     *
     * @return bytes representing the Ion hash of the value just written
     *               or stepped out of
     */
    digest(): Uint8Array;
}

/**
 * TBD is this accurate?
 *
 * IonWriter extension that provides the hash of the IonValue just written
 * or stepped out of, as defined by the Amazon Ion Hash Specification.
 *
 * Implementations of this interface are not thread-safe.
 *
 * @see Writer
 */
export interface IonHashWriter extends IonWriter {
    /**
     * TBD
     *
     * Provides the Ion hash of the value just written or stepped out of;
     * hashes of partial Ion values are not provided.  If there is no current
     * hash value, returns an empty array.
     *
     * @return bytes representing the Ion hash of the value just written
     *               or stepped out of
     */
    digest(): Uint8Array;
}


/**
 * Implementations of this function type interface create an IonHasher
 * instance when invoked.
 */
export interface IonHasherProvider {
    (): IonHasher;
}

/**
 * Interface for the user-provided hash function that is required
 * by the Amazon Ion Hash Specification.
 */
export interface IonHasher {
    /**
     * Updates the hash with the specified array of bytes.
     *
     * @param bytes
     */
    update(bytes: Uint8Array): void;

    /**
     * Returns the computed hash bytes and resets any internal state
     * so the hasher may be reused.
     *
     * @returns the Ion hash bytes
     */
    digest(): Uint8Array;
}

/**
 * An IonHasherProvider implementation backed by node's [crypto](https://node.readthedocs.io/en/latest/api/crypto/)
 * module.
 *
 * @param algorithm specifies the algorithm use when invoking `crypto.createHash()`
 *                  (e.g., 'sha1', 'md5', 'sha256', 'sha512')
 */
export function cryptoIonHasherProvider(algorithm: string): IonHasherProvider {
    return (): IonHasher => { return new _CryptoIonHasher(algorithm) };
}

