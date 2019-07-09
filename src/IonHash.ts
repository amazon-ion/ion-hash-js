// TBD
// TBD use uint8array instead of number[] ?
// TBD use rewire to gain access to 'private' functions for testing
// TBD should HashReader/HashWriter be interfaces that extend Reader/Writer?

import * as ion from '/Users/pcornell/dev/ion/ion-js.development/dist/browser/js/ion-bundle.js';
import { Decimal } from '/Users/pcornell/dev/ion/ion-js.development/dist/amd/es6/IonDecimal';
import { IonType } from '/Users/pcornell/dev/ion/ion-js.development/dist/amd/es6/IonType';
import { IonTypes } from '/Users/pcornell/dev/ion/ion-js.development/dist/amd/es6/IonTypes';
import { Reader as IonReader } from '/Users/pcornell/dev/ion/ion-js.development/dist/amd/es6/IonReader';
import { Timestamp } from '/Users/pcornell/dev/ion/ion-js.development/dist/amd/es6/IonTimestamp';
import { Writer as IonWriter } from '/Users/pcornell/dev/ion/ion-js.development/dist/amd/es6/IonWriter';
import { TypeCodes } from '/Users/pcornell/dev/ion/ion-js.development/dist/amd/es6/IonBinary';

export function hashReader(reader, hashFunctionProvider) {
    return new HashReaderImpl(reader, hashFunctionProvider);
}

export function hashWriter(writer, hashFunctionProvider) {
    return new HashWriterImpl(writer, hashFunctionProvider);
}

export interface HashReader extends IonReader {
    digest(): number[];
}

export interface HashWriter extends IonWriter {
    digest(): number[];
}

export interface IonHasherProvider {
    (): IonHasher;
}

export interface IonHasher {
    update(bytes: number | Uint8Array): void;
    digest(): number[];
}

interface IonValue {
    annotations(): string[];
    fieldName(): string;
    isNull(): boolean;
    type(): IonType;
    value(): any;
}

class HashReaderImpl implements HashReader, IonValue {
    private readonly reader: IonReader;
    private readonly hashFunctionProvider;

    private readonly hasher: Hasher;
    private ionType: IonType;

    constructor(reader, hashFunctionProvider) {
        this.reader = reader;
        this.hashFunctionProvider = hashFunctionProvider;
        this.hasher = new Hasher(hashFunctionProvider);
    }

    annotations()   : string[]  { return this.reader.annotations() }
    booleanValue()  : boolean   { return this.reader.booleanValue() }
    byteValue()     : Uint8Array  { return this.reader.byteValue() }
    decimalValue()  : Decimal   { return this.reader.decimalValue() }
    depth()         : number    { return this.reader.depth() }
    fieldName()     : string    { return this.reader.fieldName() }
    isNull()        : boolean   { return this.reader.isNull() }
    numberValue()   : number    { return this.reader.numberValue() }
    stringValue()   : string    { return this.reader.stringValue() }
    timestampValue(): Timestamp { return this.reader.timestampValue() }
    value()         : any       { return this.reader.value() }

    next(): IonType {
        if (this.ionType && this.ionType.container) {
            // caller is nexting past a container;  hashing requires full/deep traversal
            this.hasher.stepIn(this);
            // TBD traverse nested data...
            this.hasher.stepOut();
        }

        this.ionType = this.reader.next();
        if (this.ionType && this.ionType.scalar) {
            this.hasher.scalar(this);
        }
        return this.ionType;
    }

    stepIn() {
        this.hasher.stepIn(this);
        this.reader.stepIn();
        this.ionType = null;
    }

    stepOut() {
        this.reader.stepOut();
        this.hasher.stepOut();
    }

    digest(): number[] {
        return this.hasher.digest();
    }

    type(): IonType {
        return this.ionType;
    }
}

class HashWriterImpl implements HashWriter, IonValue {
    private readonly writer: IonWriter;
    private readonly hashFunctionProvider;

