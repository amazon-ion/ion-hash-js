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

import {Decimal, IntSize, IonType, IonTypes, makeBinaryWriter,
        Reader, ReaderScalarValue, Timestamp, Writer} from 'ion-js';

import {createHash, Hash} from 'crypto';

import {Hasher, HasherProvider, HashReader, HashWriter} from "../IonHash";
import JSBI from "jsbi";

export class _CryptoHasher implements Hasher {
    private _hash: Hash;

    constructor(private readonly algorithm: string) {
        this._hash = createHash(algorithm);
    }
    update(bytes: Uint8Array): void {
        this._hash.update(bytes);
    }
    digest(): Uint8Array {
        let digest = this._hash.digest();
        this._hash = createHash(this.algorithm);
        return digest;
    }
}


interface _IonValue {
    _annotations(): string[];
    _fieldName(): string | null;
    _isNull(): boolean;
    _type(): IonType | null;
    _value(): ReaderScalarValue;
}

export class _HashReaderImpl implements HashReader, _IonValue {
    private readonly _hasher: _Hasher;
    private _ionType: IonType | null = null;

    constructor(private readonly _reader: Reader,
                private readonly _hashFunctionProvider: HasherProvider) {
        this._hasher = new _Hasher(this._hashFunctionProvider);
    }

    // implements Reader
    annotations()   : string[]          { return this._reader.annotations() }
    bigIntValue()   : JSBI | null       { return this._reader.bigIntValue() }
    booleanValue()  : boolean | null    { return this._reader.booleanValue() }
    byteValue()     : Uint8Array | null { return this._reader.byteValue() }
    decimalValue()  : Decimal | null    { return this._reader.decimalValue() }
    depth()         : number            { return this._reader.depth() }
    fieldName()     : string | null     { return this._reader.fieldName() }
    intSize()       : IntSize           { return this._reader.intSize() }
    isNull()        : boolean           { return this._reader.isNull() }
    numberValue()   : number | null     { return this._reader.numberValue() }
    stringValue()   : string | null     { return this._reader.stringValue() }
    timestampValue(): Timestamp | null  { return this._reader.timestampValue() }
    type()          : IonType | null    { return this._reader.type() }
    value()         : ReaderScalarValue { return this._reader.value() }

    private _traverse() {
        for (let type; type = this.next(); ) {
            if (type.isContainer && !this.isNull()) {
                this.stepIn();
                this._traverse();
                this.stepOut();
            }
        }
    }

    next(): IonType | null {
        if (this._ionType && this._ionType.isContainer) {
            if (this.isNull()) {
                this._hasher._scalar(this);
            } else {
                // caller is nexting past a container;  perform deep traversal to ensure hashing correctness
                this.stepIn();
                this._traverse();
                this.stepOut();
            }
        }

        if (this._ionType && this._ionType.isScalar) {
            this._hasher._scalar(this);
        }
        this._ionType = this._reader.next();
        return this._ionType;
    }

    stepIn(): void {
        this._hasher._stepIn(this);
        this._reader.stepIn();
        this._ionType = null;
    }

    stepOut(): void {
        this._traverse();        // fully consume the current container before stepping out
        this._reader.stepOut();
        this._hasher._stepOut();
    }

    // implements HashReader
    digest(): Uint8Array { return this._hasher._digest() }

    // implements _IonValue
    _annotations(): string[]    { return this.annotations() }
    _fieldName(): string | null { return this.fieldName() }
    _isNull(): boolean          { return this.isNull() }
    _type(): IonType | null     { return this._ionType }
    _value(): ReaderScalarValue { return this.value() }
}

export class _HashWriterImpl implements HashWriter, _IonValue {
    private readonly _hasher: _Hasher;

    private __ionType: IonType | null = null;
    private __annotations: string[] = [];
    private __fieldName: string | null = null;
    private __isNull: boolean = false;
    private __value: ReaderScalarValue = null;

    constructor(private readonly _writer: Writer,
                private readonly _hashFunctionProvider: HasherProvider) {
        this._hasher = new _Hasher(this._hashFunctionProvider);
    }

    addAnnotation(annotation: string): void {
        this._writer.addAnnotation(annotation);
        this.__annotations.push(annotation);
    }

    setAnnotations(annotations: string[]): void {
        this._writer.setAnnotations(annotations);
        this.__annotations = annotations;
    }

    ///// scalars

    private _hashScalar(type: IonType, value: ReaderScalarValue): void {
        this.__ionType = type;
        this.__value = value;
        this.__isNull = (value == undefined || value == null);
        this._hasher._scalar(this);
        this.__fieldName = null;
        this.__annotations = [];
    }

