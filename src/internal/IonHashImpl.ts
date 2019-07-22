import * as ion from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/Ion';
import { Decimal } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonDecimal';
import { IonType } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonType';
import { IonTypes } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonTypes';
import { Reader as IonReader } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonReader';
import { Timestamp } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonTimestamp';
import { TypeCodes } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonBinary';

import { createHash, Hash } from 'crypto';
import {IonHasher, IonHasherProvider, IonHashReader, IonHashWriter} from "../IonHash";

export class _CryptoIonHasher implements IonHasher {
    private readonly _hash: Hash;

    constructor(algorithm: string) {
        this._hash = createHash(algorithm);
    }
    update(bytes: Uint8Array): void { this._hash.update(bytes) }
    digest(): Uint8Array { return this._hash.digest() }
}


interface _IonValue {
    _annotations(): string[] | undefined;
    _fieldName(): string | null;
    _isNull(): boolean;
    _type(): IonType | null;
    _value(): any;
}

export class _HashReaderImpl implements IonHashReader, _IonValue {
    private readonly _hasher: Hasher;
    private _ionType: IonType | null = null;

    constructor(private readonly _reader: IonReader, private readonly _hashFunctionProvider) {
        this._hasher = new Hasher(this._hashFunctionProvider);
    }

    // implements IonReader
    annotations()   : string[]  { return this._reader.annotations() }
    booleanValue()  : boolean   { return this._reader.booleanValue() }
    byteValue()     : Uint8Array  { return this._reader.byteValue() }
    decimalValue()  : Decimal   { return this._reader.decimalValue() }
    depth()         : number    { return this._reader.depth() }
    fieldName()     : string    { return this._reader.fieldName() }
    isNull()        : boolean   { return this._reader.isNull() }
    numberValue()   : number    { return this._reader.numberValue() }
    stringValue()   : string    { return this._reader.stringValue() }
    timestampValue(): Timestamp { return this._reader.timestampValue() }
    value()         : any       { return this._reader.value() }

    private _traverse() {
        for (let type; type = this.next(); ) {
            if (type.container && !this.isNull()) {
                this.stepIn();
                this._traverse();
                this.stepOut();
            }
        }
    }

    next(): IonType {
        if (this._ionType && this._ionType.container) {
            if (this.isNull()) {
                this._hasher._scalar(this);
            } else {
                // caller is nexting past a container;  perform deep traversal to ensure hashing correctness
                this.stepIn();
                this._traverse();
                this.stepOut();
            }
        }

        this._ionType = this._reader.next();
        if (this._ionType && this._ionType.scalar) {
            this._hasher._scalar(this);
        }
        return this._ionType;
    }

    stepIn() {
        this._hasher._stepIn(this);
        this._reader.stepIn();
        this._ionType = null;
    }

    stepOut() {
        this._reader.stepOut();
        this._hasher._stepOut();
    }

    // implements IonHashReader
    digest(): Uint8Array { return this._hasher._digest() }

    // implements _IonValue
    _annotations(): string[] | undefined { return this.annotations() }
    _fieldName(): string | null          { return this.fieldName() }
    _isNull(): boolean                   { return this.isNull() }
    _type(): IonType | null              { return this._ionType }
    _value(): any                        { return this.value() }
}

export class _HashWriterImpl implements IonHashWriter, _IonValue {
    private readonly _hasher: Hasher;

    private __ionType: IonType | null = null;
    private __annotations: string[] | undefined;
    private __fieldName: string | null = null;
    private __isNull: boolean = false;
    private __value: any;

    constructor(private readonly _writer, private readonly _hashFunctionProvider) {
        this._hasher = new Hasher(this._hashFunctionProvider);
    }

    ///// scalars

    private _hashScalar(type: IonType, value: any, annotations?: string[]) {
        this.__ionType = type;
        this.__value = value;
        this.__annotations = annotations;
        this.__isNull = (value == undefined || value == null);
        this._hasher._scalar(this);
        this.__fieldName = null;
    }

