"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLinux = exports.isOSX = exports.isWindows = void 0;
function isWindows() {
    return process.platform === 'win32';
}
exports.isWindows = isWindows;
function isOSX() {
    return process.platform === 'darwin';
}
exports.isOSX = isOSX;
function isLinux() {
    return !(isWindows() || isOSX());
}
exports.isLinux = isLinux;
