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
exports.Discord = void 0;
const common_1 = require("@nestjs/common");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const markdown_parser_1 = require("../../description-parsing/markdown/markdown.parser");
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const http_util_1 = __importDefault(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const post_data_interface_1 = require("../../submission/post/interfaces/post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const form_content_util_1 = __importDefault(require("../../utils/form-content.util"));
const website_base_1 = require("../website.base");
let Discord = class Discord extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = '';
        this.MAX_CHARS = 2000;
        this.acceptsFiles = [];
        this.acceptsAdditionalFiles = true;
        this.enableAdvertisement = false;
        this.defaultDescriptionParser = (html) => {
            const markdown = markdown_parser_1.MarkdownParser.parse(html).replace(/\[([^\]]+)\]\(([^\)]+)\)/g, (original, url, text) => (url === text ? url : original));
            return markdown;
        };
        this.usernameShortcuts = [];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const webhookData = data.data;
        if (webhookData && webhookData.webhook) {
            const channel = await http_util_1.default.get(webhookData.webhook, undefined, {
                requestOptions: { json: true },
            });
            if (!channel.error && channel.body.id) {
                status.loggedIn = true;
                status.username = webhookData.name;
            }
        }
        return status;
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(50) };
    }
    async postNotificationSubmission(cancellationToken, data, accountData) {
        this.checkCancelled(cancellationToken);
        const res = await http_util_1.default.post(accountData.webhook.trim(), '', {
            data: this.buildDescriptionPayload(data, accountData),
            type: 'json',
            skipCookies: true,
        });
        if (res.error || res.response.statusCode >= 300) {
            return Promise.reject(this.createPostResponse({
                error: res.error,
                message: 'Webhook Failure',
                additionalInfo: res.body,
            }));
        }
        return this.createPostResponse({ additionalInfo: res.body });
    }
    async postFileSubmission(cancellationToken, data, accountData) {
        const formData = {
            payload_json: JSON.stringify(this.buildDescriptionPayload(data, accountData)),
        };
        const files = [data.primary, ...data.additional];
        files.forEach((file, i) => {
            if (data.options.spoiler) {
                file.file.options.filename = `SPOILER_${file.file.options.filename}`;
            }
            formData[`files[${i}]`] = file.file;
        });
        this.checkCancelled(cancellationToken);
        const res = await http_util_1.default.post(accountData.webhook.trim(), '', {
            data: formData,
            type: 'multipart',
            skipCookies: true,
        });
        if (res.error || res.response.statusCode >= 300) {
            return Promise.reject(this.createPostResponse({
                error: res.error,
                message: 'Webhook Failure',
                additionalInfo: res.body,
            }));
        }
        return this.createPostResponse({ additionalInfo: res.body });
    }
    transformAccountData(data) {
        return data;
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        const files = [
            submission.primary,
            ...(submission.additional || []).filter(f => !f.ignoredAccounts.includes(submissionPart.accountId)),
        ];
        const maxMB = 25;
        files.forEach(file => {
            const { type, size, name, mimetype } = file;
            if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
                warnings.push(`Discord requires files be 25MB or less, unless your channel has been boosted.`);
            }
        });
        const description = this.defaultDescriptionParser(form_content_util_1.default.getDescription(defaultPart.data.description, submissionPart.data.description));
        if (description.length > this.MAX_CHARS) {
            warnings.push('Max description length allowed is 2,000 characters.');
        }
        return { problems, warnings };
    }
    validateNotificationSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const description = this.defaultDescriptionParser(form_content_util_1.default.getDescription(defaultPart.data.description, submissionPart.data.description));
        if (description.length > this.MAX_CHARS) {
            warnings.push('Max description length allowed is 2,000 characters.');
        }
        return { problems, warnings };
    }
    buildDescriptionPayload(data, accountData) {
        var _a, _b;
        const description = (_b = (_a = data.description) === null || _a === void 0 ? void 0 : _a.substring(0, 2000)) === null || _b === void 0 ? void 0 : _b.trim();
        const mentions = (description === null || description === void 0 ? void 0 : description.match(/(<){0,1}@(&){0,1}[a-zA-Z0-9]+(>){0,1}/g)) || [];
        return {
            content: mentions.length ? mentions.join(' ') : undefined,
            allowed_mentions: {
                parse: ['everyone', 'users', 'roles'],
            },
            embeds: [
                {
                    title: data.options.useTitle ? data.title : undefined,
                    description: (description === null || description === void 0 ? void 0 : description.length) ? description : undefined,
                    footer: {
                        text: 'Posted using PostyBirb',
                    },
                },
            ],
            thread_name: accountData.forum ? data.title || 'PostyBirb Post' : undefined,
        };
    }
};
Discord = __decorate([
    (0, common_1.Injectable)()
], Discord);
exports.Discord = Discord;
