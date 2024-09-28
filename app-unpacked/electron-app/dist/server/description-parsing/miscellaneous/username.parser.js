"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsernameParser = void 0;
class UsernameParser {
    static parse(html, code, replacement) {
        if (!html) {
            return '';
        }
        const regex = new RegExp(`{${code}:(.+?)}`, 'gi');
        html = html.replace(regex, (match, first) => {
            if (!first) {
                return match;
            }
            const trimmedMatch = first.replace(/<(?:[^>'"]*|(['"]).*?\1)*>/gi, '').trim();
            if (!trimmedMatch.length) {
                return match;
            }
            return `<a href="${replacement.replace('$1', trimmedMatch)}">${trimmedMatch}</a>`;
        });
        return html;
    }
    static replaceText(html, code, replacement, parseFn) {
        if (!html) {
            return '';
        }
        const regex = new RegExp(`{${code}:(.+?)}`, 'gi');
        html = html.replace(regex, (match, first) => {
            if (!first) {
                return match;
            }
            let trimmedMatch = first.replace(/<(?:[^>'"]*|(['"]).*?\1)*>/gi, '').trim();
            if (!trimmedMatch.length) {
                return match;
            }
            if (parseFn) {
                trimmedMatch = parseFn(trimmedMatch);
            }
            return replacement.replace(/\$1/g, trimmedMatch);
        });
        return html;
    }
}
exports.UsernameParser = UsernameParser;
