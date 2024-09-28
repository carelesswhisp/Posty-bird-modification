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
exports.Twitter = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const username_parser_1 = require("../../description-parsing/miscellaneous/username.parser");
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
const submission_post_model_1 = require("./models/submission-post.model");
const twitter_api_service_1 = require("./twitter-api.service");
let Twitter = class Twitter extends website_base_1.Website {
    constructor(api) {
        super();
        this.api = api;
        this.MAX_CHARS = 280;
        this.BASE_URL = '';
        this.acceptsAdditionalFiles = true;
        this.enableAdvertisement = false;
        this.defaultDescriptionParser = plaintext_parser_1.PlaintextParser.parse;
        this.acceptsFiles = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'mp4', 'mov'];
        this.usernameShortcuts = [
            {
                key: 'tw',
                url: 'https://twitter.com/$1',
            },
        ];
    }
    transformAccountData(data) {
        return { key: data.key, secret: data.secret };
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(5) };
    }
    preparseDescription(text) {
        return username_parser_1.UsernameParser.replaceText(text, 'tw', '@$1');
    }
    formatTags(tags) {
        return this.parseTags(tags.map(tag => tag.replace(/[^a-z0-9]/gi, ' ')).map(tag => tag.split(' ').join('')), { spaceReplacer: '_' }).map(tag => `#${tag}`);
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const accountData = data.data;
        if (accountData && accountData.oauth_token) {
            status.loggedIn = true;
            status.username = accountData.screen_name;
        }
        return status;
    }
    async postFileSubmission(cancellationToken, data, accountData) {
        var _a;
        let contentBlur = (_a = data === null || data === void 0 ? void 0 : data.options) === null || _a === void 0 ? void 0 : _a.contentBlur;
        const form = new submission_post_model_1.SubmissionPost({
            token: accountData.oauth_token,
            secret: accountData.oauth_token_secret,
            title: '',
            description: data.description,
            tags: data.tags,
            files: [data.primary, ...data.additional].map(f => (Object.assign({ data: f.file.value.toString('base64') }, f.file.options))),
            rating: data.rating,
            options: {
                contentBlur,
            },
        });
        this.checkCancelled(cancellationToken);
        const post = await this.api.post({ key: accountData.key, secret: accountData.secret }, form);
        if (post.success) {
            return this.createPostResponse({ source: post.data.url });
        }
        return Promise.reject(this.createPostResponse({ additionalInfo: post, message: post.error }));
    }
    async postNotificationSubmission(cancellationToken, data, accountData) {
        const form = new submission_post_model_1.SubmissionPost({
            token: accountData.oauth_token,
            secret: accountData.oauth_token_secret,
            title: '',
            description: data.description,
            tags: data.tags,
            rating: data.rating,
            options: {
                contentBlur: undefined,
            },
        });
        this.checkCancelled(cancellationToken);
        const post = await this.api.post({ key: accountData.key, secret: accountData.secret }, form);
        if (post.success) {
            return this.createPostResponse({ source: post.data.url });
        }
        return Promise.reject(this.createPostResponse({ additionalInfo: post, message: post.error }));
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        const description = plaintext_parser_1.PlaintextParser.parse(form_content_util_1.default.getDescription(defaultPart.data.description, submissionPart.data.description), 23);
        if (description.length > 280) {
            warnings.push(`Approximated description may surpass 280 character limit (${description.length})`);
        }
        else {
            if (description.toLowerCase().indexOf('{tags}') > -1) {
                this.validateInsertTags(warnings, this.formatTags(form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags)), description, 280);
            }
            else {
                warnings.push(`You have not inserted the {tags} shortcut in your description; 
          tags will not be inserted in your post`);
            }
        }
        const files = [
            submission.primary,
            ...(submission.additional || []).filter(f => !f.ignoredAccounts.includes(submissionPart.accountId)),
        ];
        files.forEach(file => {
            const { type, size, name, mimetype } = file;
            if (!website_validator_util_1.default.supportsFileType(file, this.acceptsFiles)) {
                problems.push(`Does not support file format: (${name}) ${mimetype}.`);
            }
            let maxMB = mimetype === 'image/gif' ? 15 : 5;
            if (type === postybirb_commons_1.FileSubmissionType.VIDEO) {
                maxMB = 15;
            }
            if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
                if (isAutoscaling &&
                    type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                    image_manipulator_1.default.isMimeType(mimetype)) {
                    warnings.push(`${name} will be scaled down to ${maxMB}MB`);
                }
                else {
                    problems.push(`Twitter limits ${mimetype} to ${maxMB}MB`);
                }
            }
        });
        return { problems, warnings };
    }
    validateNotificationSubmission(submission, submissionPart, defaultPart) {
        const warnings = [];
        const description = plaintext_parser_1.PlaintextParser.parse(form_content_util_1.default.getDescription(defaultPart.data.description, submissionPart.data.description), 23);
        if (description.length > 280) {
            warnings.push(`Approximated description may surpass 280 character limit (${description.length})`);
        }
        else {
            if (description.toLowerCase().indexOf('{tags}') > -1) {
                this.validateInsertTags(warnings, this.formatTags(form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags)), description, 280);
            }
            else {
                warnings.push(`You have not inserted the {tags} shortcut in your description; 
          tags will not be inserted in your post`);
            }
        }
        return { problems: [], warnings };
    }
};
Twitter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [twitter_api_service_1.TwitterAPIService])
], Twitter);
exports.Twitter = Twitter;
