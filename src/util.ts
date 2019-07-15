export function write(s) {
    process.stdout.write(s);
};

export function writeln(s = "") {
    write(s + "\n");
};

export function toHexString(byteArray) {
    let sb = '';
    byteArray.forEach(b => {
        if (sb != '') { sb += ' ' }
        sb += ('0' + ((b as number) & 0xFF).toString(16)).slice(-2);
    });
    return sb;
}

