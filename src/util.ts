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