    private readonly hasher: Hasher;
    private ionType: IonType;
    private theAnnotations: string[];
    private theFieldName: string;
    private theValue: any;

    constructor(writer, hashFunctionProvider) {
        this.writer = writer;
        this.hashFunctionProvider = hashFunctionProvider;
        this.hasher = new Hasher(hashFunctionProvider);
    }

    writeBlob     (value: Uint8Array, annotations?: string[])  { this.writer.writeBlob(value, annotations) }
    writeBoolean  (value: boolean, annotations?: string[])   { this.writer.writeBoolean(value, annotations) }
    writeClob     (value: Uint8Array, annotations?: string[])  { this.writer.writeClob(value, annotations) }
    writeDecimal  (value: Decimal, annotations?: string[])   { this.writer.writeDecimal(value, annotations) }
    writeFieldName(fieldName: string)                        { this.writer.writeFieldName(fieldName) }
    writeFloat32  (value: number, annotations?: string[])    { this.writer.writeFloat32(value, annotations) }
    writeFloat64  (value: number, annotations?: string[])    { this.writer.writeFloat64(value, annotations) }
    writeInt      (value: number, annotations?: string[])    { this.writer.writeInt(value, annotations) }
    writeList     (annotations?: string[], isNull?: boolean) { this.writer.writeList(annotations, isNull) }
    writeNull     (type: TypeCodes, annotations?: string[])  { this.writer.writeNull(type, annotations) }
    writeSexp     (annotations?: string[], isNull?: boolean) { this.writer.writeSexp(annotations, isNull) }
    writeString   (value: string, annotations?: string[])    { this.writer.writeString(value, annotations) }
    writeStruct   (annotations?: string[], isNull?: boolean) { this.writer.writeStruct(annotations, isNull) }
    writeSymbol   (value: string, annotations?: string[])    { this.writer.writeSymbol(value, annotations) }
    writeTimestamp(value: Timestamp, annotations?: string[]) { this.writer.writeTimestamp(value, annotations) }

    getBytes      (): Uint8Array { return this.writer.getBytes() }
    close         ()           { this.writer.close() }
    endContainer  ()           { this.writer.endContainer() }

    ///// implements IonValue /////
    annotations(): string[] {
        return this.theAnnotations;
    }

    digest(): number[] {
        return this.hasher.digest();
    }

    fieldName(): string {
        return this.theFieldName;
    }

    isNull(): boolean {
        return false;  // TBD
    }

    type(): IonType {
        return this.ionType;
    }

    value(): any {
        return this.theValue;
    }
}

class Hasher {
    private readonly ihp: IonHasherProvider;
    private currentHasher: Serializer;
    private readonly hasherStack: Serializer[] = [];

    constructor(ihp: IonHasherProvider) {
        this.ihp = ihp;
        this.currentHasher = new Serializer(this.ihp(), 0);
        this.hasherStack.push(this.currentHasher);
    }

    scalar(ionValue: IonValue) {
        this.currentHasher.scalar(ionValue);
    }

    stepIn(ionValue: IonValue) {
        let hf = this.currentHasher.hashFunction;
        if (this.currentHasher instanceof StructSerializer) {
            hf = this.ihp();
        }

        if (ionValue.type().name == 'struct') {   // TBD
            this.currentHasher = new StructSerializer(hf, this.depth(), this.ihp);
        } else {
            this.currentHasher = new Serializer(hf, this.depth());
        }

        this.hasherStack.push(this.currentHasher);
        this.currentHasher.stepIn(ionValue);
    }

    stepOut() {
        if (this.depth() == 0) {
            throw new Error("Hasher cannot stepOut any further");
        }

        this.currentHasher.stepOut();
        let poppedHasher = this.hasherStack.pop();
        this.currentHasher = this.hasherStack[this.hasherStack.length - 1];

        if (this.currentHasher instanceof StructSerializer) {
            let digest = poppedHasher.digest();
            this.currentHasher.appendFieldHash(digest);
        }
    }

