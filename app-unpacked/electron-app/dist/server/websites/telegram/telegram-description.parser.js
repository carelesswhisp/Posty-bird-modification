"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramDescription = void 0;
const cheerio_1 = __importDefault(require("cheerio"));
class TelegramDescription {
    static map(type, tags, parse) {
        parse !== null && parse !== void 0 ? parse : (parse = ({ node, output }) => {
            return {
                _: `messageEntity${type}`,
                offset: output.length,
                length: 0,
            };
        });
        for (const tag of tags) {
            this.mappers[tag] = parse;
        }
        return parse;
    }
    static fromHTML(html) {
        let output = '';
        let entities = [];
        const parseNodes = (doc, parentIndex) => {
            for (const node of doc) {
                if (node.type === 'tag') {
                    if (node.name === 'br') {
                        output += '\n';
                    }
                    else {
                        const parser = this.mappers[node.name];
                        let index = null;
                        if (parser) {
                            index = entities.push(parser({ node, output })) - 1;
                        }
                        if (node.children.length)
                            parseNodes(node.children, index);
                    }
                }
                else if (node.type === 'text') {
                    output += node.data;
                }
            }
            if (parentIndex !== null) {
                entities[parentIndex].length = output.length - entities[parentIndex].offset;
            }
        };
        parseNodes(cheerio_1.default.load('')(html), null);
        return { description: output, entities };
    }
}
exports.TelegramDescription = TelegramDescription;
_a = TelegramDescription;
TelegramDescription.mappers = {};
(() => {
    _a.map('Bold', ['b', 'strong']);
    _a.map('Underline', ['u', 'ins']);
    _a.map('Strike', ['s', 'strike', 'del']);
    _a.map('Italic', ['i', 'em']);
    _a.map('Code', ['code']);
    _a.map('Pre', ['pre']);
    _a.map('TextUrl', ['a'], ({ node, output }) => {
        return {
            _: 'messageEntityTextUrl',
            offset: output.length,
            length: 0,
            url: node.attribs.href,
        };
    });
})();
