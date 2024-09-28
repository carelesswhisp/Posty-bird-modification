"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const electron_1 = require("electron");
const lodash_1 = __importDefault(require("lodash"));
const request_1 = __importDefault(require("request"));
const set_cookie_parser_1 = __importDefault(require("set-cookie-parser"));
const cookie_converter_util_1 = __importDefault(require("../utils/cookie-converter.util"));
require("url");
const FormData = require('form-data');
class Http {
    static parseCookies(cookies) {
        return cookies.map(c => `${c.name}=${c.value}`).join('; ');
    }
    static async getWebsiteCookies(partitionId, url) {
        return await electron_1.session.fromPartition(`persist:${partitionId}`).cookies.get({
            url: new URL(url).origin,
        });
    }
    static async retrieveCookieString(url, ses, cookies) {
        if (cookies) {
            return cookies;
        }
        const sessionCookies = await ses.cookies.get({
            url: new URL(url).origin,
        });
        return Http.parseCookies(sessionCookies);
    }
    static async saveSessionCookies(uri, partitionId) {
        const ses = electron_1.session.fromPartition(`persist:${partitionId}`);
        const url = new URL(uri).origin;
        const cookies = await ses.cookies.get({
            url,
        });
        let expirationDate = new Date();
        expirationDate = new Date(expirationDate.setMonth(expirationDate.getMonth() + 2));
        await Promise.all(cookies
            .filter(c => c.session)
            .map(c => {
            const cookie = Object.assign(Object.assign({}, cookie_converter_util_1.default.convertCookie(c)), { expirationDate: expirationDate.valueOf() / 1000 });
            return ses.cookies.set(cookie);
        }));
        ses.flushStorageData();
    }
    static getCommonOptions(headers, requestOptions) {
        const commonRequestOptions = requestOptions !== null && requestOptions !== void 0 ? requestOptions : {};
        const proxyValue = global.settingsDB.get('proxy').value() || '';
        if (proxyValue.trim()) {
            commonRequestOptions.proxy = (proxyValue || '').trim();
        }
        return Object.assign({
            headers,
            followAllRedirects: true,
            timeout: 480000,
        }, commonRequestOptions);
    }
    static async get(uri, partitionId, options = {}) {
        options = options || {};
        let ses;
        options = options || {};
        if (partitionId) {
            ses = electron_1.session.fromPartition(`persist:${partitionId}`);
        }
        const headers = options.headers || {};
        if (!options.skipCookies && ses) {
            headers.cookie = await Http.retrieveCookieString(uri, ses, headers.cookie);
        }
        const opts = Http.getCommonOptions(headers, options.requestOptions);
        return new Promise(resolve => {
            Http.Request.get(uri, opts, async (error, response, body) => {
                const res = {
                    response,
                    error,
                    body,
                    returnUrl: lodash_1.default.get(response, 'request.uri.href'),
                };
                if (error) {
                    Http.logger.error(error, null, uri);
                }
                if (options.updateCookies && response.headers['set-cookie']) {
                    const cookies = set_cookie_parser_1.default.parse(response);
                    const ses = electron_1.session.fromPartition(`persist:${partitionId}`);
                    let future = new Date();
                    future = new Date(future.setMonth(future.getMonth() + 2));
                    for (const c of cookies) {
                        c.domain = c.domain || response.request.host;
                        const cc = cookie_converter_util_1.default.convertCookie(c);
                        cc.expirationDate = future.valueOf() / 1000;
                        await ses.cookies.set(cc);
                    }
                }
                resolve(res);
            });
        });
    }
    static async patch(uri, partitionId, options) {
        return Http.postLike('patch', uri, partitionId, options);
    }
    static async post(uri, partitionId, options) {
        return Http.postLike('post', uri, partitionId, options);
    }
    static async postLike(type, uri, partitionId, options) {
        let ses;
        options = options || {};
        if (partitionId) {
            ses = electron_1.session.fromPartition(`persist:${partitionId}`);
        }
        const headers = options.headers || {};
        if (!options.skipCookies && ses) {
            headers.cookie = await Http.retrieveCookieString(uri, ses, headers.cookie);
        }
        const opts = Http.getCommonOptions(headers, options.requestOptions);
        if (options.type === 'json') {
            opts.body = options.data;
            opts.json = true;
        }
        else if (options.type === 'multipart') {
            opts.formData = options.data;
        }
        else if (options.type === 'form') {
            opts.form = options.data;
        }
        else if (options.type === 'function') {
        }
        else {
            opts.body = options.data;
        }
        return new Promise(resolve => {
            const request = Http.Request[type](uri, opts, async (error, response, body) => {
                const res = {
                    error,
                    response,
                    body,
                    returnUrl: lodash_1.default.get(response, 'request.uri.href'),
                };
                if (error) {
                    Http.logger.error(error, null, uri);
                }
                if (typeof body === 'string' && body.includes('resolve_captcha')) {
                    if (options.type === 'multipart') {
                        const win = new electron_1.BrowserWindow({
                            show: false,
                            webPreferences: {
                                partition: `persist:${partitionId}`,
                            },
                        });
                        try {
                            const form = new FormData();
                            Object.entries(options.data).forEach(([key, value]) => {
                                if (value.options && value.value) {
                                    form.append(key, value.value, value.options);
                                }
                                else if (Array.isArray(value)) {
                                    form.append(key, JSON.stringify(value));
                                }
                                else {
                                    form.append(key, value);
                                }
                            });
                            const opts = {
                                postData: [
                                    {
                                        type: 'rawData',
                                        bytes: form.getBuffer(),
                                    },
                                ],
                                extraHeaders: [
                                    `Content-Type: ${form.getHeaders()['content-type']}`,
                                    ...Object.entries(options.headers || {}).map(([key, value]) => `${key}: ${value}`),
                                ].join('\n'),
                            };
                            await win.loadURL(uri, opts);
                            const result = await win.webContents.executeJavaScript('document.body.innerText');
                            let data = null;
                            try {
                                data = options.requestOptions.json ? JSON.parse(result) : result;
                            }
                            catch (_a) {
                                data = result;
                            }
                            res.body = data;
                            res.response.statusCode = 200;
                        }
                        catch (err) {
                            Http.logger.warn(err, `Cloudflare Skip: ${uri}`);
                        }
                        finally {
                            win.destroy();
                        }
                    }
                    else if (options.type === 'json') {
                        const win = new electron_1.BrowserWindow({
                            show: false,
                            webPreferences: {
                                partition: `persist:${partitionId}`,
                            },
                        });
                        try {
                            const opts = {
                                postData: [
                                    {
                                        type: 'rawData',
                                        bytes: Buffer.from(JSON.stringify(options.data)),
                                    },
                                ],
                                extraHeaders: [
                                    `Content-Type: application/json`,
                                    ...Object.entries(options.headers || {}).map(([key, value]) => `${key}: ${value}`),
                                ].join('\n'),
                            };
                            await win.loadURL(uri, opts);
                            const result = await win.webContents.executeJavaScript('document.body.innerText');
                            let data = null;
                            try {
                                data = options.requestOptions.json ? JSON.parse(result) : result;
                            }
                            catch (_b) {
                                data = result;
                            }
                            res.body = data;
                            res.response.statusCode = 200;
                        }
                        catch (err) {
                            Http.logger.warn(err, `Cloudflare Skip: ${uri}`);
                        }
                        finally {
                            win.destroy();
                        }
                    }
                }
                resolve(res);
            });
            if (options.type === 'function' && options.data) {
                options.data(request.form());
            }
        });
    }
}
exports.default = Http;
Http.logger = new common_1.Logger(Http.name);
Http.Request = request_1.default.defaults({
    headers: {
        'User-Agent': electron_1.session.defaultSession.getUserAgent(),
    },
});
