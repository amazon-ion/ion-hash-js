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


export function toString(reader: IonReader, type: IonType): string {
    let writer = makeTextWriter();
    writeTo(reader, type, writer);
    return String.fromCharCode.apply(null, writer.getBytes());
}

export function writeTo(reader: IonReader, type: IonType, writer: IonWriter, depth = 0): void {
    if (depth > 0) {
        let fieldName = reader.fieldName();
        if (fieldName !== null) {
            writer.writeFieldName(fieldName);
        }
    }
    writer.setAnnotations(reader.annotations());
    if (reader.isNull()) {
        writer.writeNull(type);
    } else {
        switch (type) {
            case IonTypes.BOOL:      { writer.writeBoolean(reader.booleanValue()); break }
            case IonTypes.INT:       { writer.writeInt(reader.numberValue()); break }
            case IonTypes.FLOAT:     { writer.writeFloat64(reader.numberValue()); break }
            case IonTypes.DECIMAL:   { writer.writeDecimal(reader.decimalValue()); break }
            case IonTypes.TIMESTAMP: { writer.writeTimestamp(reader.timestampValue()); break }
            case IonTypes.SYMBOL:    { writer.writeSymbol(reader.stringValue()); break }
            case IonTypes.STRING:    { writer.writeString(reader.stringValue()); break }
            case IonTypes.CLOB:      { writer.writeClob(reader.byteValue()); break }
            case IonTypes.BLOB:      { writer.writeBlob(reader.byteValue()); break }
            case IonTypes.LIST:      { writer.stepIn(IonTypes.LIST); break }
            case IonTypes.SEXP:      { writer.stepIn(IonTypes.SEXP); break }
            case IonTypes.STRUCT:    { writer.stepIn(IonTypes.STRUCT); break }
            default: throw new Error('unrecognized type' + type);
        }
        if (type.isContainer) {
            reader.stepIn();
            for (let t; t = reader.next(); ) {
                writeTo(reader, t, writer, depth + 1);
            }
            writer.stepOut();
            reader.stepOut();
        }
    }
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