    writeBlob(value: Uint8Array | null): void {
        this._hashScalar(IonTypes.BLOB, value);
        this._writer.writeBlob(value);
    }
    writeBoolean(value: boolean | null): void {
        this._hashScalar(IonTypes.BOOL, value);
        this._writer.writeBoolean(value);
    }
    writeClob(value: Uint8Array | null): void {
        this._hashScalar(IonTypes.CLOB, value);
        this._writer.writeClob(value);
    }
    writeDecimal(value: Decimal | null): void {
        this._hashScalar(IonTypes.DECIMAL, value);
        this._writer.writeDecimal(value);
    }
    writeFloat32(value: number | null): void {
        this._hashScalar(IonTypes.FLOAT, value);
        this._writer.writeFloat32(value);
    }
    writeFloat64(value: number | null): void {
        this._hashScalar(IonTypes.FLOAT, value);
        this._writer.writeFloat64(value);
    }
    writeInt(value: number | JSBI | null): void {
        this._hashScalar(IonTypes.INT, value);
        this._writer.writeInt(value);
    }
    writeNull(type: IonType): void {
        this._hashScalar(type, null);
        this._writer.writeNull(type);
    }
    writeString(value: string | null): void {
        this._hashScalar(IonTypes.STRING, value);
        this._writer.writeString(value);
    }
    writeSymbol(value: string | null): void {
        this._hashScalar(IonTypes.SYMBOL, value);
        this._writer.writeSymbol(value);
    }
    writeTimestamp(value: Timestamp | null): void {
        this._hashScalar(IonTypes.TIMESTAMP, value);
        this._writer.writeTimestamp(value);
    }

    ///// containers

    stepIn(type: IonType): void {
        this.__ionType = type;
        this.__value = null;
        this.__isNull = false;
        this._hasher._stepIn(this);
        this._writer.stepIn(type);
        this.__fieldName = null;
        this.__annotations = [];
    }

    stepOut(): void {
        this._hasher._stepOut();
        this._writer.stepOut();
    }


    writeFieldName(fieldName: string): void {
        this.__fieldName = fieldName;
        this._writer.writeFieldName(fieldName);
    }

    writeValue(reader: Reader): void {
        this._writeValue(reader);
    }

    private _writeValue(reader: Reader, _depth = 0): void {
        let type: IonType | null = reader.type();
        if (type === null) {
            return;
        }
        if (_depth > 0) {
            let fieldName = reader.fieldName();
            if (fieldName !== null) {
                this.writeFieldName(fieldName);
            }
        }
        this.setAnnotations(reader.annotations());
        if (reader.isNull()) {
            this.writeNull(type);
        } else {
            switch (type) {
                case IonTypes.BOOL:      this.writeBoolean(reader.booleanValue()); break;
                case IonTypes.INT:       this.writeInt(reader.bigIntValue()); break;
                case IonTypes.FLOAT:     this.writeFloat64(reader.numberValue()); break;
                case IonTypes.DECIMAL:   this.writeDecimal(reader.decimalValue()); break;
                case IonTypes.TIMESTAMP: this.writeTimestamp(reader.timestampValue()); break;
                case IonTypes.SYMBOL:    this.writeSymbol(reader.stringValue()); break;
                case IonTypes.STRING:    this.writeString(reader.stringValue()); break;
                case IonTypes.CLOB:      this.writeClob(reader.byteValue()); break;
                case IonTypes.BLOB:      this.writeBlob(reader.byteValue()); break;
                case IonTypes.LIST:      this.stepIn(IonTypes.LIST); break;
                case IonTypes.SEXP:      this.stepIn(IonTypes.SEXP); break;
                case IonTypes.STRUCT:    this.stepIn(IonTypes.STRUCT); break;
                default: throw new Error('Unrecognized type ' + (type !== null ? type.name : type));
            }
            if (type.isContainer) {
                reader.stepIn();
                this._writeValues(reader, _depth + 1);
                this.stepOut();
                reader.stepOut();
            }
        }
    }

    writeValues(reader: Reader): void {
        this._writeValues(reader);
    }

    private _writeValues(reader: Reader, _depth = 0): void {
        let type: IonType | null = reader.type();
        if (type === null) {
            type = reader.next();
        }
        while (type !== null) {
            this._writeValue(reader, _depth);
            type = reader.next();
        }
    }

    getBytes      (): Uint8Array { return this._writer.getBytes() }
    close         (): void       { }
    depth         (): number     { return this._writer.depth() }

    // implements HashWriter
    digest(): Uint8Array { return this._hasher._digest() }

    // implements _IonValue
    _annotations(): string[]    { return this.__annotations }
    _fieldName(): string | null { return this.__fieldName }
    _isNull(): boolean          { return this.__isNull }
    _type(): IonType | null     { return this.__ionType }
    _value(): ReaderScalarValue { return this.__value }
}

class _Hasher {
    private _currentHasher: _Serializer;
    private readonly _hasherStack: _Serializer[] = [];

    constructor(private readonly _ihp: HasherProvider) {
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

        if (ionValue._type() == IonTypes.STRUCT) {
            this._currentHasher = new _StructSerializer(hf, this._depth(), this._ihp);
        } else {
            this._currentHasher = new _Serializer(hf, this._depth());
        }

        this._hasherStack.push(this._currentHasher);
        this._currentHasher._stepIn(ionValue);
    }

