"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var ion = require("/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/Ion");
var IonTypes_1 = require("/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonTypes");
var IonBinary_1 = require("/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonBinary");
var crypto_1 = require("crypto");
var _CryptoIonHasher = /** @class */ (function () {
    function _CryptoIonHasher(algorithm) {
        this._hash = crypto_1.createHash(algorithm);
    }
    _CryptoIonHasher.prototype.update = function (bytes) { this._hash.update(bytes); };
    _CryptoIonHasher.prototype.digest = function () { return this._hash.digest(); };
    return _CryptoIonHasher;
}());
exports._CryptoIonHasher = _CryptoIonHasher;
var _HashReaderImpl = /** @class */ (function () {
    function _HashReaderImpl(reader, hashFunctionProvider) {
        this._reader = reader;
        this._hashFunctionProvider = hashFunctionProvider;
        this._hasher = new Hasher(this._hashFunctionProvider);
    }
    // implements IonReader
    _HashReaderImpl.prototype.annotations = function () { return this._reader.annotations(); };
    _HashReaderImpl.prototype.booleanValue = function () { return this._reader.booleanValue(); };
    _HashReaderImpl.prototype.byteValue = function () { return this._reader.byteValue(); };
    _HashReaderImpl.prototype.decimalValue = function () { return this._reader.decimalValue(); };
    _HashReaderImpl.prototype.depth = function () { return this._reader.depth(); };
    _HashReaderImpl.prototype.fieldName = function () { return this._reader.fieldName(); };
    _HashReaderImpl.prototype.isNull = function () { return this._reader.isNull(); };
    _HashReaderImpl.prototype.numberValue = function () { return this._reader.numberValue(); };
    _HashReaderImpl.prototype.stringValue = function () { return this._reader.stringValue(); };
    _HashReaderImpl.prototype.timestampValue = function () { return this._reader.timestampValue(); };
    _HashReaderImpl.prototype.value = function () { return this._reader.value(); };
    _HashReaderImpl.prototype._traverse = function () {
        for (var type = void 0; type = this.next();) {
            if (type.container && !this.isNull()) {
                this.stepIn();
                this._traverse();
                this.stepOut();
            }
        }
    };
    _HashReaderImpl.prototype.next = function () {
        if (this._ionType && this._ionType.container) {
            if (this.isNull()) {
                this._hasher._scalar(this);
            }
            else {
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
    };
    _HashReaderImpl.prototype.stepIn = function () {
        this._hasher._stepIn(this);
        this._reader.stepIn();
        this._ionType = null;
    };
    _HashReaderImpl.prototype.stepOut = function () {
        this._reader.stepOut();
        this._hasher._stepOut();
    };
    // implements IonHashReader
    _HashReaderImpl.prototype.digest = function () { return this._hasher._digest(); };
    // implements _IonValue
    _HashReaderImpl.prototype._annotations = function () { return this.annotations(); };
    _HashReaderImpl.prototype._fieldName = function () { return this.fieldName(); };
    _HashReaderImpl.prototype._isNull = function () { return this.isNull(); };
    _HashReaderImpl.prototype._type = function () { return this._ionType; };
    _HashReaderImpl.prototype._value = function () { return this.value(); };
    return _HashReaderImpl;
}());
exports._HashReaderImpl = _HashReaderImpl;
var _HashWriterImpl = /** @class */ (function () {
    function _HashWriterImpl(writer, hashFunctionProvider) {
        this._writer = writer;
        this._hashFunctionProvider = hashFunctionProvider;
        this._hasher = new Hasher(this._hashFunctionProvider);
    }
    ///// scalars
    _HashWriterImpl.prototype._hashScalar = function (type, value, annotations) {
        this.__ionType = type;
        this.__value = value;
        this.__annotations = annotations;
        this.__isNull = (value == undefined || value == null);
        this._hasher._scalar(this);
        this.__fieldName = null;
    };
    _HashWriterImpl.prototype.writeBlob = function (value, annotations) {
        this._hashScalar(IonTypes_1.IonTypes.BLOB, value, annotations);
        this._writer.writeBlob(value, annotations);
    };
    _HashWriterImpl.prototype.writeBoolean = function (value, annotations) {
        this._hashScalar(IonTypes_1.IonTypes.BOOL, value, annotations);
        this._writer.writeBoolean(value, annotations);
    };
    _HashWriterImpl.prototype.writeClob = function (value, annotations) {
        this._hashScalar(IonTypes_1.IonTypes.CLOB, value, annotations);
        this._writer.writeClob(value, annotations);
    };
    _HashWriterImpl.prototype.writeDecimal = function (value, annotations) {
        this._hashScalar(IonTypes_1.IonTypes.DECIMAL, value, annotations);
        this._writer.writeDecimal(value, annotations);
    };
    _HashWriterImpl.prototype.writeFloat32 = function (value, annotations) {
        this._hashScalar(IonTypes_1.IonTypes.FLOAT, value, annotations);
        this._writer.writeFloat32(value, annotations);
    };
    _HashWriterImpl.prototype.writeFloat64 = function (value, annotations) {
        this._hashScalar(IonTypes_1.IonTypes.FLOAT, value, annotations);
        this._writer.writeFloat64(value, annotations);
    };
    _HashWriterImpl.prototype.writeInt = function (value, annotations) {
        this._hashScalar(IonTypes_1.IonTypes.INT, value, annotations);
        this._writer.writeInt(value, annotations);
    };
    _HashWriterImpl.prototype.writeNull = function (type, annotations) {
        var ionType;
        switch (type) {
            case IonBinary_1.TypeCodes.NULL: {
                ionType = IonTypes_1.IonTypes.NULL;
                break;
            }
            case IonBinary_1.TypeCodes.BOOL: {
                ionType = IonTypes_1.IonTypes.BOOL;
                break;
            }
            case IonBinary_1.TypeCodes.POSITIVE_INT: {
                ionType = IonTypes_1.IonTypes.INT;
                break;
            }
            case IonBinary_1.TypeCodes.NEGATIVE_INT: {
                ionType = IonTypes_1.IonTypes.INT;
                break;
            }
            case IonBinary_1.TypeCodes.FLOAT: {
                ionType = IonTypes_1.IonTypes.FLOAT;
                break;
            }
            case IonBinary_1.TypeCodes.DECIMAL: {
                ionType = IonTypes_1.IonTypes.DECIMAL;
                break;
            }
            case IonBinary_1.TypeCodes.TIMESTAMP: {
                ionType = IonTypes_1.IonTypes.TIMESTAMP;
                break;
            }
            case IonBinary_1.TypeCodes.SYMBOL: {
                ionType = IonTypes_1.IonTypes.SYMBOL;
                break;
            }
            case IonBinary_1.TypeCodes.STRING: {
                ionType = IonTypes_1.IonTypes.STRING;
                break;
            }
            case IonBinary_1.TypeCodes.CLOB: {
                ionType = IonTypes_1.IonTypes.CLOB;
                break;
            }
            case IonBinary_1.TypeCodes.BLOB: {
                ionType = IonTypes_1.IonTypes.BLOB;
                break;
            }
            case IonBinary_1.TypeCodes.LIST: {
                ionType = IonTypes_1.IonTypes.LIST;
                break;
            }
            case IonBinary_1.TypeCodes.SEXP: {
                ionType = IonTypes_1.IonTypes.SEXP;
                break;
            }
            case IonBinary_1.TypeCodes.STRUCT: {
                ionType = IonTypes_1.IonTypes.STRUCT;
                break;
            }
        }
        this._hashScalar(ionType, null, annotations);
        this._writer.writeNull(type, annotations);
    };
    _HashWriterImpl.prototype.writeString = function (value, annotations) {
        this._hashScalar(IonTypes_1.IonTypes.STRING, value, annotations);
        this._writer.writeString(value, annotations);
    };
    _HashWriterImpl.prototype.writeSymbol = function (value, annotations) {
        this._hashScalar(IonTypes_1.IonTypes.SYMBOL, value, annotations);
        this._writer.writeSymbol(value, annotations);
    };
    _HashWriterImpl.prototype.writeTimestamp = function (value, annotations) {
        this._hashScalar(IonTypes_1.IonTypes.TIMESTAMP, value, annotations);
        this._writer.writeTimestamp(value, annotations);
    };
    ///// containers
    _HashWriterImpl.prototype._hashContainer = function (type, annotations, isNull) {
        this.__ionType = type;
        this.__value = null;
        this.__annotations = annotations;
        this.__isNull = false;
        this._hasher._stepIn(this);
        this.__fieldName = null;
    };
    _HashWriterImpl.prototype.writeList = function (annotations, isNull) {
        this._hashContainer(IonTypes_1.IonTypes.LIST, annotations, isNull);
        this._writer.writeList(annotations, isNull);
    };
    _HashWriterImpl.prototype.writeSexp = function (annotations, isNull) {
        this._hashContainer(IonTypes_1.IonTypes.SEXP, annotations, isNull);
        this._writer.writeSexp(annotations, isNull);
    };
    _HashWriterImpl.prototype.writeStruct = function (annotations, isNull) {
        this._hashContainer(IonTypes_1.IonTypes.STRUCT, annotations, isNull);
        this._writer.writeStruct(annotations, isNull);
    };
    _HashWriterImpl.prototype.endContainer = function () {
        this._hasher._stepOut();
        this._writer.endContainer();
    };
    _HashWriterImpl.prototype.writeFieldName = function (fieldName) {
        this.__fieldName = fieldName;
        this._writer.writeFieldName(fieldName);
    };
    _HashWriterImpl.prototype.getBytes = function () { return this._writer.getBytes(); };
    _HashWriterImpl.prototype.close = function () { };
    // implements IonHashWriter
    _HashWriterImpl.prototype.digest = function () { return this._hasher._digest(); };
    // implements _IonValue
    _HashWriterImpl.prototype._annotations = function () { return this.__annotations; };
    _HashWriterImpl.prototype._fieldName = function () { return this.__fieldName; };
    _HashWriterImpl.prototype._isNull = function () { return this.__isNull; }; // TBD can a caller invoke writeString(null) ?
    _HashWriterImpl.prototype._type = function () { return this.__ionType; };
    _HashWriterImpl.prototype._value = function () { return this.__value; };
    return _HashWriterImpl;
}());
exports._HashWriterImpl = _HashWriterImpl;
var Hasher = /** @class */ (function () {
    function Hasher(ihp) {
        this._hasherStack = [];
        this._ihp = ihp;
        this._currentHasher = new _Serializer(this._ihp(), 0);
        this._hasherStack.push(this._currentHasher);
    }
    Hasher.prototype._scalar = function (ionValue) {
        this._currentHasher._scalar(ionValue);
    };
    Hasher.prototype._stepIn = function (ionValue) {
        var hf = this._currentHasher._hashFunction;
        if (this._currentHasher instanceof _StructSerializer) {
            hf = this._ihp();
        }
        if (ionValue._type().name == 'struct') { // TBD
            this._currentHasher = new _StructSerializer(hf, this._depth(), this._ihp);
        }
        else {
            this._currentHasher = new _Serializer(hf, this._depth());
        }
        this._hasherStack.push(this._currentHasher);
        this._currentHasher._stepIn(ionValue);
    };
    Hasher.prototype._stepOut = function () {
        if (this._depth() == 0) {
            throw new Error("Hasher cannot stepOut any further");
        }
        this._currentHasher._stepOut();
        var poppedHasher = this._hasherStack.pop();
        this._currentHasher = this._hasherStack[this._hasherStack.length - 1];
        if (this._currentHasher instanceof _StructSerializer) {
            var digest = poppedHasher._digest();
            this._currentHasher._appendFieldHash(digest);
        }
    };
    Hasher.prototype._digest = function () {
        if (this._depth() != 0) {
            throw new Error("A digest may only be provided at the same depth hashing started");
        }
        return this._currentHasher._digest();
    };
    Hasher.prototype._depth = function () {
        return this._hasherStack.length - 1;
    };
    return Hasher;
}());
var _Serializer = /** @class */ (function () {
    function _Serializer(hashFunction, depth) {
        this._hasContainerAnnotations = false;
        this._hashFunction = hashFunction;
        this._depth = depth;
    }
    _Serializer.prototype._handleFieldName = function (fieldName) {
        if (fieldName != undefined && this._depth > 0) {
            this._writeSymbol(fieldName);
        }
    };
    _Serializer.prototype._handleAnnotationsBegin = function (ionValue, isContainer) {
        if (isContainer === void 0) { isContainer = false; }
        var annotations = ionValue._annotations();
        if (annotations && annotations.length > 0) {
            this._beginMarker();
            this._update(_TQ_ANNOTATED_VALUE);
            for (var _i = 0, annotations_1 = annotations; _i < annotations_1.length; _i++) {
                var annotation = annotations_1[_i];
                this._writeSymbol(annotation);
            }
            if (isContainer) {
                this._hasContainerAnnotations = true;
            }
        }
    };
    _Serializer.prototype._handleAnnotationsEnd = function (ionValue, isContainer) {
        if (isContainer === void 0) { isContainer = false; }
        if ((ionValue && ionValue._annotations() && ionValue._annotations().length > 0)
            || (isContainer && this._hasContainerAnnotations)) {
            this._endMarker();
            if (isContainer) {
                this._hasContainerAnnotations = false;
            }
        }
    };
    _Serializer.prototype._update = function (bytes) { this._hashFunction.update(bytes); };
    _Serializer.prototype._beginMarker = function () { this._hashFunction.update(_BEGIN_MARKER); };
    _Serializer.prototype._endMarker = function () { this._hashFunction.update(_END_MARKER); };
    // TBD merge with scalar()?
    _Serializer.prototype._writeSymbol = function (token) {
        this._beginMarker();
        var scalarBytes = this._getBytes(IonTypes_1.IonTypes.SYMBOL, token, false);
        var _a = this._scalarOrNullSplitParts(IonTypes_1.IonTypes.SYMBOL, false, scalarBytes), tq = _a[0], representation = _a[1];
        this._update(new Uint8Array([tq]));
        if (representation.length > 0) {
            this._update(_escape(representation));
        }
        this._endMarker();
    };
    _Serializer.prototype._getBytes = function (type, value, isNull) {
        if (isNull) {
            return [type.bid << 4 | 0x0F];
        }
        else {
            var writer = ion.makeBinaryWriter();
            _Serializer._serializers[type.name](value, writer);
            writer.close();
            return writer.getBytes().slice(4);
        }
    };
    _Serializer.prototype._getLengthLength = function (bytes) {
        if ((bytes[0] & 0x0F) == 0x0E) {
            // read subsequent byte(s) as the "length" field
            for (var i = 1; i < bytes.length; i++) {
                if ((bytes[i] & 0x80) != 0) {
                    return i;
                }
            }
            throw new Error("Problem while reading VarUInt!");
        }
        return 0;
    };
    _Serializer.prototype._scalarOrNullSplitParts = function (type, isNull, bytes) {
        var offset = 1 + this._getLengthLength(bytes);
        // the representation is everything after TL (first byte) and length
        var representation = bytes.slice(offset);
        var tq = bytes[0];
        if (type.name == 'symbol') { // TBD fix
            // symbols are serialized as strings;  use the correct TQ:
            tq = 0x70;
            if (isNull) {
                tq |= 0x0F;
            }
            // TBD if SID0 ...
        }
        if (type.name != 'bool' // TBD fix
            && type.name != 'symbol' // TBD fix
            && (tq & 0x0F) != 0x0F) { // not a null value
            tq &= 0xF0; // zero - out the L nibble
        }
        return [tq, representation];
    };
    _Serializer.prototype._scalar = function (ionValue) {
        this._handleAnnotationsBegin(ionValue);
        this._beginMarker();
        var scalarBytes = this._getBytes(ionValue._type(), ionValue._value(), ionValue._isNull());
        var _a = this._scalarOrNullSplitParts(ionValue._type(), ionValue._isNull(), scalarBytes), tq = _a[0], representation = _a[1];
        this._update(new Uint8Array([tq]));
        if (representation.length > 0) {
            this._update(_escape(representation));
        }
        this._endMarker();
        this._handleAnnotationsEnd(ionValue);
    };
    _Serializer.prototype._stepIn = function (ionValue) {
        this._handleFieldName(ionValue._fieldName());
        this._handleAnnotationsBegin(ionValue, true);
        this._beginMarker();
        var tq = _TQ[ionValue._type().name.toUpperCase()]; // TBD  rationalize this
        if (ionValue._isNull()) {
            tq |= 0x0F;
        }
        this._update(new Uint8Array([tq]));
    };
    _Serializer.prototype._stepOut = function () {
        this._endMarker();
        this._handleAnnotationsEnd(null, true);
    };
    _Serializer.prototype._digest = function () { return this._hashFunction.digest(); };
    _Serializer._serializers = {
        "null": function (value, writer) { writer.writeNull(); },
        "bool": function (value, writer) { writer.writeBoolean(value); },
        "int": function (value, writer) { writer.writeInt(value); },
        "float": function (value, writer) { writer.writeFloat64(value); },
        "decimal": function (value, writer) { writer.writeDecimal(value); },
        "timestamp": function (value, writer) { writer.writeTimestamp(value); },
        "symbol": function (value, writer) { writer.writeString(value); },
        "string": function (value, writer) { writer.writeString(value); },
        "clob": function (value, writer) { writer.writeClob(value); },
        "blob": function (value, writer) { writer.writeBlob(value); },
    };
    return _Serializer;
}());
var _StructSerializer = /** @class */ (function (_super) {
    __extends(_StructSerializer, _super);
    function _StructSerializer(hashFunction, depth, hashFunctionProvider) {
        var _this = _super.call(this, hashFunction, depth) || this;
        _this._fieldHashes = [];
        _this._scalarSerializer = new _Serializer(hashFunctionProvider(), depth + 1);
        _this._fieldHashes = [];
        return _this;
    }
    _StructSerializer.prototype._scalar = function (value) {
        this._scalarSerializer._handleFieldName(value._fieldName());
        this._scalarSerializer._scalar(value);
        var digest = this._scalarSerializer._digest();
        this._appendFieldHash(digest);
    };
    _StructSerializer.prototype._stepOut = function () {
        this._fieldHashes.sort(_byteArrayComparator);
        for (var _i = 0, _a = this._fieldHashes; _i < _a.length; _i++) {
            var digest = _a[_i];
            this._update(_escape(digest));
        }
        _super.prototype._stepOut.call(this);
    };
    _StructSerializer.prototype._appendFieldHash = function (digest) {
        this._fieldHashes.push(digest);
    };
    return _StructSerializer;
}(_Serializer));
function _byteArrayComparator(a, b) {
    var i = 0;
    while (i < a.length && i < b.length) {
        var a_byte = a[i];
        var b_byte = b[i];
        if (a_byte != b_byte) {
            if (a_byte - b_byte < 0) {
                return -1;
            }
            else {
                return 1;
            }
        }
        i += 1;
    }
    var len_diff = a.length - b.length;
    if (len_diff < 0) {
        return -1;
    }
    else if (len_diff > 0) {
        return 1;
    }
    else {
        return 0;
    }
}
exports._byteArrayComparator = _byteArrayComparator;
var _BEGIN_MARKER_BYTE = 0x0B;
var _END_MARKER_BYTE = 0x0E;
var _ESCAPE_BYTE = 0x0C;
var _BEGIN_MARKER = new Uint8Array([_BEGIN_MARKER_BYTE]);
var _END_MARKER = new Uint8Array([_END_MARKER_BYTE]);
var _TQ = {};
for (var ionType in IonTypes_1.IonTypes) {
    _TQ[ionType] = IonTypes_1.IonTypes[ionType].bid << 4;
}
var _TQ_SYMBOL_SID0 = new Uint8Array([0x71]);
var _TQ_ANNOTATED_VALUE = new Uint8Array([0xE0]);
function _escape(bytes) {
    var escapedBytes = bytes;
    bytes.forEach(function (b) {
        if (b == _BEGIN_MARKER_BYTE || b == _END_MARKER_BYTE || b == _ESCAPE_BYTE) {
            // found a byte that needs to be escaped;  build a new byte array that
            // escapes that byte as well as any others
            escapedBytes = [];
            bytes.forEach(function (c) {
                if (c == _BEGIN_MARKER_BYTE || c == _END_MARKER_BYTE || c == _ESCAPE_BYTE) {
                    escapedBytes.push(_ESCAPE_BYTE);
                }
                escapedBytes.push(c);
            });
            return escapedBytes;
        }
    });
    return escapedBytes;
}
exports._escape = _escape;
//# sourceMappingURL=IonHashImpl.js.map