"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mastodon = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const megalodon_service_1 = require("../megalodon/megalodon.service");
const INFO_KEY = 'INSTANCE INFO';
let Mastodon = class Mastodon extends megalodon_service_1.Megalodon {
    constructor() {
        super(...arguments);
        this.megalodonService = 'mastodon';
        this.acceptsFiles = [
            'png',
            'jpeg',
            'jpg',
            'gif',
            'webp',
            'avif',
            'heic',
            'heif',
            'mp4',
            'webm',
            'm4v',
            'mov',
            'doc',
            'rtf',
            'txt',
            'mp3',
            'wav',
            'ogg',
            'oga',
            'opus',
            'aac',
            'm4a',
            '3gp',
            'wma',
        ];
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
        if ((_a = instanceInfo === null || instanceInfo === void 0 ? void 0 : instanceInfo.configuration) === null || _a === void 0 ? void 0 : _a.media_attachments) {
            const maxPixels = file.type === postybirb_commons_1.FileSubmissionType.IMAGE
                ? instanceInfo.configuration.media_attachments.image_matrix_limit
                : instanceInfo.configuration.media_attachments.video_matrix_limit;
            return {
                maxHeight: Math.round(Math.sqrt(maxPixels * (file.width / file.height))),
                maxWidth: Math.round(Math.sqrt(maxPixels * (file.height / file.width))),
                maxSize: file.type === postybirb_commons_1.FileSubmissionType.IMAGE
                    ? instanceInfo.configuration.media_attachments.image_size_limit
                    : instanceInfo.configuration.media_attachments.video_size_limit,
            };
        }
        else {
            return undefined;
        }
    }
    getPostIdFromUrl(url) {
        const match = /\/@[^\/]+\/([0-9]+)/.exec(url);
        return match ? match[1] : null;
    }
};
Mastodon = __decorate([
    (0, common_1.Injectable)()
], Mastodon);
exports.Mastodon = Mastodon;
