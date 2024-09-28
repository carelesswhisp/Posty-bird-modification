"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stop = exports.start = exports.getAuthURL = void 0;
const express_1 = __importDefault(require("express"));
const common_auth_1 = require("./common.auth");
const request_1 = __importDefault(require("request"));
const app = (0, express_1.default)();
let cb;
let server;
let tmp;
function getAuthURL() {
    return `http://localhost:${(0, common_auth_1.getPort)()}/tumblr/auth`;
}
exports.getAuthURL = getAuthURL;
function start(callback) {
    cb = callback;
    if (!server) {
        server = app.listen((0, common_auth_1.getPort)());
    }
}
exports.start = start;
function stop() {
    if (server) {
        server.close();
    }
    cb = null;
    server = null;
}
exports.stop = stop;
app.get('/tumblr/auth', (req, res) => {
    request_1.default.get((0, common_auth_1.getURL)('tumblr/v2/authorize'), { json: true }, (err, response, body) => {
        if (err) {
            res.redirect(`http://localhost:${(0, common_auth_1.getPort)()}/tumblr`);
        }
        else {
            tmp = body.data;
            res.redirect(tmp.url);
        }
    });
});
app.get('/tumblr', (req, res) => {
    request_1.default.post((0, common_auth_1.getURL)('tumblr/v2/authorize'), {
        json: {
            token: req.query.oauth_token,
            secret: tmp.secret,
            verifier: req.query.oauth_verifier,
        },
    }, (err, response, body) => {
        tmp = null;
        if (err || !body.success) {
            res.send((0, common_auth_1.createResponseBody)('Error occurred while trying to authenticate.'));
        }
        else {
            if (cb) {
                cb(body.data);
            }
            res.send((0, common_auth_1.createResponseBody)('Tumblr successfully authenticated!'));
        }
    });
});