    writeBlob(value: Uint8Array, annotations?: string[]) {
        this._hashScalar(IonTypes.BLOB, value, annotations);
        this._writer.writeBlob(value, annotations);
    }
    writeBoolean(value: boolean, annotations?: string[]) {
        this._hashScalar(IonTypes.BOOL, value, annotations);
        this._writer.writeBoolean(value, annotations);
    }
    writeClob(value: Uint8Array, annotations?: string[]) {
        this._hashScalar(IonTypes.CLOB, value, annotations);
        this._writer.writeClob(value, annotations);
    }
    writeDecimal(value: Decimal, annotations?: string[]) {
        this._hashScalar(IonTypes.DECIMAL, value, annotations);
        this._writer.writeDecimal(value, annotations);
    }
    writeFloat32(value: number, annotations?: string[]) {
        this._hashScalar(IonTypes.FLOAT, value, annotations);
        this._writer.writeFloat32(value, annotations);
    }
    writeFloat64(value: number, annotations?: string[]) {
        this._hashScalar(IonTypes.FLOAT, value, annotations);
        this._writer.writeFloat64(value, annotations);
    }
    writeInt(value: number, annotations?: string[]) {
        this._hashScalar(IonTypes.INT, value, annotations);
        this._writer.writeInt(value, annotations);
    }
    writeNull(type: TypeCodes, annotations?: string[]) {
        let ionType;
        switch (type) {
            case TypeCodes.NULL:         { ionType = IonTypes.NULL; break }
            case TypeCodes.BOOL:         { ionType = IonTypes.BOOL; break }
            case TypeCodes.POSITIVE_INT: { ionType = IonTypes.INT; break }
            case TypeCodes.NEGATIVE_INT: { ionType = IonTypes.INT; break }
            case TypeCodes.FLOAT:        { ionType = IonTypes.FLOAT; break }
            case TypeCodes.DECIMAL:      { ionType = IonTypes.DECIMAL; break }
            case TypeCodes.TIMESTAMP:    { ionType = IonTypes.TIMESTAMP; break }
            case TypeCodes.SYMBOL:       { ionType = IonTypes.SYMBOL; break }
            case TypeCodes.STRING:       { ionType = IonTypes.STRING; break }
            case TypeCodes.CLOB:         { ionType = IonTypes.CLOB; break }
            case TypeCodes.BLOB:         { ionType = IonTypes.BLOB; break }
            case TypeCodes.LIST:         { ionType = IonTypes.LIST; break }
            case TypeCodes.SEXP:         { ionType = IonTypes.SEXP; break }
            case TypeCodes.STRUCT:       { ionType = IonTypes.STRUCT; break }
        }
        this._hashScalar(ionType, null, annotations);
        this._writer.writeNull(type, annotations);
    }
    writeString(value: string, annotations?: string[]) {
        this._hashScalar(IonTypes.STRING, value, annotations);
        this._writer.writeString(value, annotations);
    }
    writeSymbol(value: string, annotations?: string[]) {
        this._hashScalar(IonTypes.SYMBOL, value, annotations);
        this._writer.writeSymbol(value, annotations);
    }
    writeTimestamp(value: Timestamp, annotations?: string[]) {
        this._hashScalar(IonTypes.TIMESTAMP, value, annotations);
        this._writer.writeTimestamp(value, annotations);
    }

    ///// containers

    private _hashContainer(type: IonType, annotations?: string[], isNull?: boolean) {
        this.__ionType = type;
        this.__value = null;
        this.__annotations = annotations;
        this.__isNull = false;
        this._hasher._stepIn(this);
        this.__fieldName = null;
    }

    writeList(annotations?: string[], isNull?: boolean) {
        this._hashContainer(IonTypes.LIST, annotations, isNull);
        this._writer.writeList(annotations, isNull);
    }
    writeSexp(annotations?: string[], isNull?: boolean) {
        this._hashContainer(IonTypes.SEXP, annotations, isNull);
        this._writer.writeSexp(annotations, isNull);
    }
    writeStruct(annotations?: string[], isNull?: boolean) {
        this._hashContainer(IonTypes.STRUCT, annotations, isNull);
        this._writer.writeStruct(annotations, isNull);
    }
    endContainer() {
        this._hasher._stepOut();
        this._writer.endContainer();
    }


