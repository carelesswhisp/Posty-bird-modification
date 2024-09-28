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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pleroma = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const megalodon_service_1 = require("../megalodon/megalodon.service");
const INFO_KEY = 'INSTANCE INFO';
let Pleroma = class Pleroma extends megalodon_service_1.Megalodon {
    constructor() {
        super(...arguments);
        this.acceptsAdditionalFiles = true;
        this.megalodonService = 'pleroma';
        this.acceptsFiles = [
            'png',
            'jpeg',
            'jpg',
            'gif',
            'swf',
            'flv',
            'mp4',
            'doc',
            'rtf',
            'txt',
            'mp3',
        ];
    }
    getInstanceSettings(accountId) {
        var _a, _b;
        const instanceInfo = this.getAccountInfo(accountId, INFO_KEY);
        let result = new postybirb_commons_1.MegalodonInstanceSettings();
        result.maxChars = (_a = instanceInfo === null || instanceInfo === void 0 ? void 0 : instanceInfo.max_toot_chars) !== null && _a !== void 0 ? _a : 500;
        result.maxImages = (_b = instanceInfo === null || instanceInfo === void 0 ? void 0 : instanceInfo.max_media_attachments) !== null && _b !== void 0 ? _b : 20;
        return result;
    }
    getScalingOptions(file, accountId) {
        var _a;
        const instanceInfo = this.getAccountInfo(accountId, INFO_KEY);
        return ((_a = instanceInfo === null || instanceInfo === void 0 ? void 0 : instanceInfo.configuration) === null || _a === void 0 ? void 0 : _a.media_attachments)
            ? {
                maxSize: instanceInfo.upload_limit,
            }
            : {
                maxSize: filesize_util_1.default.MBtoBytes(16)
            };
    }
    getPostIdFromUrl(url) {
        if (url) {
            const match = url.slice(url.lastIndexOf('/') + 1);
            return match ? match[1] : null;
        }
        else {
            return null;
        }
    }
};
Pleroma = __decorate([
    (0, common_1.Injectable)()
], Pleroma);
exports.Pleroma = Pleroma;
