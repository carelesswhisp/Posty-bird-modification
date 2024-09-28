"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
class HtmlParserUtil {
    static getInputValue(html, name, index = 0) {
        index = index || 0;
        const inputs = (html.match(/<input.*?(\/)*>/gim) || [])
            .filter(input => input.includes(`name="${name}"`))
            .map(input => {
            return input.match(/value="(.*?)"/)[1];
        });
        const picked = inputs[index];
        if (!picked) {
            throw new common_1.NotFoundException(`Could not find form key: ${name}[${index}]`);
        }
        return picked;
    }
}
exports.default = HtmlParserUtil;
