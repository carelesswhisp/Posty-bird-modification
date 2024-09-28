"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const html_node_1 = __importDefault(require("./html-node"));
const lodash_1 = __importDefault(require("lodash"));
const html_converter_1 = require("./converters/html.converter");
const bbcode_converter_1 = require("./converters/bbcode.converter");
const markdown_converter_1 = require("./converters/markdown.converter");
const plain_converter_1 = require("./converters/plain.converter");
class HtmlParser {
    static parse(html) {
        if (!html) {
            throw new Error('No html provided to parse.');
        }
        return new html_node_1.default(null, '<root>' +
            html
                .replace(/<\!DOCTYPE html>/gi, '')
                .replace(/[\r\n\t\f\v]/g, '')
                .replace(/<(p|div)>\s<\/(p|div)>/g, '<br />')
                .replace(/(<br\/>|<br>)/, '<br />')
                .replace(/(<hr\/>|<hr>)/, '<hr />')
                .replace(/<!--(.*?)-->/gim, '')
                .replace(/<head>(.*?)<\/head>/gim, '')
                .replace(/<object>(.*?)<\/object>/gim, '')
                .replace(/<script(.*?)>(.*?)<\/script>/gim, '')
                .replace(/<style(.*?)>(.*?)<\/style>/gim, '')
                .replace(/<title>(.*?)<\/title>/gim, '')
                .replace(/<meta>(.*?)<\/meta>/gim, '')
                .trim() +
            '</root>');
    }
    static convert(node, type, options) {
        if (!node) {
            throw new Error('No node provided');
        }
        const copy = new html_node_1.default(null, node);
        options = options || {};
        if (options.allowedStyles) {
            copy.removeUnallowedStyles(options.allowedStyles);
        }
        if (options.convertTag) {
            Object.entries(options.convertTag).forEach(([from, to]) => copy.convertTag(from, to));
        }
        if (options.classCreator) {
            copy.createClasses(options.classCreator);
        }
        if (options.collapseSimilarTags !== false) {
            copy.collapseSimilarTags(options.collapseOnStyleOnly || type === 'bbcode');
        }
        switch (type) {
            case 'html':
                return html_converter_1.HtmlConverter.convert(copy)
                    .replace(/(<root>|<\/root>)/g, '')
                    .trim();
            case 'bbcode':
                return lodash_1.default.unescape(bbcode_converter_1.BBCodeConverter.convert(copy, options.bbcode));
            case 'markdown':
                return markdown_converter_1.MarkdownConverter.convert(copy.fragment);
            case 'plain':
                return lodash_1.default.unescape(plain_converter_1.PlainConverter.convert(node, options.hrefParser));
            case 'custom':
                return options.customParser(node, options);
        }
        return '';
    }
}
exports.default = HtmlParser;
