"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownConverter = void 0;
const turndown_1 = __importDefault(require("turndown"));
class MarkdownConverter {
    static convert(html) {
        const td = new turndown_1.default();
        return td.turndown(html).trim();
    }
}
exports.MarkdownConverter = MarkdownConverter;
