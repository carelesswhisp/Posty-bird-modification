"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissKey = void 0;
const common_1 = require("@nestjs/common");
const megalodon_1 = __importDefault(require("megalodon"));
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const plaintext_parser_1 = require("../../description-parsing/plaintext/plaintext.parser");
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const post_data_interface_1 = require("../../submission/post/interfaces/post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const form_content_util_1 = __importDefault(require("../../utils/form-content.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const website_base_1 = require("../website.base");
const lodash_1 = __importDefault(require("lodash"));
const file_manager_service_1 = require("../../file-manager/file-manager.service");
const INFO_KEY = 'INSTANCE INFO';
let MissKey = class MissKey extends website_base_1.Website {
    constructor(fileRepository) {
        super();
        this.fileRepository = fileRepository;
        this.enableAdvertisement = false;
        this.acceptsAdditionalFiles = true;
        this.MAX_CHARS = -1;
        this.defaultDescriptionParser = plaintext_parser_1.PlaintextParser.parse;
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
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const accountData = data.data;
        if (accountData && accountData.tokenData) {
            await this.getAndStoreInstanceInfo(data._id, accountData);
            status.loggedIn = true;
            status.username = accountData.username;
        }
        return status;
    }
    async getAndStoreInstanceInfo(profileId, data) {
        const client = (0, megalodon_1.default)('misskey', `https://${data.website}`, data.tokenData.access_token);
        const instance = await client.getInstance();
        this.storeAccountInformation(profileId, INFO_KEY, instance.data);
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
    async postFileSubmission(cancellationToken, data, accountData) {
        var _a, _b, _c, _d, _e, _f;
        const M = (0, megalodon_1.default)('misskey', `https://${accountData.website}`, accountData.tokenData.access_token);
        const files = [data.primary, ...data.additional];
        const uploadedMedias = [];
        for (const file of files) {
            this.checkCancelled(cancellationToken);
            const upload = await M.uploadMedia(file.file.value, {
                description: file.altText || data.options.altText,
            });
            if (upload.status > 300) {
                return Promise.reject(this.createPostResponse({ additionalInfo: upload.status, message: upload.statusText }));
            }
            uploadedMedias.push(upload.data.id);
        }
        const instanceInfo = this.getAccountInfo(data.part.accountId, INFO_KEY);
        const chunkCount = (_c = (_b = (_a = instanceInfo === null || instanceInfo === void 0 ? void 0 : instanceInfo.configuration) === null || _a === void 0 ? void 0 : _a.statuses) === null || _b === void 0 ? void 0 : _b.max_media_attachments) !== null && _c !== void 0 ? _c : 4;
        const maxChars = (_f = (_e = (_d = instanceInfo === null || instanceInfo === void 0 ? void 0 : instanceInfo.configuration) === null || _d === void 0 ? void 0 : _d.statuses) === null || _e === void 0 ? void 0 : _e.max_characters) !== null && _f !== void 0 ? _f : 500;
        const isSensitive = data.rating !== postybirb_commons_1.SubmissionRating.GENERAL;
        const chunks = lodash_1.default.chunk(uploadedMedias, chunkCount);
        let status = `${data.options.useTitle && data.title ? `${data.title}\n` : ''}${data.description}`.substring(0, maxChars);
        let lastId = '';
        let source = '';
        for (let i = 0; i < chunks.length; i++) {
            const statusOptions = {
                sensitive: isSensitive,
                visibility: data.options.visibility || 'public',
                media_ids: chunks[i],
            };
            if (i !== 0) {
                statusOptions.in_reply_to_id = lastId;
            }
            if (data.spoilerText) {
                statusOptions.spoiler_text = data.spoilerText;
            }
            this.checkCancelled(cancellationToken);
            try {
                const result = (await M.postStatus(status, statusOptions));
                lastId = result.data.id;
                if (!source)
                    source = (await M.getStatus(result.data.id)).data.url;
            }
            catch (error) {
                return Promise.reject(this.createPostResponse({ message: error.message }));
            }
        }
        this.checkCancelled(cancellationToken);
        return this.createPostResponse({ source });
    }
    async postNotificationSubmission(cancellationToken, data, accountData) {
        var _a, _b, _c;
        const M = (0, megalodon_1.default)('misskey', `https://${accountData.website}`, accountData.tokenData.access_token);
        const instanceInfo = this.getAccountInfo(data.part.accountId, INFO_KEY);
        const maxChars = (_c = (_b = (_a = instanceInfo === null || instanceInfo === void 0 ? void 0 : instanceInfo.configuration) === null || _a === void 0 ? void 0 : _a.statuses) === null || _b === void 0 ? void 0 : _b.max_characters) !== null && _c !== void 0 ? _c : 500;
        const isSensitive = data.rating !== postybirb_commons_1.SubmissionRating.GENERAL;
        const statusOptions = {
            sensitive: isSensitive,
            visibility: data.options.visibility || 'public',
        };
        let status = `${data.options.useTitle && data.title ? `${data.title}\n` : ''}${data.description}`.substring(0, maxChars);
        if (data.spoilerText) {
            statusOptions.spoiler_text = data.spoilerText;
        }
        this.checkCancelled(cancellationToken);
        try {
            const result = (await M.postStatus(status, statusOptions)).data;
            const source = (await M.getStatus(result.id)).data.url;
            return this.createPostResponse({ source });
        }
        catch (error) {
            return Promise.reject(this.createPostResponse({ message: error.message }));
        }
    }
    formatTags(tags) {
        return this.parseTags(tags
            .map(tag => tag.replace(/[^a-z0-9]/gi, ' '))
            .map(tag => tag
            .split(' ')
            .join('')), { spaceReplacer: '_' }).map(tag => `#${tag}`);
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        var _a, _b, _c, _d, _e;
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        const description = this.defaultDescriptionParser(form_content_util_1.default.getDescription(defaultPart.data.description, submissionPart.data.description));
        const instanceInfo = this.getAccountInfo(submissionPart.accountId, INFO_KEY);
        const maxChars = (_c = (_b = (_a = instanceInfo === null || instanceInfo === void 0 ? void 0 : instanceInfo.configuration) === null || _a === void 0 ? void 0 : _a.statuses) === null || _b === void 0 ? void 0 : _b.max_characters) !== null && _c !== void 0 ? _c : 500;
        if (description.length > maxChars) {
            warnings.push(`Max description length allowed is ${maxChars} characters (for this MissKey client).`);
        }
        else {
            this.validateInsertTags(warnings, this.formatTags(form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags)), description, maxChars);
        }
        const files = [
            submission.primary,
            ...(submission.additional || []).filter(f => !f.ignoredAccounts.includes(submissionPart.accountId)),
        ];
        const maxImageSize = instanceInfo
            ? (_e = (_d = instanceInfo === null || instanceInfo === void 0 ? void 0 : instanceInfo.configuration) === null || _d === void 0 ? void 0 : _d.media_attachments) === null || _e === void 0 ? void 0 : _e.image_size_limit
            : filesize_util_1.default.MBtoBytes(50);
        files.forEach(file => {
            const { type, size, name, mimetype } = file;
            if (!website_validator_util_1.default.supportsFileType(file, this.acceptsFiles)) {
                problems.push(`Does not support file format: (${name}) ${mimetype}.`);
            }
            if (maxImageSize < size) {
                if (isAutoscaling &&
                    type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                    image_manipulator_1.default.isMimeType(mimetype)) {
                    warnings.push(`${name} will be scaled down to ${filesize_util_1.default.BytesToMB(maxImageSize)}MB`);
                }
                else {
                    problems.push(`MissKey limits ${mimetype} to ${filesize_util_1.default.BytesToMB(maxImageSize)}MB`);
                }
            }
            if (isAutoscaling &&
                type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                (file.height > 4000 || file.width > 4000)) {
                warnings.push(`${name} will be scaled down to a maximum size of 4000x4000, while maintaining aspect ratio`);
            }
        });
        if ((submissionPart.data.tags.value.length > 1 || defaultPart.data.tags.value.length > 1) &&
            submissionPart.data.visibility != 'public') {
            warnings.push(`This post won't be listed under any hashtag as it is not public. Only public posts can be searched by hashtag.`);
        }
        return { problems, warnings };
    }
    validateNotificationSubmission(submission, submissionPart, defaultPart) {
        var _a, _b, _c;
        const warnings = [];
        const description = this.defaultDescriptionParser(form_content_util_1.default.getDescription(defaultPart.data.description, submissionPart.data.description));
        const instanceInfo = this.getAccountInfo(submissionPart.accountId, INFO_KEY);
        const maxChars = (_c = (_b = (_a = instanceInfo === null || instanceInfo === void 0 ? void 0 : instanceInfo.configuration) === null || _a === void 0 ? void 0 : _a.statuses) === null || _b === void 0 ? void 0 : _b.max_characters) !== null && _c !== void 0 ? _c : 500;
        if (description.length > maxChars) {
            warnings.push(`Max description length allowed is ${maxChars} characters (for this MissKey client).`);
        }
        else {
            this.validateInsertTags(warnings, this.formatTags(form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags)), description, maxChars);
        }
        return { problems: [], warnings };
    }
};
MissKey = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [file_manager_service_1.FileManagerService])
], MissKey);
exports.MissKey = MissKey;
