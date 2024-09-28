"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancellationToken = void 0;
class CancellationToken {
    constructor(cancelCallback) {
        this.cancelCallback = cancelCallback;
        this.cancelState = false;
    }
    cancel() {
        if (!this.cancelState) {
            this.cancelState = true;
            if (this.cancelCallback) {
                this.cancelCallback();
            }
        }
    }
    isCancelled() {
        return this.cancelState;
    }
}
exports.CancellationToken = CancellationToken;
