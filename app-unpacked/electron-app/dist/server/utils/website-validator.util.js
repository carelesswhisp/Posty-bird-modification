"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
class WebsiteValidator {
    constructor() { }
    static supportsFileType(fileInfo, supportedFileTypes) {
        const split = fileInfo.mimetype.split('/')[1];
        let extension = null;
        if (fileInfo.name) {
            extension = path_1.default.extname(fileInfo.name).replace('.', '').toLowerCase();
        }
        for (const type of supportedFileTypes) {
            if ((fileInfo.type && type.includes(fileInfo.type)) || (split && type.includes(split))) {
                return true;
            }
            else if (extension && type.includes(extension)) {
                return true;
            }
        }
        return false;
    }
    static folderIdExists(id, folders) {
        if (!folders)
            return false;
        for (const folder of folders) {
            if (folder.value === id) {
                return true;
            }
            if (folder.children) {
                if (WebsiteValidator.folderIdExists(id, folder.children)) {
                    return true;
                }
            }
        }
        return false;
    }
}
exports.default = WebsiteValidator;
