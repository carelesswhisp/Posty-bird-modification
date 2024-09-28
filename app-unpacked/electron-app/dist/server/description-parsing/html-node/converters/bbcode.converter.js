"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBCodeConverter = void 0;
const tag_type_enum_1 = require("../tag-type.enum");
const special_tag_enum_1 = require("../special-tag.enum");
const bbcode_node_converter_1 = require("./bbcode-node-converter");
class BBCodeConverter {
    static convert(node, options) {
        switch (node.type) {
            case tag_type_enum_1.TagType.TEXT:
                return node.text;
            case tag_type_enum_1.TagType.SELF_CLOSED:
                if (node.tagName === special_tag_enum_1.SpecialTag.HR) {
                    return options && options.altHR ? '\n------\n' : '[hr]';
                }
                return '';
            case tag_type_enum_1.TagType.STANDARD:
                const bbcodeNode = new bbcode_node_converter_1.BBCodeNodeConverter(node, options);
                return `${bbcodeNode.startTag}${node.children
                    .map(child => ({
                    child,
                    text: BBCodeConverter.convert(child, options),
                }))
                    .map(({ child, text }) => {
                    if (child.isBlock) {
                        return `${text}\n`;
                    }
                    return `${child.breakBefore ? `\n` : ''}${text}`;
                })
                    .join('')}${bbcodeNode.endTag}`;
        }
    }
}
exports.BBCodeConverter = BBCodeConverter;
