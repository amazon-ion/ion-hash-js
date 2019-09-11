import {IonType, IonTypes, makeReader, makeTextWriter, Reader as IonReader, Writer as IonWriter} from 'ion-js';

import {IonHasher, IonHasherProvider} from "../src/IonHash";
import {createHash, Hash} from 'crypto';

class IdentityIonHasher implements IonHasher {
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

class CryptoTestIonHasher implements IonHasher {
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

export function testIonHasherProvider(algorithm: string, log?: string[]): IonHasherProvider {
    return (): IonHasher => {
        if (algorithm == 'identity') {
            return new IdentityIonHasher(log);
        } else {
            return new CryptoTestIonHasher(algorithm, log);
        }
    };
}


export function sexpStringToBytes(sexpStr: string): Uint8Array {
    let reader = makeReader(sexpStr);
    reader.next();
    return sexpToBytes(reader);
}

export function sexpToBytes(reader: IonReader, options = { asIonBinary: false }): Uint8Array {
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


export function readerToString(reader: IonReader): string {
    let writer = makeTextWriter();
    writer.writeValue(reader);
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

