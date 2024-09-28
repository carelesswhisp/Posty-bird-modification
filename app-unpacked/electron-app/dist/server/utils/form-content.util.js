"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = __importDefault(require("lodash"));
class FormContent {
    constructor() { }
    static getTags(defaultTags, websiteTags) {
        const extendDefault = lodash_1.default.get(websiteTags, 'extendDefault', true);
        return extendDefault
            ? [...lodash_1.default.get(websiteTags, 'value', []), ...lodash_1.default.get(defaultTags, 'value', [])]
            : [...lodash_1.default.get(websiteTags, 'value', [])];
    }
    static getDescription(defaultDescription, websiteDescription) {
        const overwriteDefault = lodash_1.default.get(websiteDescription, 'overwriteDefault', false);
        return overwriteDefault
            ? lodash_1.default.get(websiteDescription, 'value', '')
            : lodash_1.default.get(defaultDescription, 'value', '');
    }
    static getSpoilerText(defaultData, partData) {
        const partSpoilerText = partData.spoilerText || '';
        const overwrite = partData.spoilerTextOverwrite === undefined
            ? partSpoilerText.trim() !== ''
            : partData.spoilerTextOverwrite;
        if (overwrite) {
            return partSpoilerText;
        }
        else {
            return defaultData.spoilerText || '';
        }
    }
}
exports.default = FormContent;
