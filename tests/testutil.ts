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

import {makeReader, makeTextWriter, Reader} from 'ion-js';

import {Hasher, HasherProvider} from "../src/IonHash";
import {createHash, Hash} from 'crypto';

class IdentityHasher implements Hasher {
    private allBytes: number[] = [];

    constructor(private readonly log: string[] = []) {
    }

    update(bytes: Uint8Array): void {
        for (let i = 0; i < bytes.length; i++) {
            this.allBytes.push(bytes[i]);
        }
        this.log.push('update::(' + toHexString(bytes) + ')');
    }

    digest(): Uint8Array {
        let digest = new Uint8Array(this.allBytes);
        this.log.push('digest::(' + toHexString(digest) + ')');
        this.allBytes = [];
        return Uint8Array.from(digest);
    }
}

class CryptoTestHasher implements Hasher {
    private hash: Hash;

    constructor(private readonly algorithm: string, private readonly log: string[] = []) {
        this.hash = createHash(algorithm);
    }

    update(bytes: Uint8Array): void {
        this.hash.update(bytes);
    }

    digest(): Uint8Array {
        let digest = this.hash.digest();
        this.log.push('digest::(' + toHexString(digest) + ')');
        this.hash = createHash(this.algorithm);
        return digest;
    }
}

export function testHasherProvider(algorithm: string, log?: string[]): HasherProvider {
    return (): Hasher => {
        if (algorithm == 'identity') {
            return new IdentityHasher(log);
        } else {
            return new CryptoTestHasher(algorithm, log);
        }
    };
}


export function sexpStringToBytes(sexpStr: string): Uint8Array {
    let reader = makeReader(sexpStr);
    reader.next();
    return sexpToBytes(reader);
}

export function sexpToBytes(reader: Reader, options = { asIonBinary: false }): Uint8Array {
    let bytes: number[];
    if (options.asIonBinary) {
        bytes = [0xE0, 0x01, 0x00, 0xEA];
    } else {
        bytes = [];
    }
    reader.stepIn();
    for (let type; type = reader.next(); ) {
        bytes.push(reader.numberValue()!!);
    }
    reader.stepOut();
    return Uint8Array.from(bytes);
}


export function readerToString(reader: Reader): string {
    let writer = makeTextWriter();
    writer.writeValue(reader);
    writer.close();
    return String.fromCharCode.apply(null, writer.getBytes());
}

export function toHexString(byteArray: Uint8Array): string {
    let sb = '';
    byteArray.forEach(b => {
        if (sb != '') { sb += ' ' }
        sb += ('0' + ((b as number) & 0xFF).toString(16)).slice(-2);
    });
    return sb;
}

export function write(s: string): void { process.stdout.write(s) }
export function writeln(s = ""): void { write(s + "\n") }

