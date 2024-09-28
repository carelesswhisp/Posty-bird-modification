"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const remote_1 = require("@electron/remote");
const Tumblr = require('./authorizers/tumblr.auth');
const _setImmediate = setImmediate;
const _clearImmediate = clearImmediate;
const _Buffer = Buffer;
process.once('loaded', () => {
    global.setImmediate = _setImmediate;
    global.clearImmediate = _clearImmediate;
    global.Buffer = _Buffer;
});
window.PORT = (0, remote_1.getCurrentWindow)().PORT;
window.AUTH_ID = (0, remote_1.getCurrentWindow)().AUTH_ID;
window.IS_DARK_THEME = (0, remote_1.getCurrentWindow)().IS_DARK_THEME;
window.AUTH_SERVER_URL = (0, remote_1.getCurrentWindow)().AUTH_SERVER_URL;
window.appVersion = remote_1.app.getVersion();
window.electron = {
    clipboard: {
        availableFormats: remote_1.clipboard.availableFormats,
        read() {
            const ni = remote_1.clipboard.readImage();
            const arr = new Uint8Array(ni.toPNG());
            const blob = new Blob([arr], { type: 'image/png' });
            return new File([blob], 'Clipboard Image.png', {
                lastModified: Date.now(),
                type: 'image/png',
            });
        },
    },
    dialog: {
        showOpenDialog(options) {
            return remote_1.dialog.showOpenDialog((0, remote_1.getCurrentWindow)(), options || {});
        },
    },
    session: {
        getCookies(accountId) {
            return remote_1.session.fromPartition(`persist:${accountId}`).cookies.get({});
        },
        clearSessionData(id) {
            return remote_1.session.fromPartition(`persist:${id}`).clearStorageData();
        },
    },
    shell: {
        openInBrowser(url) {
            return remote_1.shell.openExternal(url);
        },
    },
    kill: () => remote_1.app.quit(),
    auth: {
        Tumblr,
    },
};