    digest(): number[] {
        if (this.depth() != 0) {
            // TBD throw exception
        }
        return this.currentHasher.digest();
    }

    private depth(): number {
        return this.hasherStack.length - 1;
    }
}

class Serializer {
    private static readonly serializers = {
        "null":      (value, writer) => { writer.writeNull() },
        "bool":      (value, writer) => { writer.writeBoolean(value) },
        "int":       (value, writer) => { writer.writeInt(value) },
        "float":     (value, writer) => { writer.writeFloat64(value) },
        "decimal":   (value, writer) => { writer.writeDecimal(value) },
        "timestamp": (value, writer) => { writer.writeTimestamp(value) },
        "symbol":    (value, writer) => { writer.writeString(value) },
        "string":    (value, writer) => { writer.writeString(value) },
        "clob":      (value, writer) => { writer.writeClob(value) },
        "blob":      (value, writer) => { writer.writeBlob(value) },
    };

    hashFunction: IonHasher;
    private hasContainerAnnotations = false;
    private depth: number;

    constructor(hashFunction, depth) {
        this.hashFunction = hashFunction;
        this.depth = depth;
    }

    handleFieldName(fieldName) {
        if (fieldName && this.depth > 0) {
            this.writeSymbol(fieldName);
        }
    }

    private handleAnnotationsBegin(ionValue, isContainer=false) {
        let annotations = ionValue.annotations();
        if (annotations.length > 0) {
            this.beginMarker();
            this.update(TQ_ANNOTATED_VALUE);
            for (let annotation of annotations) {
                this.writeSymbol(annotation);
            }
            if (isContainer) {
                this.hasContainerAnnotations = true;
            }
        }
    }

    private handleAnnotationsEnd(ionValue, isContainer=false) {
        if ((ionValue && ionValue.annotations().length > 0)
                || (isContainer && this.hasContainerAnnotations)) {
            this.endMarker();
            if (isContainer) {
                this.hasContainerAnnotations = false;
            }
        }
    }

    protected update(bytes) { this.hashFunction.update(bytes) }
    protected beginMarker() { this.hashFunction.update(BEGIN_MARKER_BYTE) }
    protected endMarker()   { this.hashFunction.update(END_MARKER_BYTE) }

    // TBD merge with scalar()?
    private writeSymbol(token) {
        this.beginMarker();
        let scalarBytes = this.getBytes(IonTypes.SYMBOL, token, false);
        let [tq, representation] = this.scalarOrNullSplitParts(IonTypes.SYMBOL, false, scalarBytes);

        this.update(tq);
        if (representation.length > 0) {
            this.update(escape(representation));
        }
        this.endMarker();
    }

    private getBytes(type, value, isNull) {
        if (isNull) {
            return [type.bid << 4 | 0x0F];
        } else {
            let writer = ion.makeBinaryWriter();
            Serializer.serializers[type.name](value, writer);
            writer.close();
            return writer.getBytes().slice(4);
        }
    }

    private getLengthLength(bytes): number {
        if ((bytes[0] & 0x0F) == 0x0E) {
            // read subsequent byte(s) as the "length" field
            for (let i = 1; i < bytes.length; i++) {
                if ((bytes[i] & 0x80) != 0) {
                    return i;
                }
            }
            throw new Error("Problem while reading VarUInt!");
        }
        return 0;
    }

    private scalarOrNullSplitParts(type, isNull, bytes) {
        let offset = 1 + this.getLengthLength(bytes);

        // the representation is everything after TL (first byte) and length
        let representation = bytes.slice(offset);
        let tq = bytes[0];

        if (type.name == 'symbol') { // TBD fix
            // symbols are serialized as strings;  use the correct TQ:
            tq = 0x70;
            if (isNull) {
                tq |= 0x0F;
            }
            // TBD if SID0 ...
        }

        if (type.name != 'bool'              // TBD fix
                && type.name != 'symbol'     // TBD fix
                && (tq & 0x0F) != 0x0F) {    // not a null value
            tq &= 0xF0;                      // zero - out the L nibble
        }

        return [tq, representation]
    }


