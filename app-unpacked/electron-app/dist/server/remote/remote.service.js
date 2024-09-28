"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RemoteService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteService = void 0;
const common_1 = require("@nestjs/common");
const electron_1 = require("electron");
const cookie_converter_util_1 = __importDefault(require("../utils/cookie-converter.util"));
let RemoteService = RemoteService_1 = class RemoteService {
    constructor() {
        this.logger = new common_1.Logger(RemoteService_1.name);
    }
    async updateCookies(accountId, cookies) {
        this.logger.log(accountId, 'Updating Cookies');
        const accountSession = electron_1.session.fromPartition(`persist:${accountId}`);
        await accountSession.clearStorageData();
        await Promise.all(cookies.map(cookie => {
            return accountSession.cookies.set(cookie_converter_util_1.default.convertCookie(cookie));
        }));
    }
};
RemoteService = RemoteService_1 = __decorate([
    (0, common_1.Injectable)()
], RemoteService);
exports.RemoteService = RemoteService;