    writeFieldName(fieldName: string) {
        this.__fieldName = fieldName;
        this._writer.writeFieldName(fieldName);
    }

    getBytes      (): Uint8Array { return this._writer.getBytes() }
    close         ()             { }

    // implements IonHashWriter
    digest(): Uint8Array { return this._hasher._digest() }

    // implements _IonValue
    _annotations(): string[] | undefined { return this.__annotations }
    _fieldName(): string | null          { return this.__fieldName }
    _isNull(): boolean                   { return this.__isNull }   // TBD can a caller invoke writeString(null) ?
    _type(): IonType | null              { return this.__ionType }
    _value(): any                        { return this.__value }
}

class Hasher {
    private _currentHasher: _Serializer;
    private readonly _hasherStack: _Serializer[] = [];

    constructor(private readonly _ihp: IonHasherProvider) {
        this._currentHasher = new _Serializer(this._ihp(), 0);
        this._hasherStack.push(this._currentHasher);
    }

    _scalar(ionValue: _IonValue) {
        this._currentHasher._scalar(ionValue);
    }

    _stepIn(ionValue: _IonValue) {
        let hf = this._currentHasher._hashFunction;
        if (this._currentHasher instanceof _StructSerializer) {
            hf = this._ihp();
        }

        if (ionValue._type()!.name == 'struct') {   // TBD
            this._currentHasher = new _StructSerializer(hf, this._depth(), this._ihp);
        } else {
            this._currentHasher = new _Serializer(hf, this._depth());
        }

        this._hasherStack.push(this._currentHasher);
        this._currentHasher._stepIn(ionValue);
    }

    _stepOut() {
        if (this._depth() == 0) {
            throw new Error("Hasher cannot stepOut any further");
        }

        this._currentHasher._stepOut();
        let poppedHasher = this._hasherStack.pop()!;
        this._currentHasher = this._hasherStack[this._hasherStack.length - 1];

        if (this._currentHasher instanceof _StructSerializer) {
            let digest = poppedHasher._digest();
            this._currentHasher._appendFieldHash(digest);
        }
    }

    _digest(): Uint8Array {
        if (this._depth() != 0) {
            throw new Error("A digest may only be provided at the same depth hashing started")
        }
        return this._currentHasher._digest();
    }

    private _depth(): number {
        return this._hasherStack.length - 1;
    }
}

