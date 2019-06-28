// TBD
// use uint8array instead of list<number> ?


//let ion = require("/Users/pcornell/dev/ion/ion-hash-js/ion-bundle.js");

import * as ion from '/Users/pcornell/dev/ion/ion-hash-js/ion-bundle.js';

let write = function (s) {
    process.stdout.write(s);
};

let writeln = function (s = "") {
    write(s + "\n");
};

const serializers = {
    "null": (reader, writer) => { writer.writeNull(); },
    "bool": (reader, writer) => { writer.writeBoolean(reader.booleanValue()); },
    "int": (reader, writer) => { writer.writeInt(reader.numberValue()); },
    "float": (reader, writer) => { writer.writeNull(); },
    "decimal": (reader, writer) => { writer.writeDecimal(reader.numberValue()); },
    "timestamp": (reader, writer) => { writer.writeTimestamp(reader.timestampValue()); },
    "symbol": (reader, writer) => { writer.writeSymbol(reader.stringValue()); },
    "string": (reader, writer) => { writer.writeString(reader.stringValue()); },
    "clob": (reader, writer) => { writer.writeClob(reader.byteValue()); },
    "blob": (reader, writer) => { writer.writeBlob(reader.byteValue()); },
}
function serializeNextValue(reader, type): Array<number> {
    let writer = ion.makeBinaryWriter();
    serializers[type.name](reader, writer);
    let bytes = writer.getBytes();
    writer.close();
    return bytes.slice(4);
}

let reader = ion.makeReader("null true 5 /*1.0e*/ 2.3 2000-01-01T hello \"hello\" /*{{\"hello\"}}*/ /*{{aGVsbG8=}}*/");
let type = reader.next();
while (type) {
    let bytes = serializeNextValue(reader, type);
    writeln(reader.value() + ": " + toHexString(bytes));
    type = reader.next();
}
writeln();


function toHexString(byteArray) {
    return Array.from(byteArray, function(b) {
        return ('0' + ((b as number) & 0xFF).toString(16)).slice(-2);
    }).join(' ')
}

function byteArrayComparator(a: Array<number>, b: Array<number>) {
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

//function escape(bytes: Array<number>) {
function _escape(bytes) {
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

