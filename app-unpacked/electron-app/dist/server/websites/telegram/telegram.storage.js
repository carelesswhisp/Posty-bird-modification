"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramStorage = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const directories_1 = require("../../directories");
(0, fs_extra_1.ensureDirSync)((0, path_1.join)(directories_1.BASE_DIRECTORY, 'auth', 'telegram'));
class TelegramStorage {
    constructor(name) {
        this.name = name;
        this.storage = {};
        try {
            this.storage = (0, fs_extra_1.readJSONSync)(this.getFileName());
        }
        catch (err) {
            console.error(err);
        }
    }
    getFileName() {
        return (0, path_1.join)(directories_1.BASE_DIRECTORY, 'auth', 'telegram', `${this.name}.json`);
    }
    get(key) {
        return this.storage[key];
    }
    set(key, value) {
        this.storage[key] = value;
        return (0, fs_extra_1.writeJSON)(this.getFileName(), this.storage, { spaces: 1 }).then(() => this.storage[key]);
    }
}
exports.TelegramStorage = TelegramStorage;