    scalar(ionValue: IonValue) {
        this.handleAnnotationsBegin(ionValue);
        this.beginMarker();
        let scalarBytes = this.getBytes(ionValue.type(), ionValue.value(), ionValue.isNull());
        let [tq, representation] = this.scalarOrNullSplitParts(ionValue.type(), ionValue.isNull(), scalarBytes);
        this.update(tq);
        if (representation.length > 0) {
            this.update(escape(representation));
        }
        this.endMarker();
        this.handleAnnotationsEnd(ionValue);
    }

    stepIn(ionValue: IonValue) {
        this.handleFieldName(ionValue.fieldName());
        this.handleAnnotationsBegin(ionValue, true);
        this.beginMarker();
        let tq = TQ[ionValue.type().name.toUpperCase()];   // TBD  rationalize this
        if (ionValue.isNull()) {
            tq |= 0x0F;
        }
        this.update(tq);
    }

    stepOut() {
        this.endMarker();
        this.handleAnnotationsEnd(null, true);
    }

    digest() { return this.hashFunction.digest() }
}

class StructSerializer extends Serializer {
    scalarSerializer: Serializer;
    fieldHashes: number[][] = [];

    constructor(hashFunction, depth, hashFunctionProvider) {
        super(hashFunction, depth);
        this.scalarSerializer = new Serializer(hashFunctionProvider(), depth + 1);
        this.fieldHashes = [];
    }

    scalar(value) {
        this.scalarSerializer.handleFieldName(value.fieldName());
        this.scalarSerializer.scalar(value);
        let digest = this.scalarSerializer.digest();
        this.appendFieldHash(digest);
    }

    stepOut() {
        this.fieldHashes.sort(byteArrayComparator);
        for (let digest of this.fieldHashes) {
            this.update(escape(digest));
        }
        super.stepOut();
    }

    appendFieldHash(digest) {
        this.fieldHashes.push(digest);
    }
}


export function byteArrayComparator(a: number[], b: number[]) {
    let i = 0;
    while (i < a.length && i < b.length) {
        let a_byte = a[i];
        let b_byte = b[i];
        if (a_byte != b_byte) {
            if (a_byte - b_byte < 0) {
                return -1;
            } else {
                return 1;
            }
        }
        i += 1;
    }

    let len_diff = a.length - b.length;
    if (len_diff < 0) {
        return -1;
    } else if (len_diff > 0) {
        return 1;
    } else {
        return 0;
    }
}

const BEGIN_MARKER_BYTE = 0x0B;
const END_MARKER_BYTE = 0x0E;
const ESCAPE_BYTE = 0x0C;

const TQ = {};
for (let ionType in IonTypes) {
    TQ[ionType] = IonTypes[ionType].bid << 4;
}
const TQ_SYMBOL_SID0 = 0x71;
const TQ_ANNOTATED_VALUE = 0xE0;


export function escape(bytes) {
    let escapedBytes = bytes;
    bytes.forEach((b) => {
        if (b == BEGIN_MARKER_BYTE || b == END_MARKER_BYTE || b == ESCAPE_BYTE) {
            // found a byte that needs to be escaped;  build a new byte array that
            // escapes that byte as well as any others
            escapedBytes = [];
            bytes.forEach((c) => {
                if (c == BEGIN_MARKER_BYTE || c == END_MARKER_BYTE || c == ESCAPE_BYTE) {
                    escapedBytes.push(ESCAPE_BYTE);
                }
                escapedBytes.push(c);
            });
            return escapedBytes;
        }
    });
    return escapedBytes;
}




// TBD remove
let write = function (s) {
    process.stdout.write(s);
};

let writeln = function (s = "") {
    write(s + "\n");
};

function toHexString(byteArray) {
    return Array.from(byteArray, function(b) {
        return ('0' + ((b as number) & 0xFF).toString(16)).slice(-2);
    }).join(' ')
}

