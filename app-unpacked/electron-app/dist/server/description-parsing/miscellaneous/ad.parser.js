"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdInsertParser = void 0;
const plaintext_parser_1 = require("../plaintext/plaintext.parser");
const bbcode_parser_1 = require("../bbcode/bbcode.parser");
const markdown_parser_1 = require("../markdown/markdown.parser");
class AdInsertParser {
    static parse(html, parser) {
        const appendNewLines = html.trim().length > 0;
        if (parser === plaintext_parser_1.PlaintextParser.parse) {
            html += `${appendNewLines ? '\n\n' : ''}Posted using PostyBirb`;
        }
        else if (parser === bbcode_parser_1.BBCodeParser.parse) {
            html += `${appendNewLines ? '\n\n' : ''}[url=http://www.postybirb.com]Posted using PostyBirb[/url]`;
        }
        else if (parser === markdown_parser_1.MarkdownParser.parse) {
            html += markdown_parser_1.MarkdownParser.parse(`${appendNewLines ? '<br /><br />' : ''}<p><a href="http://www.postybirb.com">Posted using PostyBirb</a></p>`);
        }
        else {
            html += `${appendNewLines ? '<br /><br />' : ''}<p><a href="http://www.postybirb.com">Posted using PostyBirb</a></p>`;
        }
        return html;
    }
}
exports.AdInsertParser = AdInsertParser;
