"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableSleep = exports.preventSleep = void 0;
const { powerSaveBlocker } = require('electron');
let blocker = null;
function preventSleep() {
    if (blocker === null) {
        blocker = powerSaveBlocker.start('prevent-app-suspension');
        console.log(`App suspension blocker: enabled (${blocker})`);
    }
}
exports.preventSleep = preventSleep;
function enableSleep() {
    if (blocker !== null && powerSaveBlocker.isStarted(blocker)) {
        powerSaveBlocker.stop(blocker);
        console.log(`App suspension blocker: disabled (${blocker})`);
    }
    blocker = null;
}
exports.enableSleep = enableSleep;
