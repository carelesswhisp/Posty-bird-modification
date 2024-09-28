"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlConverter = void 0;
const tag_type_enum_1 = require("../tag-type.enum");
class HtmlConverter {
    static getStyleString(styles) {
        return `${Object.entries(styles)
            .map(([style, value]) => `${style}:${value}`)
            .join('; ')}`;
    }
    static convert(node) {
        const depth = '  '.repeat(Math.max(0, node.level - 1));
        const styleString = HtmlConverter.getStyleString(node.styles);
        switch (node.type) {
            case tag_type_enum_1.TagType.TEXT:
                return `${depth}${node.breakBefore ? `<br />\n${depth}` : ''}${node.text.replace(/\n/g, `\n${depth}<br />\n${depth}`)}`;
            case tag_type_enum_1.TagType.SELF_CLOSED:
                let val = `${depth}<${node.tagName}`;
                if (node.classes.length) {
                    val += ` class="${node.classes.join(' ')}"`;
                }
                if (styleString) {
                    val += ` style="${styleString}"`;
                }
                return `${val} />`;
            case tag_type_enum_1.TagType.STANDARD:
                let standardVal = `${depth}<${node.tagName}`;
                if (node.classes.length) {
                    standardVal += ` class="${node.classes.join(' ')}"`;
                }
                if (styleString) {
                    standardVal += ` style="${styleString}"`;
                }
                if (node.href) {
                    standardVal += ` href="${node.href}" target="_blank"`;
                }
                return `${node.breakBefore ? `${depth}<br />\n` : ''}${standardVal}>\n${node.children
                    .map(child => HtmlConverter.convert(child).trimEnd())
                    .join('\n')}\n${depth}</${node.tagName}>`;
        }
    }
}
exports.HtmlConverter = HtmlConverter;
