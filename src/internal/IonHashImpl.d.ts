/// <reference types="node" />
import { Decimal } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonDecimal';
import { IonType } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonType';
import { Timestamp } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonTimestamp';
import { TypeCodes } from '/Users/pcornell/dev/ion/ion-js.development/dist/commonjs/es6/IonBinary';
import { IonHasher, IonHashReader, IonHashWriter } from "../IonHash";
export declare class _CryptoIonHasher implements IonHasher {
    private readonly _hash;
    constructor(algorithm: string);
    update(bytes: Uint8Array): void;
    digest(): Buffer;
}
interface _IonValue {
    _annotations(): string[] | undefined;
    _fieldName(): string | null;
    _isNull(): boolean;
    _type(): IonType | null;
    _value(): any;
}
export declare class _HashReaderImpl implements IonHashReader, _IonValue {
    private readonly _reader;
    private readonly _hashFunctionProvider;
    private readonly _hasher;
    private _ionType;
    constructor(reader: any, hashFunctionProvider: any);
    annotations(): string[];
    booleanValue(): boolean;
    byteValue(): Uint8Array;
    decimalValue(): Decimal;
    depth(): number;
    fieldName(): string;
    isNull(): boolean;
    numberValue(): number;
    stringValue(): string;
    timestampValue(): Timestamp;
    value(): any;
    private _traverse;
    next(): IonType;
    stepIn(): void;
    stepOut(): void;
    digest(): Buffer;
    _annotations(): string[] | undefined;
    _fieldName(): string | null;
    _isNull(): boolean;
    _type(): IonType | null;
    _value(): any;
}
export declare class _HashWriterImpl implements IonHashWriter, _IonValue {
    private readonly _writer;
    private readonly _hashFunctionProvider;
    private readonly _hasher;
    private __ionType;
    private __annotations;
    private __fieldName;
    private __isNull;
    private __value;
    constructor(writer: any, hashFunctionProvider: any);
    private _hashScalar;
    writeBlob(value: Uint8Array, annotations?: string[]): void;
    writeBoolean(value: boolean, annotations?: string[]): void;
    writeClob(value: Uint8Array, annotations?: string[]): void;
    writeDecimal(value: Decimal, annotations?: string[]): void;
    writeFloat32(value: number, annotations?: string[]): void;
    writeFloat64(value: number, annotations?: string[]): void;
    writeInt(value: number, annotations?: string[]): void;
    writeNull(type: TypeCodes, annotations?: string[]): void;
    writeString(value: string, annotations?: string[]): void;
    writeSymbol(value: string, annotations?: string[]): void;
    writeTimestamp(value: Timestamp, annotations?: string[]): void;
    private _hashContainer;
    writeList(annotations?: string[], isNull?: boolean): void;
    writeSexp(annotations?: string[], isNull?: boolean): void;
    writeStruct(annotations?: string[], isNull?: boolean): void;
    endContainer(): void;
    writeFieldName(fieldName: string): void;
    getBytes(): Uint8Array;
    close(): void;
    digest(): Buffer;
    _annotations(): string[] | undefined;
    _fieldName(): string | null;
    _isNull(): boolean;
    _type(): IonType | null;
    _value(): any;
}
export declare function _byteArrayComparator(a: number[], b: number[]): 0 | 1 | -1;
export declare function _escape(bytes: any): any;
export {};
