import {Reader} from 'ion-js';
import {Writer} from 'ion-js';

import {_HashReaderImpl, _HashWriterImpl, _CryptoIonHasher} from './internal/IonHashImpl';

/**
 * Wraps the provided Reader as an IonHashReader.
 *
 * @param reader
 * @param hashFunctionProvider
 */
export function makeHashReader(reader: Reader,
                               hashFunctionProvider: IonHasherProvider): IonHashReader {
    return new _HashReaderImpl(reader, hashFunctionProvider);
}

/**
 * Wraps the provided Writer as an IonHashWriter.
 *
 * @param writer
 * @param hashFunctionProvider
 */
export function makeHashWriter(writer: Writer,
                               hashFunctionProvider: IonHasherProvider): IonHashWriter {
    return new _HashWriterImpl(writer, hashFunctionProvider);
}


/**
 * Reader decorator that computes the Ion hash of values read.
 *
 * @see Reader
 */
export interface IonHashReader extends Reader {
    /**
     * Provides the Ion hash of the previous value (where Reader.next()
     * positions the reader at a new current value).
     *
     * Implementations must calculate the hash independent of how the Ion value
     * is traversed (i.e., the hash of a container must be identical whether
     * the caller skips over it, steps into it, or any combination thereof).
     *
     * @return bytes representing the Ion hash of the previous value
     * @throws if invoked at a different depth than when the IonHashReader was instantiated
     */
    digest(): Uint8Array;
}

/**
 * Writer decorator that computes the Ion hash of written values.
 *
 * @see Writer
 */
export interface IonHashWriter extends Writer {
    /**
     * Provides the Ion hash of the value just written.
     *
     * @return bytes representing the Ion hash of the value just written
     * @throws if invoked at a different depth than when the IonHashWriter was instantiated
     */
    digest(): Uint8Array;
}


/**
 * Implementations of this function type interface create an IonHasher
 * instance when invoked.
 *
 * @see [[cryptoIonHasherProvider]]
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
 * @param algorithm specifies the algorithm to use when invoking `crypto.createHash()`
 *                  (e.g., 'sha1', 'md5', 'sha256', 'sha512')
 * @throws if the specified algorithm isn't supported
 */
export function cryptoIonHasherProvider(algorithm: string): IonHasherProvider {
    return (): IonHasher => { return new _CryptoIonHasher(algorithm) };
}

