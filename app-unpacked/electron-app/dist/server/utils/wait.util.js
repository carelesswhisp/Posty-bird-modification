"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WaitUtil {
    static wait(ms) {
        if (ms <= 0) {
            throw new Error('Wait ms must be > 0');
        }
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
}
exports.default = WaitUtil;
