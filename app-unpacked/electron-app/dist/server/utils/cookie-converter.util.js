"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CookieConverter {
    static convertCookie(cookie) {
        const url = `${cookie.secure ? 'https' : 'http'}://${cookie.domain}${cookie.path || ''}`;
        const details = {
            domain: `.${cookie.domain}`.replace('..', '.'),
            httpOnly: cookie.httpOnly || false,
            name: cookie.name,
            secure: cookie.secure || false,
            url: url.replace('://.', '://'),
            value: cookie.value,
        };
        if (cookie.expirationDate) {
            details.expirationDate = cookie.expirationDate;
        }
        return details;
    }
}
exports.default = CookieConverter;
