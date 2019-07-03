export function write(s) {
    process.stdout.write(s);
};

export function writeln(s = "") {
    write(s + "\n");
};

export function toHexString(byteArray) {
    return Array.from(byteArray, function(b) {
        return ('0' + ((b as number) & 0xFF).toString(16)).slice(-2);
    }).join(' ')
}

