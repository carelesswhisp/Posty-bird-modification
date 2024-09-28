"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomHTMLParser = void 0;
class CustomHTMLParser {
    static parse(html) {
        if (!html) {
            return '';
        }
        const blocks = ['p', 'div', 'pre'];
        blocks.forEach(block => {
            const regex = new RegExp(`<${block}(.*?)>((.|\n)*?)<\/${block}>`, 'gmi');
            html = html.replace(regex, '$2<br>');
        });
        return html;
    }
}
exports.CustomHTMLParser = CustomHTMLParser;
