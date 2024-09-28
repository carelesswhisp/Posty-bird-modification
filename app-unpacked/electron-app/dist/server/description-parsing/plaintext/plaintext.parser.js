"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaintextParser = void 0;
const cheerio_1 = __importDefault(require("cheerio"));
class PlaintextParser {
    static parse(html, linkLength) {
        if (!html) {
            return '';
        }
        html = html.replace(/<br(\/|\s\/){0,1}>/g, '<br>');
        html = html.replace(/<br>\n/gi, '<br>');
        html = html.replace(/<br>/gi, '\n');
        html = html.replace(/<hr(.*?)>/gi, '\n------------\n');
        let next = null;
        while ((next = html.match(/<a(.*?)href="(.*?)">(.*?)<\/a>/))) {
            const url = linkLength ? next[2].substring(0, linkLength) : next[2];
            html = html.replace(next[0], url);
        }
        const $ = cheerio_1.default.load('');
        return $(html).text().trim();
    }
}
exports.PlaintextParser = PlaintextParser;
