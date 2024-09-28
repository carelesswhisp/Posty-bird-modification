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
exports.Custom = void 0;
const common_1 = require("@nestjs/common");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const bbcode_parser_1 = require("../../description-parsing/bbcode/bbcode.parser");
const markdown_parser_1 = require("../../description-parsing/markdown/markdown.parser");
const plaintext_parser_1 = require("../../description-parsing/plaintext/plaintext.parser");
const http_util_1 = __importDefault(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const post_data_interface_1 = require("../../submission/post/interfaces/post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const website_base_1 = require("../website.base");
let Custom = class Custom extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = '';
        this.MAX_CHARS = undefined;
        this.acceptsFiles = [];
        this.acceptsAdditionalFiles = true;
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        if (data.data) {
            const webhookData = data.data;
            if (webhookData.fileUrl || webhookData.notificationUrl) {
                status.loggedIn = true;
                status.username = webhookData.fileUrl || webhookData.notificationUrl;
                if (webhookData.descriptionField && webhookData.descriptionType) {
                    this.storeAccountInformation(data._id, 'parser', this.getDescriptionParser(webhookData.descriptionType));
                }
            }
        }
        return status;
    }
    getDescriptionParser(type) {
        switch (type) {
            case 'bbcode':
                return bbcode_parser_1.BBCodeParser.parse;
            case 'html':
                return undefined;
            case 'md':
                return markdown_parser_1.MarkdownParser.parse;
            case 'text':
                return plaintext_parser_1.PlaintextParser.parse;
        }
    }
    getScalingOptions(file) {
        return undefined;
    }
    parseDescription(text) {
        return text;
    }
    async postNotificationSubmission(cancellationToken, data, accountData) {
        if (!accountData.notificationUrl) {
            throw new Error('Custom website was not provided a Notification Posting URL.');
        }
        const descriptionParser = this.getAccountInfo(data.part.accountId, 'parser');
        const form = {
            [accountData.descriptionField || 'description']: descriptionParser
                ? descriptionParser(data.description)
                : data.description,
            [accountData.tagField || 'tags']: data.tags.join(','),
            [accountData.titleField || 'title']: data.title,
            [accountData.ratingField || 'rating']: data.rating,
        };
        const headers = {};
        accountData.headers.forEach(header => {
            headers[header.name] = header.value;
        });
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(accountData.notificationUrl, undefined, {
            type: 'multipart',
            data: form,
            headers: headers,
        });
        this.verifyResponse(post);
        return this.createPostResponse({});
    }
    async postFileSubmission(cancellationToken, data, accountData) {
        if (!accountData.fileUrl) {
            throw new Error('Custom website was not provided a File Posting URL.');
        }
        const descriptionParser = this.getAccountInfo(data.part.accountId, 'parser');
        const form = {
            [accountData.descriptionField || 'description']: descriptionParser
                ? descriptionParser(data.description)
                : data.description,
            [accountData.tagField || 'tags']: data.tags.join(','),
            [accountData.titleField || 'title']: data.title,
            [accountData.ratingField || 'rating']: data.rating,
            [accountData.fileField || 'file']: [data.primary.file, ...data.additional.map(a => a.file)],
            [accountData.thumbnaiField || 'thumbnail']: data.thumbnail,
        };
        const headers = {};
        accountData.headers.forEach(header => {
            headers[header.name] = header.value;
        });
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(accountData.fileUrl, undefined, {
            type: 'multipart',
            data: form,
            headers,
            requestOptions: { qsStringifyOptions: { arrayFormat: 'repeat' } },
        });
        this.verifyResponse(post);
        return this.createPostResponse({});
    }
    transformAccountData(data) {
        return data;
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        return { problems, warnings };
    }
};
Custom = __decorate([
    (0, common_1.Injectable)()
], Custom);
exports.Custom = Custom;
