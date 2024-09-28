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
exports.Furtastic = void 0;
const common_1 = require("@nestjs/common");
const electron_1 = require("electron");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const http_util_1 = __importDefault(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const form_content_util_1 = __importDefault(require("../../utils/form-content.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const website_base_1 = require("../website.base");
const markdown_parser_1 = require("../../description-parsing/markdown/markdown.parser");
let Furtastic = class Furtastic extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://api.furtastic.art';
        this.MAX_CHARS = undefined;
        this.acceptsFiles = ['jpeg', 'jpg', 'png', 'gif', 'webm', 'pdf'];
        this.defaultDescriptionParser = markdown_parser_1.MarkdownParser.parse;
        this.enableAdvertisement = true;
        this.acceptsAdditionalFiles = true;
        this.usernameShortcuts = [
            {
                key: 'ft',
                url: 'https://furtastic.art/profile/$1',
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
    async postFileSubmission(cancellationToken, data, accountData) {
        const form = {
            tags: this.formatTags(data.tags).join(' ').trim(),
            'file[0]': data.primary.file,
            rating: this.getRating(data.rating),
            description: data.description,
            title: data.title
        };
        data.additional.forEach((file, index) => {
            form[`file[${index + 1}]`] = file.file;
        });
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(`${this.BASE_URL}/private/api-upload`, undefined, {
            type: 'multipart',
            data: form,
            skipCookies: true,
            requestOptions: { json: true },
            headers: {
                'User-Agent': `PostyBirb/${electron_1.app.getVersion()}`,
                'x-api-user': accountData.username,
                'x-api-key': accountData.key,
            },
        });
        if (post.body.status && post.body.status === true) {
            return this.createPostResponse({ source: `https://furtastic.art${post.body.url}` });
        }
        return Promise.reject(this.createPostResponse({
            additionalInfo: JSON.stringify(post.body),
            message: ` ${post.body.message}`,
        }));
    }
    getRating(rating) {
        switch (rating) {
            case postybirb_commons_1.SubmissionRating.MATURE:
                return 'nsfw';
            case postybirb_commons_1.SubmissionRating.ADULT:
            case postybirb_commons_1.SubmissionRating.EXTREME:
                return 'nsfw';
            case postybirb_commons_1.SubmissionRating.GENERAL:
            default:
                return 'safe';
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
        if (form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 1) {
            problems.push('Requires at least 1 tag.');
        }
        if (!website_validator_util_1.default.supportsFileType(submission.primary, this.acceptsFiles)) {
            problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
        }
        const { type, size, name } = submission.primary;
        let maxMB = 250;
        if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
            if (isAutoscaling &&
                type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                image_manipulator_1.default.isMimeType(submission.primary.mimetype)) {
                warnings.push(`${name} will be scaled down to ${maxMB}MB`);
            }
            else {
                problems.push(`Furtastic limits ${submission.primary.mimetype} to ${maxMB}MB`);
            }
        }
        return { problems, warnings };
    }
};
Furtastic = __decorate([
    (0, common_1.Injectable)()
], Furtastic);
exports.Furtastic = Furtastic;