    _stepOut() {
        if (this._depth() == 0) {
            throw new Error("_Hasher cannot stepOut any further");
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
    private static readonly _serializers: { [typeName: string]: (value: any, writer: Writer) => void } = {
        "null":      (value: any, writer: Writer) => { writer.writeNull(IonTypes.NULL) },
        "bool":      (value: any, writer: Writer) => { writer.writeBoolean(value) },
        "int":       (value: any, writer: Writer) => { writer.writeInt(value) },
        "float":     (value: any, writer: Writer) => { writer.writeFloat64(value) },
        "decimal":   (value: any, writer: Writer) => { writer.writeDecimal(value) },
        "timestamp": (value: any, writer: Writer) => { writer.writeTimestamp(value) },
        "symbol":    (value: any, writer: Writer) => { writer.writeString(value) },
        "string":    (value: any, writer: Writer) => { writer.writeString(value) },
        "clob":      (value: any, writer: Writer) => { writer.writeClob(value) },
        "blob":      (value: any, writer: Writer) => { writer.writeBlob(value) },
    };

    private _hasContainerAnnotations = false;

    constructor(public _hashFunction: Hasher, private readonly _depth: number) {
    }

    _handleFieldName(fieldName: string | null | undefined) {
        // the "!= undefined" condition allows the empty symbol to be written
        if (fieldName != undefined && this._depth > 0) {
            this._writeSymbol(fieldName);
        }
    }

    private _handleAnnotationsBegin(ionValue: _IonValue, isContainer=false): void {
        let annotations = ionValue._annotations();
        if (annotations.length > 0) {
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

    private _handleAnnotationsEnd(ionValue: _IonValue | null, isContainer=false): void {
        if ((ionValue && ionValue._annotations().length > 0)
                || (isContainer && this._hasContainerAnnotations)) {
            this._endMarker();
            if (isContainer) {
                this._hasContainerAnnotations = false;
            }
        }
    }

    protected _update(bytes: Uint8Array): void { this._hashFunction.update(bytes) }
    protected _beginMarker(): void { this._hashFunction.update(_BEGIN_MARKER) }
    protected _endMarker(): void   { this._hashFunction.update(_END_MARKER) }

    private _writeSymbol(token: string): void {
        this._beginMarker();
        let scalarBytes = this._getBytes(IonTypes.SYMBOL, token, false);
        let [tq, representation] = this._scalarOrNullSplitParts(IonTypes.SYMBOL, false, scalarBytes);

        this._update(new Uint8Array([tq]));
        if (representation.length > 0) {
            this._update(_escape(representation));
        }
        this._endMarker();
    }

    private _getBytes(type: IonType, value: ReaderScalarValue, isNull: boolean): Uint8Array {
        if (isNull) {
            return Uint8Array.from([type.binaryTypeId << 4 | 0x0F]);
        } else {
            let writer = makeBinaryWriter();
            _Serializer._serializers[type.name](value, writer);
            writer.close();
            return writer.getBytes().slice(4);
        }
    }

    private _getLengthLength(bytes: Uint8Array): number {
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

    private _scalarOrNullSplitParts(type: IonType, isNull: boolean, bytes: Uint8Array): [number, Uint8Array] {
        let offset = 1 + this._getLengthLength(bytes);

        // the representation is everything after TL (first byte) and length
        let representation = bytes.slice(offset);
        let tq = bytes[0];

        if (type == IonTypes.SYMBOL) {
            // symbols are serialized as strings;  use the correct TQ:
            tq = 0x70;
            if (isNull) {
                tq |= 0x0F;
            }
        }

        if (type != IonTypes.BOOL
                && type != IonTypes.SYMBOL
                && (tq & 0x0F) != 0x0F) {    // not a null value
            tq &= 0xF0;                      // zero - out the L nibble
        }

        return [tq, representation]
    }


    _scalar(ionValue: _IonValue) {
        this._handleAnnotationsBegin(ionValue);
        this._beginMarker();
        let scalarBytes = this._getBytes(ionValue._type()!, ionValue._value(), ionValue._isNull());
        let [tq, representation] = this._scalarOrNullSplitParts(ionValue._type()!, ionValue._isNull(), scalarBytes);
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
        let tq = _TQ[ionValue._type()!.name];
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
    private readonly _scalarSerializer: _Serializer;
    private readonly _fieldHashes: Uint8Array[] = [];

    constructor(hashFunction: Hasher,
                depth: number,
                hashFunctionProvider: HasherProvider) {
        super(hashFunction, depth);
        this._scalarSerializer = new _Serializer(hashFunctionProvider(), depth + 1);
        this._fieldHashes = [];
    }

    _scalar(value: _IonValue) {
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

const _TQ: { [ionType: string]: number } = {};
for (let ionType in IonTypes) {
    _TQ[ionType.toLowerCase()] = (IonTypes as any)[ionType].binaryTypeId << 4;
}
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

