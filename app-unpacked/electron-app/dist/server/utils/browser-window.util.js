"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const wait_util_1 = __importDefault(require("./wait.util"));
class BrowserWindowUtil {
    static async createWindow(partition, url) {
        const bw = new electron_1.BrowserWindow({
            show: false,
            webPreferences: {
                partition: `persist:${partition}`,
            },
        });
        try {
            await bw.loadURL(url);
        }
        catch (err) {
            bw.destroy();
            throw err;
        }
        return bw;
    }
    static async getLocalStorage(partition, url, wait) {
        const bw = await BrowserWindowUtil.createWindow(partition, url);
        try {
            if (wait) {
                await wait_util_1.default.wait(wait);
            }
            return await bw.webContents.executeJavaScript('JSON.parse(JSON.stringify(localStorage))');
        }
        catch (err) {
            bw.destroy();
            throw err;
        }
        finally {
            if (!bw.isDestroyed()) {
                bw.destroy();
            }
        }
    }
    static async getFormData(partition, url, selector) {
        const bw = await BrowserWindowUtil.createWindow(partition, url);
        try {
            return await bw.webContents.executeJavaScript(`JSON.parse(JSON.stringify(Array.from(new FormData(${selector.id ? `document.getElementById('${selector.id}')` : selector.custom})).reduce((obj, [k, v]) => ({...obj, [k]: v}), {})))`);
        }
        catch (err) {
            bw.destroy();
            throw err;
        }
        finally {
            if (!bw.isDestroyed()) {
                bw.destroy();
            }
        }
    }
    static async getPage(partition, url, html, wait = 0) {
        return BrowserWindowUtil.runScriptOnPage(partition, url, html ? 'return document.body.parentElement.innerHTML' : 'return document.body.innerText', wait);
    }
    static async runScriptOnPage(partition, url, script, wait = 0) {
        const bw = await BrowserWindowUtil.createWindow(partition, url);
        try {
            if (wait) {
                await wait_util_1.default.wait(wait);
            }
            const page = await bw.webContents.executeJavaScript(`
      (function() {
        try {
          ${script}
        } catch (e) {
          return Promise.reject(e);
        }
      })()`);
            return page;
        }
        catch (err) {
            if (typeof err === 'object' && err && typeof err.message === 'string') {
                err.message =
                    'Failed to run script on page: ' + err.message + '\n\nscript:\n' + script + '\n';
            }
            bw.destroy();
            throw err;
        }
        finally {
            if (!bw.isDestroyed()) {
                bw.destroy();
            }
        }
    }
    static async post(partition, url, headers, data) {
        const bw = await BrowserWindowUtil.createWindow(partition, url);
        try {
            await bw.loadURL(url, {
                extraHeaders: Object.entries(headers)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n'),
                postData: [
                    {
                        type: 'rawData',
                        bytes: Buffer.from(JSON.stringify(data)),
                    },
                ],
            });
            return await bw.webContents.executeJavaScript('document.body.innerText');
        }
        catch (err) {
            bw.destroy();
            throw err;
        }
        finally {
            if (!bw.isDestroyed()) {
                bw.destroy();
            }
        }
    }
}
exports.default = BrowserWindowUtil;
