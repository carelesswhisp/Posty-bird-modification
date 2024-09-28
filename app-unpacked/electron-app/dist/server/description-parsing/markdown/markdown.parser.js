"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownParser = void 0;
const turndown_1 = __importDefault(require("turndown"));
class MarkdownParser {
    static parse(html) {
        if (!html) {
            return '';
        }
        html = html.replace(/<\/div>\n<br>/g, '</div>\n');
        return MarkdownParser.parser.turndown(html);
    }
}
exports.MarkdownParser = MarkdownParser;
MarkdownParser.parser = new turndown_1.default();
