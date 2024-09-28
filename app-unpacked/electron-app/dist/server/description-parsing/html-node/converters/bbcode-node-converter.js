"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BBCodeNodeConverter = void 0;
class BBCodeNodeConverter {
    constructor(node, options) {
        this.node = node;
        this.options = options;
        this.endTag = '';
        this.startTag = '';
        this.convert();
    }
    convert() {
        let isBlock = this.node.isBlock;
        let isAligned = false;
        if (this.node.styles['text-align']) {
            isBlock = true;
            isAligned = true;
        }
        if (isBlock) {
            if (isAligned) {
                this.startTag = `[${this.node.styles['text-align']}]`;
                this.endTag = `[/${this.node.styles['text-align']}]`;
            }
            else {
                if (this.options && this.options.replaceBlockWith) {
                    this.startTag = `[${this.options.replaceBlockWith}]`;
                    this.endTag = `[/${this.options.replaceBlockWith}]`;
                }
            }
        }
        if (this.node.href) {
            this.startTag += `[url=${this.node.href}]`;
            this.endTag = `[/url]${this.endTag}`;
        }
        if (this.node.styles.color) {
            this.startTag += `[color=${this.node.styles.color}]`;
            this.endTag = `[/color]${this.endTag}`;
        }
        switch (this.node.tagName) {
            case 'em':
            case 'i':
                this.startTag += '[i]';
                this.endTag = `[/i]${this.endTag}`;
                break;
            case 'strong':
            case 'b':
                this.startTag += '[b]';
                this.endTag = `[/b]${this.endTag}`;
                break;
            case 's':
                this.startTag += '[s]';
                this.endTag = `[/s]${this.endTag}`;
                break;
            case 'u':
                this.startTag += '[u]';
                this.endTag = `[/u]${this.endTag}`;
                break;
        }
    }
}
exports.BBCodeNodeConverter = BBCodeNodeConverter;
