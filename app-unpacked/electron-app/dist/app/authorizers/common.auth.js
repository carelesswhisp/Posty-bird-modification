"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResponseBody = exports.getPort = exports.getURL = void 0;
const remote_1 = require("@electron/remote");
const PORT = Number((0, remote_1.getCurrentWindow)().PORT) + 1;
const URL = (0, remote_1.getCurrentWindow)().AUTH_SERVER_URL;
function getURL(path) {
    return `${URL}/${path}?port=${PORT}`;
}
exports.getURL = getURL;
function getPort() {
    return PORT;
}
exports.getPort = getPort;
function createResponseBody(text) {
    return `<div style="
  font-size: 24px;
  color: #1890ff;
  text-align: center;
  margin-top: 5em;
">${text}</div>`;
}
exports.createResponseBody = createResponseBody;
