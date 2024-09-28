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
exports.e621 = void 0;
const common_1 = require("@nestjs/common");
const electron_1 = require("electron");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const username_parser_1 = require("../../description-parsing/miscellaneous/username.parser");
const plaintext_parser_1 = require("../../description-parsing/plaintext/plaintext.parser");
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const http_util_1 = __importDefault(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const form_content_util_1 = __importDefault(require("../../utils/form-content.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const website_base_1 = require("../website.base");
let e621 = class e621 extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://e621.net';
        this.MAX_CHARS = undefined;
        this.acceptsFiles = ['jpeg', 'jpg', 'png', 'gif', 'webm'];
        this.acceptsSourceUrls = true;
        this.defaultDescriptionParser = plaintext_parser_1.PlaintextParser.parse;
        this.enableAdvertisement = false;
        this.usernameShortcuts = [
            {
                key: 'e6',
                url: 'https://e621.net/user/show/$1',
            },
        ];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const accountData = data.data;
        if (accountData === null || accountData === void 0 ? void 0 : accountData.username) {
            status.username = accountData.username;
            status.loggedIn = true;
        }
        return status;
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(100) };
    }
    preparseDescription(text) {
        return username_parser_1.UsernameParser.replaceText(text, 'e6', '@$1').replace(/<a(.*?)href="(.*?)"(.*?)>(.*?)<\/a>/gi, '"$4":$2');
    }
    parseDescription(text) {
        text = text.replace(/<b>/gi, '[b]');
        text = text.replace(/<i>/gi, '[i]');
        text = text.replace(/<u>/gi, '[u]');
        text = text.replace(/<s>/gi, '[s]');
        text = text.replace(/<\/b>/gi, '[/b]');
        text = text.replace(/<\/i>/gi, '[/i]');
        text = text.replace(/<\/u>/gi, '[/u]');
        text = text.replace(/<\/s>/gi, '[/s]');
        text = text.replace(/<em>/gi, '[i]');
        text = text.replace(/<\/em>/gi, '[/i]');
        text = text.replace(/<strong>/gi, '[b]');
        text = text.replace(/<\/strong>/gi, '[/b]');
        text = text.replace(/<span style="color:\s*(.*?);*">((.|\n)*?)<\/span>/gim, '[color=$1]$2[/color]');
        text = text.replace(/<a(.*?)href="(.*?)"(.*?)>(.*?)<\/a>/gi, '"$4":$2');
        return super.parseDescription(text);
    }
    async postFileSubmission(cancellationToken, data, accountData) {
        const form = {
            login: accountData.username,
            api_key: accountData.key,
            'upload[tag_string]': this.formatTags(data.tags).join(' ').trim(),
            'upload[file]': data.primary.file,
            'upload[rating]': this.getRating(data.rating),
            'upload[description]': data.description,
            'upload[parent_id]': data.options.parentId || '',
            'upload[source]': [...data.options.sources, ...data.sources]
                .filter(s => s)
                .slice(0, 5)
                .join('%0A'),
        };
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(`${this.BASE_URL}/uploads.json`, undefined, {
            type: 'multipart',
            data: form,
            skipCookies: true,
            requestOptions: { json: true },
            headers: {
                'User-Agent': `PostyBirb/${electron_1.app.getVersion()}`,
            },
        });
        if (post.body.success && post.body.location) {
            return this.createPostResponse({ source: `https://e621.net${post.body.location}` });
        }
        return Promise.reject(this.createPostResponse({
            additionalInfo: JSON.stringify(post.body),
            message: `${post.body.reason || ''} || ${post.body.message || ''}`,
        }));
    }
    getRating(rating) {
        switch (rating) {
            case postybirb_commons_1.SubmissionRating.MATURE:
                return 'q';
            case postybirb_commons_1.SubmissionRating.ADULT:
            case postybirb_commons_1.SubmissionRating.EXTREME:
                return 'e';
            case postybirb_commons_1.SubmissionRating.GENERAL:
            default:
                return 's';
        }
    }
    transformAccountData(data) {
        return {
            username: data === null || data === void 0 ? void 0 : data.username,
        };
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        if (form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 4) {
            problems.push('Requires at least 4 tags.');
        }
        if (!website_validator_util_1.default.supportsFileType(submission.primary, this.acceptsFiles)) {
            problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
        }
        const { type, size, name } = submission.primary;
        let maxMB = 100;
        if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
            if (isAutoscaling &&
                type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                image_manipulator_1.default.isMimeType(submission.primary.mimetype)) {
                warnings.push(`${name} will be scaled down to ${maxMB}MB`);
            }
            else {
                problems.push(`e621 limits ${submission.primary.mimetype} to ${maxMB}MB`);
            }
        }
        return { problems, warnings };
    }
};
e621 = __decorate([
    (0, common_1.Injectable)()
], e621);
exports.e621 = e621;
