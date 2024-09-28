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
exports.Pixelfed = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const megalodon_service_1 = require("../megalodon/megalodon.service");
const INFO_KEY = 'INSTANCE INFO';
let Pixelfed = class Pixelfed extends megalodon_service_1.Megalodon {
    constructor() {
        super(...arguments);
        this.enableAdvertisement = false;
        this.acceptsFiles = ['png', 'jpeg', 'jpg', 'gif', 'swf', 'flv', 'mp4'];
        this.megalodonService = 'mastodon';
    }
    getInstanceSettings(accountId) {
        var _a, _b, _c, _d, _e;
        const instanceInfo = this.getAccountInfo(accountId, INFO_KEY);
        let result = new postybirb_commons_1.MegalodonInstanceSettings();
        result.maxChars = (_c = (_b = (_a = instanceInfo === null || instanceInfo === void 0 ? void 0 : instanceInfo.configuration) === null || _a === void 0 ? void 0 : _a.statuses) === null || _b === void 0 ? void 0 : _b.max_characters) !== null && _c !== void 0 ? _c : 500;
        result.maxImages = instanceInfo ? (_e = (_d = instanceInfo === null || instanceInfo === void 0 ? void 0 : instanceInfo.configuration) === null || _d === void 0 ? void 0 : _d.statuses) === null || _e === void 0 ? void 0 : _e.max_media_attachments : 4;
        return result;
    }
    getScalingOptions(file, accountId) {
        var _a;
        const instanceInfo = this.getAccountInfo(accountId, INFO_KEY);
        return ((_a = instanceInfo === null || instanceInfo === void 0 ? void 0 : instanceInfo.configuration) === null || _a === void 0 ? void 0 : _a.media_attachments)
            ? {
                maxHeight: 4000,
                maxWidth: 4000,
                maxSize: file.type === postybirb_commons_1.FileSubmissionType.IMAGE
                    ? instanceInfo.configuration.media_attachments.image_size_limit
                    : instanceInfo.configuration.media_attachments.video_size_limit,
            }
            : {
                maxHeight: 4000,
                maxWidth: 4000,
                maxSize: filesize_util_1.default.MBtoBytes(300),
            };
    }
    getPostIdFromUrl(url) {
        if (url && url.lastIndexOf('/') > -1) {
            return url.slice(url.lastIndexOf('/') + 1);
        }
        else {
            return null;
        }
    }
};
Pixelfed = __decorate([
    (0, common_1.Injectable)()
], Pixelfed);
exports.Pixelfed = Pixelfed;
