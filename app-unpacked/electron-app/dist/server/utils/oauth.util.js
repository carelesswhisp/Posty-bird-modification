"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAuthUtil = void 0;
class OAuthUtil {
    static getURL(path) {
        return `${global.AUTH_SERVER_URL}/${path}`;
    }
}
exports.OAuthUtil = OAuthUtil;
