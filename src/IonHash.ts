// TBD
// TBD use uint8array instead of number[] ?
// TBD use rewire to gain access to 'private' functions for testing
// TBD should HashReader/HashWriter be interfaces that extend Reader/Writer?

//import * as ion from '/Users/pcornell/dev/ion/ion-hash-js/ion-bundle.js';
import * as ion from '/Users/pcornell/dev/ion/ion-js/dist/browser/js/ion-bundle.js';
import { Decimal } from '/Users/pcornell/dev/ion/ion-js/dist/amd/es6/IonDecimal';
import { IonType } from '/Users/pcornell/dev/ion/ion-js/dist/amd/es6/IonType';
import { IonTypes } from '/Users/pcornell/dev/ion/ion-js/dist/amd/es6/IonTypes';
import { Reader as IonReader } from '/Users/pcornell/dev/ion/ion-js/dist/amd/es6/IonReader';
import { Timestamp } from '/Users/pcornell/dev/ion/ion-js/dist/amd/es6/IonTimestamp';
import { Writer as IonWriter } from '/Users/pcornell/dev/ion/ion-js/dist/amd/es6/IonWriter';
/*
import { Decimal } from 'src/ion-js/src/IonDecimal.js';
import { IonType } from 'src/ion-js/src/IonType.js';
import { IonTypes } from 'src/ion-js/src/IonTypes.js';
import { Reader as IonReader } from 'src/ion-js/src/IonReader.js';
import { Timestamp } from 'src/ion-js/src/IonTimestamp.js';
import { Writer as IonWriter }from 'src/ion-js/src/IonWriter.js';
*/
/*
import { Decimal } from 'src/ion-js/src/IonDecimal';
import { IonType } from 'src/ion-js/src/IonType';
import { IonTypes } from 'src/ion-js/src/IonTypes';
import { Reader as IonReader } from 'src/ion-js/src/IonReader';
import { Timestamp } from 'src/ion-js/src/IonTimestamp';
import { Writer as IonWriter }from 'src/ion-js/src/IonWriter';
*/

export interface HashReader extends IonReader {
    digest(): number[];
}

export interface HashWriter extends IonWriter {
    digest(): number[];
}

interface TypedValue {
    type(): IonType;
    value(): any;
}

export function hashReader(reader, hashFunctionProvider) {
    return new HashReaderImpl(reader, hashFunctionProvider);
}

class HashReaderImpl implements HashReader, TypedValue {
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
    byteValue()     : number[]  { return this.reader.byteValue() }
    decimalValue()  : Decimal   { return this.reader.decimalValue() }
    depth()         : number    { return this.reader.depth() }
    fieldName()     : string    { return this.reader.fieldName() }
    isNull()        : boolean   { return this.reader.isNull() }
    next()          : IonType   {
        this.ionType = this.reader.next();
        this.hasher.scalar(this.ionType, this.value());
        return this.ionType;
    }
    numberValue()   : number    { return this.reader.numberValue() }
    stepIn()        : void      { this.reader.stepIn() }
    stepOut()       : void      { this.reader.stepOut() }
    stringValue()   : string    { return this.reader.stringValue() }
    timestampValue(): Timestamp { return this.reader.timestampValue() }
    value()         : any       { return this.reader.value() }

    digest(): number[] { return this.hasher.digest() }
    type(): IonType { return this.ionType }
}

/*
export function HashWriterImpl(writer, hashFunctionProvider) {
    return {
        writeBlob:      (value: number[], annotations?: string[])   => { writer.writeBlob(value, annotations) },
        writeBoolean:   (value: boolean, annotations?: string[])    => { writer.writeBoolean(value, annotations) },
        writeClob:      (value: number[], annotations?: string[])   => { writer.writeClob(value, annotations) },
        writeDecimal:   (value: Decimal, annotations?: string[])    => { writer.writeDecimal(value, annotations) },
        writeFieldName: (fieldName: string)                         => { writer.writeFieldName(fieldName) },
        writeFloat32:   (value: number, annotations?: string[])     => { writer.writeFloat32(value, annotations) },
        writeFloat64:   (value: number, annotations?: string[])     => { writer.writeFloat64(value, annotations) },
        writeInt:       (value: number, annotations?: string[])     => { writer.writeInt(value, annotations) },
        writeList:      (annotations?: string[], isNull?: boolean)  => { writer.writeList(annotations, isNull) },
        writeNull:      (type: TypeCodes, annotations?: string[])   => { writer.writeNull(type, annotations) },
        writeSexp:      (annotations?: string[], isNull?: boolean)  => { writer.writeSexp(annotations, isNull) },
        writeString:    (value: string, annotations?: string[])     => { writer.writeString(value, annotations) },
        writeStruct:    (annotations?: string[], isNull?: boolean)  => { writer.writeStruct(annotations, isNull) },
        writeSymbol:    (value: string, annotations?: string[])     => { writer.writeSymbol(value, annotations) },
        writeTimestamp: (value: Timestamp, annotations?: string[])  => { writer.writeTimestamp(value, annotations) },

        getBytes:       () => { writer.getBytes() },
        close:          () => { writer.close() },
        endContainer:   () => { writer.endContainer() },

        digest:         () => { return "digest bytes" },
    };
}
 */

export interface IonHasherProvider {
    (): IonHasher;
}

