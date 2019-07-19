import * as ion from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/Ion';
import { Reader as IonReader } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonReader';
import { IonHasher } from "../src/IonHash";

class IdentityIonHasher implements IonHasher {
    private allBytes: number[] = [];
    update(bytes: Uint8Array) {
        for (let i = 0; i < bytes.length; i++) {
            this.allBytes.push(bytes[i]);
        }
    }
    digest(): Buffer {
        let digest = this.allBytes;
        this.allBytes = [];
        return Buffer.from(digest);
    }
};

export function testIonHasherProvider() {
    return new IdentityIonHasher();
};


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

export function write(s) {
    process.stdout.write(s);
};

export function writeln(s = "") {
    write(s + "\n");
};

