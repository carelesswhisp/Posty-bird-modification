"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancellationException = void 0;
class CancellationException extends Error {
    constructor() {
        super('Cancelled');
    }
}
exports.CancellationException = CancellationException;
