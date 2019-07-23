import * as ion from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/Ion';
import { Reader as IonReader } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonReader';
import {IonHasher, IonHasherProvider} from "../src/IonHash";

import { createHash, Hash } from 'crypto';

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
        let digest = this.allBytes;
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


export function sexpStringToBytes(sexpStr: string): number[] {
    let reader = ion.makeReader(sexpStr);
    reader.next();
    return sexpToBytes(reader);
}

export function sexpToBytes(reader: IonReader): number[] {
    let bytes: number[] = [];
    reader.stepIn();
    for (let type; type = reader.next(); ) {
        bytes.push(reader.numberValue());
    }
    reader.stepOut();
    return bytes;
}


export function toString(reader, type): string {
    let writer = ion.makeTextWriter();
    writeTo(reader, type, writer);
    return String.fromCharCode.apply(null, writer.getBytes());
}

export function writeTo(reader, type, writer, depth = 0) {
    if (depth > 0) {
        if (reader.fieldName() != undefined) {
            writer.writeFieldName(reader.fieldName());
        }
    }
    if (reader.isNull()) {
        writer.writeNull(type.bid, reader.annotations());
    } else {
        switch (type) {
            case ion.IonTypes.BOOL:      { writer.writeBoolean(reader.booleanValue(), reader.annotations()); break }
            case ion.IonTypes.INT:       { writer.writeInt(reader.numberValue(), reader.annotations()); break }
            case ion.IonTypes.FLOAT:     { writer.writeFloat64(reader.numberValue(), reader.annotations()); break }
            case ion.IonTypes.DECIMAL:   { writer.writeDecimal(reader.decimalValue(), reader.annotations()); break }
            case ion.IonTypes.TIMESTAMP: { writer.writeTimestamp(reader.timestampValue(), reader.annotations()); break }
            case ion.IonTypes.SYMBOL:    { writer.writeSymbol(reader.stringValue(), reader.annotations()); break }
            case ion.IonTypes.STRING:    { writer.writeString(reader.stringValue(), reader.annotations()); break }
            case ion.IonTypes.CLOB:      { writer.writeClob(reader.byteValue(), reader.annotations()); break }
            case ion.IonTypes.BLOB:      { writer.writeBlob(reader.byteValue(), reader.annotations()); break }
            case ion.IonTypes.LIST:      { writer.writeList(reader.annotations()); break }
            case ion.IonTypes.SEXP:      { writer.writeSexp(reader.annotations()); break }
            case ion.IonTypes.STRUCT:    { writer.writeStruct(reader.annotations()); break }
            default: throw new Error('unrecognized type' + type);
        }
        if (type.container) {
            reader.stepIn();
            for (let t; t = reader.next(); ) {
                writeTo(reader, t, writer, depth + 1);
            }
            writer.endContainer();
            reader.stepOut();
        }
    }
}

export function toHexString(byteArray) {
    let sb = '';
    byteArray.forEach(b => {
        if (sb != '') { sb += ' ' }
        sb += ('0' + ((b as number) & 0xFF).toString(16)).slice(-2);
    });
    return sb;
}

export function write(s) { process.stdout.write(s) }
export function writeln(s = "") { write(s + "\n") }