class _Serializer {
    private static readonly _serializers = {
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

    private _hasContainerAnnotations = false;

    constructor(public _hashFunction: IonHasher, private readonly _depth: number) {
    }

    _handleFieldName(fieldName) {
        if (fieldName != undefined && this._depth > 0) {
            this._writeSymbol(fieldName);
        }
    }

    private _handleAnnotationsBegin(ionValue, isContainer=false) {
        let annotations = ionValue._annotations();
        if (annotations && annotations.length > 0) {
            this._beginMarker();
            this._update(_TQ_ANNOTATED_VALUE);
            for (let annotation of annotations) {
                this._writeSymbol(annotation);
            }
            if (isContainer) {
                this._hasContainerAnnotations = true;
            }
        }
    }

    private _handleAnnotationsEnd(ionValue, isContainer=false) {
        if ((ionValue && ionValue._annotations() && ionValue._annotations().length > 0)
            || (isContainer && this._hasContainerAnnotations)) {
            this._endMarker();
            if (isContainer) {
                this._hasContainerAnnotations = false;
            }
        }
    }

    protected _update(bytes: Uint8Array) { this._hashFunction.update(bytes) }
    protected _beginMarker() { this._hashFunction.update(_BEGIN_MARKER) }
    protected _endMarker()   { this._hashFunction.update(_END_MARKER) }

    // TBD merge with scalar()?
    private _writeSymbol(token) {
        this._beginMarker();
        let scalarBytes = this._getBytes(IonTypes.SYMBOL, token, false);
        let [tq, representation] = this._scalarOrNullSplitParts(IonTypes.SYMBOL, false, scalarBytes);

        this._update(new Uint8Array([tq]));
        if (representation.length > 0) {
            this._update(_escape(representation));
        }
        this._endMarker();
    }

    private _getBytes(type, value, isNull) {
        if (isNull) {
            return [type.bid << 4 | 0x0F];
        } else {
            let writer = ion.makeBinaryWriter();
            _Serializer._serializers[type.name](value, writer);
            writer.close();
            return writer.getBytes().slice(4);
        }
    }

    private _getLengthLength(bytes): number {
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

    private _scalarOrNullSplitParts(type, isNull, bytes) {
        let offset = 1 + this._getLengthLength(bytes);

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


    _scalar(ionValue: _IonValue) {
        this._handleAnnotationsBegin(ionValue);
        this._beginMarker();
        let scalarBytes = this._getBytes(ionValue._type(), ionValue._value(), ionValue._isNull());
        let [tq, representation] = this._scalarOrNullSplitParts(ionValue._type(), ionValue._isNull(), scalarBytes);
        this._update(new Uint8Array([tq]));
        if (representation.length > 0) {
            this._update(_escape(representation));
        }
        this._endMarker();
        this._handleAnnotationsEnd(ionValue);
    }

    _stepIn(ionValue: _IonValue) {
        this._handleFieldName(ionValue._fieldName());
        this._handleAnnotationsBegin(ionValue, true);
        this._beginMarker();
        let tq = _TQ[ionValue._type()!.name.toUpperCase()];   // TBD  rationalize this
        if (ionValue._isNull()) {
            tq |= 0x0F;
        }
        this._update(new Uint8Array([tq]));
    }

    _stepOut() {
        this._endMarker();
        this._handleAnnotationsEnd(null, true);
    }

    _digest() { return this._hashFunction.digest() }
}

class _StructSerializer extends _Serializer {
    _scalarSerializer: _Serializer;
    _fieldHashes: Uint8Array[] = [];

    constructor(hashFunction, depth, hashFunctionProvider) {
        super(hashFunction, depth);
        this._scalarSerializer = new _Serializer(hashFunctionProvider(), depth + 1);
        this._fieldHashes = [];
    }

    _scalar(value) {
        this._scalarSerializer._handleFieldName(value._fieldName());
        this._scalarSerializer._scalar(value);
        let digest = this._scalarSerializer._digest();
        this._appendFieldHash(digest);
    }

    _stepOut() {
        this._fieldHashes.sort(_Uint8ArrayComparator);
        for (let digest of this._fieldHashes) {
            this._update(_escape(digest));
        }
        super._stepOut();
    }

    _appendFieldHash(digest: Uint8Array) {
        this._fieldHashes.push(digest);
    }
}


export function _Uint8ArrayComparator(a: Uint8Array, b: Uint8Array): number {
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

const _BEGIN_MARKER_BYTE = 0x0B;
const _END_MARKER_BYTE = 0x0E;
const _ESCAPE_BYTE = 0x0C;
const _BEGIN_MARKER = new Uint8Array([_BEGIN_MARKER_BYTE]);
const _END_MARKER = new Uint8Array([_END_MARKER_BYTE]);

const _TQ = {};
for (let ionType in IonTypes) {
    _TQ[ionType] = IonTypes[ionType].bid << 4;
}
const _TQ_SYMBOL_SID0 = new Uint8Array([0x71]);
const _TQ_ANNOTATED_VALUE = new Uint8Array([0xE0]);


export function _escape(bytes: Uint8Array): Uint8Array {
    for (let i = 0; i < bytes.length; i++) {
        let b = bytes[i];
        if (b == _BEGIN_MARKER_BYTE || b == _END_MARKER_BYTE || b == _ESCAPE_BYTE) {
            // found a byte that needs to be escaped;  build a new byte array that
            // escapes that byte as well as any others
            let escapedBytes: number[] = [];
            for (let j = 0; j < bytes.length; j++) {
                let c = bytes[j];
                if (c == _BEGIN_MARKER_BYTE || c == _END_MARKER_BYTE || c == _ESCAPE_BYTE) {
                    escapedBytes.push(_ESCAPE_BYTE);
                }
                escapedBytes.push(c);
            }
            return new Uint8Array(escapedBytes);
        }
    }
    return bytes;
}

