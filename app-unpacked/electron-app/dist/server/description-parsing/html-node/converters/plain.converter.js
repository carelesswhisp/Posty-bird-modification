"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlainConverter = void 0;
const tag_type_enum_1 = require("../tag-type.enum");
const special_tag_enum_1 = require("../special-tag.enum");
class PlainConverter {
    static defaultHrefParser(text, href) {
        return text === href ? href : `${text} ( ${href} )`;
    }
    static convert(node, hrefParser) {
        switch (node.type) {
            case tag_type_enum_1.TagType.TEXT:
                return node.text;
            case tag_type_enum_1.TagType.SELF_CLOSED:
                if (node.tagName === special_tag_enum_1.SpecialTag.HR) {
                    return '\n------\n';
                }
                return '';
            case tag_type_enum_1.TagType.STANDARD:
                const hrefFn = hrefParser || PlainConverter.defaultHrefParser;
                if (node.tagName === special_tag_enum_1.SpecialTag.A) {
                    return hrefFn(node.children
                        .map(child => PlainConverter.convert(child, hrefParser))
                        .join('\n')
                        .trim(), node.href);
                }
                return node.children
                    .map(child => ({
                    child,
                    text: PlainConverter.convert(child, hrefParser),
                }))
                    .map(({ child, text }) => {
                    if (child.isBlock) {
                        return `${text}\n`;
                    }
                    return text;
                })
                    .join('');
        }
    }
}
exports.PlainConverter = PlainConverter;
