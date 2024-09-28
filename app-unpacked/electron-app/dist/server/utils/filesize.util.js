"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class FileSize {
    constructor() { }
    static MBtoBytes(size) {
        return size * 1048576;
    }
    static BytesToMB(size) {
        return size / 1048576;
    }
}
exports.default = FileSize;
