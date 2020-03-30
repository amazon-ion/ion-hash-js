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

import {dom, makeBinaryWriter, Reader, Writer} from 'ion-js';

import {_HashReaderImpl, _HashWriterImpl, _CryptoHasher} from './internal/IonHashImpl';

/**
 * Wraps the provided Reader as a HashReader.
 *
 * @param reader
 * @param hashFunctionProvider
 */
export function makeHashReader(reader: Reader,
                               hashFunctionProvider: HasherProvider): HashReader {
    return new _HashReaderImpl(reader, hashFunctionProvider);
}

/**
 * Wraps the provided Writer as a HashWriter.
 *
 * @param writer
 * @param hashFunctionProvider
 */
export function makeHashWriter(writer: Writer,
                               hashFunctionProvider: HasherProvider): HashWriter {
    return new _HashWriterImpl(writer, hashFunctionProvider);
}


/**
 * Reader decorator that computes the Ion hash of values read.
 *
 * @see [Reader](https://amzn.github.io/ion-js/api/interfaces/_ionreader_.reader.html)
 * @noInheritDoc
 */
export interface HashReader extends Reader {
    /**
     * Provides the Ion hash of the previous value (where Reader.next()
     * positions the reader at a new current value).
     *
     * Implementations must calculate the hash independent of how the Ion value
     * is traversed (i.e., the hash of a container must be identical whether
     * the caller skips over it, steps into it, or any combination thereof).
     *
     * @return bytes representing the Ion hash of the previous value
     * @throws if invoked at a different depth than when the HashReader was instantiated
     */
    digest(): Uint8Array;
}

/**
 * Writer decorator that computes the Ion hash of written values.
 *
 * @see [Writer](https://amzn.github.io/ion-js/api/interfaces/_ionwriter_.writer.html)
 * @noInheritDoc
 */
export interface HashWriter extends Writer {
    /**
     * Provides the Ion hash of the value just written.
     *
     * @return bytes representing the Ion hash of the value just written
     * @throws if invoked at a different depth than when the HashWriter was instantiated
     */
    digest(): Uint8Array;
}


/**
 * Implementations of this function type interface create a Hasher
 * instance when invoked.
 *
 * @see [[cryptoHasherProvider]]
 */
export interface HasherProvider {
    (): Hasher;
}

/**
 * Interface for the user-provided hash function that is required
 * by the Amazon Ion Hash Specification.
 */
export interface Hasher {
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
 * A HasherProvider implementation backed by node's [crypto](https://node.readthedocs.io/en/latest/api/crypto/)
 * module.
 *
 * @param algorithm specifies the algorithm to use when invoking `crypto.createHash()`
 *                  (e.g., 'sha1', 'md5', 'sha256', 'sha512')
 * @throws if the specified algorithm isn't supported
 */
export function cryptoHasherProvider(algorithm: string): HasherProvider {
    return (): Hasher => { return new _CryptoHasher(algorithm) };
}

/**
 * Computes the Ion hash of a value using the specified hash algorithm.
 * The algorithm must be known to node's
 * [crypto](https://node.readthedocs.io/en/latest/api/crypto/) module.
 *
 * @param value the native JavaScript value or instance of ion-js's dom.Value to be hashed
 * @param algorithm specifies the algorithm to use when invoking `crypto.createHash()`
 *                  (e.g., 'sha1', 'md5', 'sha256', 'sha512')
 * @return bytes representing the Ion hash of the value
 * @throws if the specified algorithm isn't supported
 */
export function digest(value: any, algorithm: string): Uint8Array {
    let writer = makeBinaryWriter();
    let hashProvider = cryptoHasherProvider(algorithm);
    let hashWriter = makeHashWriter(writer, hashProvider);
    dom.Value.from(value).writeTo(hashWriter);
    hashWriter.close();
    writer.close();

    return hashWriter.digest();
}

