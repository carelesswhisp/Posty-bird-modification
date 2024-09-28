"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExperimental = void 0;
const common_1 = require("@nestjs/common");
const electron_1 = require("electron");
const querystring_1 = require("querystring");
const form_urlencoded_1 = __importDefault(require("form-urlencoded"));
const form_data_1 = __importDefault(require("form-data"));
const electron_2 = require("electron");
const RESTRICTED_HEADERS = [
    'Content-Length',
    'Host',
    'Trailer',
    'TE',
    'Upgrade',
    'Cookie2',
    'Keep-Alive',
    'Transfer-Encoding',
];
const DEFAULT_HEADERS = {
    'Accept-Encoding': 'gzip, deflate, br',
};
function getPartitionKey(partition) {
    return `persist:${partition}`;
}
class HttpExperimental {
    static createClientRequest(options, crOptions) {
        const clientRequestOptions = Object.assign({}, crOptions);
        if (options.partition && options.partition.trim().length) {
            clientRequestOptions.useSessionCookies = true;
            clientRequestOptions.partition = getPartitionKey(options.partition);
        }
        if (options.queryParameters) {
            const url = new URL(clientRequestOptions.url);
            url.search = new URLSearchParams((0, querystring_1.encode)(options.queryParameters)).toString();
            clientRequestOptions.url = url.toString();
        }
        const req = electron_1.net.request(clientRequestOptions);
        if (clientRequestOptions.method === 'POST' || clientRequestOptions.method === 'PATCH') {
            if (options.type === 'multipart') {
                req.chunkedEncoding = true;
            }
            Object.entries(DEFAULT_HEADERS).forEach(([key, value]) => {
                req.setHeader(key, value);
            });
            if (options.headers) {
                Object.entries(([headerKey, headerValue]) => {
                    if (RESTRICTED_HEADERS.includes(headerKey)) {
                        HttpExperimental.logger.error(`Not allowed to set header: ${headerKey} [https://www.electronjs.org/docs/api/client-request#instance-methods]`);
                        throw new Error(`Not allowed to set header: ${headerKey}`);
                    }
                    req.setHeader(headerKey, headerValue);
                });
            }
        }
        return req;
    }
    static createPostBody(options) {
        const { data, type } = options;
        switch (type) {
            case 'json': {
                return {
                    contentType: 'application/json',
                    buffer: Buffer.from(JSON.stringify(data)),
                };
            }
            case 'urlencoded': {
                return {
                    contentType: 'application/x-www-form-urlencoded',
                    buffer: Buffer.from((0, form_urlencoded_1.default)(data)),
                };
            }
            case 'binary':
                return {
                    contentType: 'binary/octet-stream',
                    buffer: data,
                };
            case 'multipart': {
                const form = new form_data_1.default();
                Object.entries(data).forEach(([key, value]) => {
                    if (value === undefined || value === null) {
                        form.append(key, '');
                        return;
                    }
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
                return {
                    contentType: form.getHeaders()['content-type'],
                    buffer: form.getBuffer(),
                };
            }
            default: {
                throw new Error(`Unknown post type: ${type}`);
            }
        }
    }
    static handleError(req, reject) {
        req.on('error', (err) => {
            HttpExperimental.logger.error(err);
            reject(err);
        });
    }
    static handleResponse(url, req, resolve, reject) {
        let responseUrl;
        req.on('redirect', (statusCode, method, redirectUrl, responseHeaders) => {
            responseUrl = redirectUrl;
        });
        req.on('response', response => {
            const { headers, statusCode, statusMessage } = response;
            const chunks = [];
            response.on('error', (err) => {
                HttpExperimental.logger.error(err);
                reject(err);
            });
            response.on('aborted', () => {
                HttpExperimental.logger.warn(`Request to ${url} aborted`);
                reject(new Error(`Request to ${url} aborted`));
            });
            response.on('end', () => {
                const message = Buffer.concat(chunks);
                let body = message.toString();
                if (headers['content-type'] && headers['content-type'].includes('application/json')) {
                    try {
                        body = JSON.parse(body);
                    }
                    catch (_a) {
                        HttpExperimental.logger.warn(`Unable to parse application/json to object.\nUrl:${url}\nBody: ${body}`);
                    }
                }
                resolve({
                    statusCode,
                    statusMessage,
                    body: body,
                    responseUrl,
                });
            });
            response.on('data', chunk => {
                chunks.push(chunk);
            });
        });
    }
    static get(url, options, crOptions) {
        if (!electron_1.net.isOnline()) {
            return Promise.reject(new Error('No internet connection.'));
        }
        return new Promise((resolve, reject) => {
            const req = HttpExperimental.createClientRequest(options, Object.assign(Object.assign({}, (crOptions !== null && crOptions !== void 0 ? crOptions : {})), { url }));
            HttpExperimental.handleError(req, reject);
            HttpExperimental.handleResponse(url, req, resolve, reject);
            req.end();
        }).then((response) => {
            const { body } = response;
            if (typeof body === 'string' && HttpExperimental.isOnCloudFlareChallengePage(body)) {
                console.log('Cloudflare detected. Attempting to bypass...');
                return HttpExperimental.performBrowserWindowGetRequest(url, options, crOptions);
            }
            return response;
        });
    }
    static async post(url, options, crOptions) {
        return HttpExperimental.postLike('post', url, options, crOptions !== null && crOptions !== void 0 ? crOptions : {});
    }
    static patch(url, options, crOptions) {
        return HttpExperimental.postLike('patch', url, options, crOptions !== null && crOptions !== void 0 ? crOptions : {});
    }
    static postLike(method, url, options, crOptions) {
        if (!electron_1.net.isOnline()) {
            return Promise.reject(new Error('No internet connection.'));
        }
        return new Promise((resolve, reject) => {
            const req = HttpExperimental.createClientRequest(options, Object.assign(Object.assign({}, (crOptions !== null && crOptions !== void 0 ? crOptions : {})), { url,
                method }));
            HttpExperimental.handleError(req, reject);
            HttpExperimental.handleResponse(url, req, resolve, reject);
            const { contentType, buffer } = HttpExperimental.createPostBody(options);
            req.setHeader('Content-Type', contentType);
            req.write(buffer);
            req.end();
        }).then((response) => {
            const { body } = response;
            if (typeof body === 'string' && HttpExperimental.isOnCloudFlareChallengePage(body)) {
                console.log('Cloudflare detected. Attempting to bypass...');
                return HttpExperimental.performBrowserWindowPostRequest(url, options, crOptions);
            }
            return response;
        });
    }
    static async performBrowserWindowGetRequest(url, options, crOptions) {
        const window = new electron_2.BrowserWindow({
            show: false,
            webPreferences: {
                partition: getPartitionKey(options.partition),
            },
        });
        try {
            await window.loadURL(url);
            return HttpExperimental.handleCloudFlareChallengePage(window);
        }
        catch (err) {
            console.error(err);
            return Promise.reject(err);
        }
        finally {
            window.destroy();
        }
    }
    static async performBrowserWindowPostRequest(url, options, crOptions) {
        var _a;
        const { contentType, buffer } = HttpExperimental.createPostBody(options);
        const headers = Object.entries(Object.assign(Object.assign({}, ((_a = options.headers) !== null && _a !== void 0 ? _a : {})), { 'Content-Type': contentType }))
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        const window = new electron_2.BrowserWindow({
            show: false,
            webPreferences: {
                partition: getPartitionKey(options.partition),
            },
        });
        try {
            await window.loadURL(url, {
                extraHeaders: headers,
                postData: [
                    {
                        type: 'rawData',
                        bytes: buffer,
                    },
                ],
            });
            return HttpExperimental.handleCloudFlareChallengePage(window);
        }
        catch (err) {
            console.error(err);
            return Promise.reject(err);
        }
        finally {
            window.destroy();
        }
    }
    static isOnCloudFlareChallengePage(html) {
        if (html.includes('challenge-error-title') ||
            html.includes('<title>Just a moment...</title>')) {
            return true;
        }
        return false;
    }
    static async awaitCloudFlareChallengePage(window) {
        const checkInterval = 1000;
        let isShown = false;
        for (let i = 0; i < 60; i++) {
            await HttpExperimental.awaitCheckInterval(checkInterval);
            const html = await window.webContents.executeJavaScript('document.body.parentElement.innerHTML');
            if (i >= 3 && !isShown) {
                window.show();
                window.focus();
                isShown = true;
            }
            if (!HttpExperimental.isOnCloudFlareChallengePage(html)) {
                return;
            }
        }
        throw new Error('Unable to bypass Cloudflare challenge.');
    }
    static async awaitCheckInterval(interval) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, interval);
        });
    }
    static async handleCloudFlareChallengePage(window) {
        let html = await window.webContents.executeJavaScript('document.body.parentElement.innerHTML');
        if (HttpExperimental.isOnCloudFlareChallengePage(html)) {
            await HttpExperimental.awaitCloudFlareChallengePage(window);
            html = await window.webContents.executeJavaScript('document.body.parentElement.innerHTML');
        }
        const text = await window.webContents.executeJavaScript('document.body.innerText');
        const pageUrl = await window.webContents.executeJavaScript('window.location.href');
        let rValue = html;
        if (text.startsWith('{') && text.endsWith('}')) {
            try {
                rValue = JSON.parse(text);
            }
            catch (err) {
                console.error(pageUrl, text, err);
            }
        }
        return Promise.resolve({
            body: rValue,
            statusCode: 200,
            statusMessage: 'OK',
            responseUrl: pageUrl,
        });
    }
}
exports.HttpExperimental = HttpExperimental;
HttpExperimental.logger = new common_1.Logger(HttpExperimental.name);
