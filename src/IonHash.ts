// TBD
// use uint8array instead of list<number> ?
// use rewire to gain access to 'private' functions for testing

import * as ion from '/Users/pcornell/dev/ion/ion-hash-js/ion-bundle.js';

// TBD should HashReader/HashWriter be interfaces that extend Reader/Writer?
/*
export interface HashReader extends Reader {
    digest(): number[];
}

export interface HashWriter extends Writer {
    digest(): number[];
}
*/

export function HashReaderImpl(reader, hashFunctionProvider) {
    let hasher = new Hasher(hashFunctionProvider);
    return {
        booleanValue:   () => { reader.booleanValue() },
        byteValue:      () => { reader.byteValue() },
        decimalValue:   () => { reader.decimalValue() },
        depth:          () => { reader.depth() },
        fieldName:      () => { reader.fieldName() },
        isNull:         () => { reader.isNull() },
        next:           () => { reader.next() },
        numberValue:    () => { reader.numberValue() },
        stepIn:         () => { reader.stepIn() },
        stepOut:        () => { reader.stepOut() },
        stringValue:    () => { reader.stringValue() },
        timestampValue: () => { reader.timestampValue() },
        value:          () => { reader.value() },
        annotations:    () => { reader.annotations() },

        digest:         () => { return "digest bytes" },
    };
}

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

interface IonHasherProvider {
    (): IonHasher;
}

interface IonHasher {
    update(bytes): void;
    digest(): Array<number>;
}

class IdentityIonHasher implements IonHasher {
    private bytes: number[] = [];
    update(b) { this.bytes.push(b) }
    digest() { return this.bytes }
}


class Hasher {
    private ihp: IonHasherProvider;
    private currentHasher: Hasher;
    private hasherStack: Hasher[] = [];

    constructor(ihp: IonHasherProvider) {
        this.ihp = ihp;
        this.currentHasher = new Serializer(this.ihp(), 0);
        this.hasherStack.push(this.currentHasher);
    }

    scalar(type, reader) {
        let writer = ion.makeBinaryWriter();
        serializers[type.name](reader, writer);
        let bytes = writer.getBytes();
        writer.close();
        return bytes.slice(4);
    }

    stepIn() {
    }

    stepOut() {
    }

    digest(): Array<number> {
        return undefined;
    }
}

class Serializer {
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

    def scalar(ion_event) {
        self._handle_annotations_begin(ion_event)
        self._begin_marker()
        scalar_bytes = _serializer(ion_event)(ion_event)
            [tq, representation] = _scalar_or_null_split_parts(ion_event.ion_type, scalar_bytes)
        self._update(bytes([tq]))
        if len(representation) > 0:
            self._update(_escape(representation))
        self._end_marker()
        self._handle_annotations_end(ion_event)
    }
    */

    stepIn(ion_event) {
        //this.handleFieldName(ion_event);
        //this.handleAnnotationsBegin(ion_event, True);
        this.beginMarker();
        this.update(bytes([_TQ[ion_event.ion_type]]));
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
        this.scalarSerializer = Serializer(hashFunctionProvider(), depth + 1);
        this.fieldHashes = [];
    }

    scalar(ion_event) {
        //this.scalarSerializer.handleFieldName(ion_event);
        this.scalarSerializer.scalar(ion_event);
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


const serializers = {
    "null":      (reader, writer) => { writer.writeNull(); },
    "bool":      (reader, writer) => { writer.writeBoolean(reader.booleanValue()); },
    "int":       (reader, writer) => { writer.writeInt(reader.numberValue()); },
    "float":     (reader, writer) => { writer.writeNull(); },
    "decimal":   (reader, writer) => { writer.writeDecimal(reader.numberValue()); },
    "timestamp": (reader, writer) => { writer.writeTimestamp(reader.timestampValue()); },
    "symbol":    (reader, writer) => { writer.writeSymbol(reader.stringValue()); },
    "string":    (reader, writer) => { writer.writeString(reader.stringValue()); },
    "clob":      (reader, writer) => { writer.writeClob(reader.byteValue()); },
    "blob":      (reader, writer) => { writer.writeBlob(reader.byteValue()); },
};
function serializeNextValue(reader, type): number[] {
    let writer = ion.makeBinaryWriter();
    serializers[type.name](reader, writer);
    let bytes = writer.getBytes();
    writer.close();
    return bytes.slice(4);
}

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