export interface IonHasher {
    update(bytes): void;
    digest(): number[];
}

class IdentityIonHasher implements IonHasher {
    private bytes: number[] = [];
    update(b) { this.bytes.push(b) }
    digest() { return this.bytes }
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

    scalar(type, value) {
        this.currentHasher.scalar(type, value);
    }

    stepIn() {
    }

    stepOut() {
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
        "float":     (value, writer) => { writer.writeNull() },
        "decimal":   (value, writer) => { writer.writeDecimal(value) },
        "timestamp": (value, writer) => { writer.writeTimestamp(value) },
        "symbol":    (value, writer) => { writer.writeSymbol(value) },
        "string":    (value, writer) => { writer.writeString(value) },
        "clob":      (value, writer) => { writer.writeClob(value) },
        "blob":      (value, writer) => { writer.writeBlob(value) },
    };

    private hashFunction: IonHasher;
    private hasContainerAnnotations = false;
    private depth: number;

    constructor(hashFunction, depth) {
        this.hashFunction = hashFunction;
        this.depth = depth;
    }

    /*
    handleFieldName(ion_event) {
        if ion_event.field_name is not None and self._depth > 0:
            self._write_symbol(ion_event.field_name)
    }

    handleAnnotationsBegin(ion_event, is_container=False) {
        if len(ion_event.annotations) > 0:
            self._begin_marker()
        self.hash_function.update(_TQ_ANNOTATED_VALUE)
        for annotation in ion_event.annotations:
            self._write_symbol(annotation)
        if is_container:
            self._has_container_annotations = True
    }
    */

    handleAnnotationsEnd(ion_event, is_container /*=False*/) {
        /*
        if (ion_event is not None and len(ion_event.annotations) > 0) \
                or (is_container and self._has_container_annotations):
        self._end_marker()
        if is_container:
            self._has_container_annotations = False
         */
    }

    update(bytes) { this.hashFunction.update(bytes) }
    beginMarker() { this.hashFunction.update(BEGIN_MARKER_BYTE) }
    endMarker()   { this.hashFunction.update(END_MARKER_BYTE) }

    /*
    private def _write_symbol(token) {
        self._begin_marker()
        _bytes = _serialize_symbol_token(token)
            [tq, representation] = _scalar_or_null_split_parts(IonType.SYMBOL, _bytes)
        self._update(bytes([tq]))
        if len(representation) > 0:
            self._update(_escape(representation))
        self._end_marker()
    }
    */

    private getBytes(type, value) {
        if (value != undefined) {
            let writer = ion.makeBinaryWriter();
            Serializer.serializers[type.name](value, writer);
            writer.close();
            let bytes = writer.getBytes().slice(4);
            return bytes;
        }
        return [];
    }


    scalar(type, value) {
        //self._handle_annotations_begin(ion_event)
        this.beginMarker();
        let scalarBytes = this.getBytes(type, value);
        this.update(scalarBytes);   // TBD remove
        //[tq, representation] = _scalar_or_null_split_parts(ion_event.ion_type, scalar_bytes)
        //self._update(bytes([tq]))
        //if len(representation) > 0:
            //self._update(_escape(representation))
        this.endMarker();
        //self._handle_annotations_end(ion_event)
    }

    stepIn(ion_event) {
        //this.handleFieldName(ion_event);
        //this.handleAnnotationsBegin(ion_event, True);
        this.beginMarker();
        this.update(TQ[ion_event.ion_type]);
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

    scalar(ion_event) {
        //this.scalarSerializer.handleFieldName(ion_event);
        //this.scalarSerializer.scalar(ion_event);
        let digest = this.scalarSerializer.digest();
        this.appendFieldHash(digest);
    }

    stepOut() {
        //this.fieldHashes.sort(key = cmp_to_key(_bytearray_comparator));
        for (let digest of this.fieldHashes) {
            this.update(escape(digest));
        }
        super.stepOut();
    }

    appendFieldHash(digest) {
        this.fieldHashes.push(digest);
    }
}



/*
function serializeNextValue(reader, type): number[] {
    let writer = ion.makeBinaryWriter();
    serializers[type.name](reader, writer);
    let bytes = writer.getBytes();
    writer.close();
    return bytes.slice(4);
}
*/

//let reader = ion.makeReader("null true 5 /*1.0e*/ 2.3 2000-01-01T hello \"hello\" /*{{\"hello\"}}*/ /*{{aGVsbG8=}}*/");
//let type = reader.next();
//while (type) {
//    let bytes = serializeNextValue(reader, type);
//    writeln(reader.value() + ": " + toHexString(bytes));
//    type = reader.next();
//}
//writeln();


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
    bytes.forEach((b) => {
        if (b == BEGIN_MARKER_BYTE || b == END_MARKER_BYTE || b == ESCAPE_BYTE) {
            // found a byte that needs to be escaped;  build a new byte array that
            // escapes that byte as well as any others
            let escapedBytes = [];
            bytes.forEach((c) => {
                if (c == BEGIN_MARKER_BYTE || c == END_MARKER_BYTE || c == ESCAPE_BYTE) {
                    escapedBytes.push(ESCAPE_BYTE);
                }
                escapedBytes.push(c);
            });
            return escapedBytes;
        }
    });
    return bytes;
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

