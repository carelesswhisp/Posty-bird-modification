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
exports.Tumblr = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const custom_parser_1 = require("../../description-parsing/html/custom.parser");
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const http_util_1 = __importDefault(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const post_data_interface_1 = require("../../submission/post/interfaces/post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const oauth_util_1 = require("../../utils/oauth.util");
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const website_base_1 = require("../website.base");
let Tumblr = class Tumblr extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = '';
        this.acceptsFiles = ['png', 'jpeg', 'jpg', 'gif', 'mp3', 'mp4'];
        this.acceptsAdditionalFiles = true;
        this.refreshInterval = 45 * 60000;
        this.MAX_CHARS = undefined;
        this.usernameShortcuts = [
            {
                key: 'tu',
                url: 'https://$1.tumblr.com/',
            },
        ];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const accountData = data.data;
        if (accountData && accountData.token && accountData.secret) {
            status.loggedIn = true;
            status.username = accountData.user.name;
            this.storeAccountInformation(data._id, 'blogs', accountData.user.blogs);
        }
        return status;
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(10) };
    }
    preparseDescription(text) {
        return custom_parser_1.CustomHTMLParser.parse(text.replace(/<p/gm, '<div').replace(/<\/p>/gm, '</div>'))
            .replace(/<s>/gm, '<strike>')
            .replace(/<\/s>/gm, '</strike>');
    }
    parseDescription(text) {
        return text;
    }
    async postFileSubmission(cancellationToken, data, accountData) {
        const { options } = data;
        const title = options.useTitle ? `<h1>${data.title}</h1>` : '';
        const form = {
            token: accountData.token,
            secret: accountData.secret,
            title,
            description: data.description,
            tags: data.tags,
            files: [data.primary, ...data.additional].map(f => (Object.assign({ data: f.file.value.toString('base64') }, f.file.options))),
            options: {
                blog: options.blog
                    ? options.blog
                    : this.getAccountInfo(data.part.accountId, 'blogs').find(b => b.primary).name,
            },
        };
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(oauth_util_1.OAuthUtil.getURL('tumblr/v2/post'), undefined, {
            type: 'json',
            data: form,
            requestOptions: { json: true },
        });
        if (post.body.success) {
            return this.createPostResponse({
                source: `https://${form.options.blog}.tumblr.com/post/${post.body.data.id_string}/`,
            });
        }
        return Promise.reject(this.createPostResponse({ additionalInfo: post.body, message: post.body.error }));
    }
    async postNotificationSubmission(cancellationToken, data, accountData) {
        const { options } = data;
        const title = options.useTitle ? data.title : '';
        const form = {
            token: accountData.token,
            secret: accountData.secret,
            title,
            description: data.description,
            tags: data.tags,
            options: {
                blog: options.blog
                    ? options.blog
                    : this.getAccountInfo(data.part.accountId, 'blogs').find(b => b.primary).name,
            },
        };
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(oauth_util_1.OAuthUtil.getURL('tumblr/v2/post'), undefined, {
            type: 'json',
            data: form,
            requestOptions: { json: true },
        });
        if (post.body.success) {
            return this.createPostResponse({
                source: `https://${form.options.blog}.tumblr.com/post/${post.body.data.id_string}/`,
            });
        }
        return Promise.reject(this.createPostResponse({ additionalInfo: post.body, message: post.body.error }));
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        if (!submissionPart.data.blog) {
            warnings.push('Default blog will be used.');
        }
        const rating = submissionPart.data.rating || defaultPart.data.rating;
        if (rating && rating !== postybirb_commons_1.SubmissionRating.GENERAL) {
            warnings.push(`${rating} rating may violate website guidelines.`);
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
            let maxMB = 10;
            if (type === postybirb_commons_1.FileSubmissionType.IMAGE && mimetype === 'image/gif') {
                maxMB = 10;
            }
            else if (type === postybirb_commons_1.FileSubmissionType.VIDEO) {
                maxMB = 100;
            }
            if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
                if (isAutoscaling &&
                    type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                    image_manipulator_1.default.isMimeType(mimetype)) {
                    warnings.push(`${name} will be scaled down to ${maxMB}MB`);
                }
                else {
                    problems.push(`Tumblr limits ${mimetype} to ${maxMB}MB`);
                }
            }
        });
        return { problems, warnings };
    }
    validateNotificationSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        if (!submissionPart.data.blog) {
            warnings.push('Default blog will be used.');
        }
        const rating = submissionPart.data.rating || defaultPart.data.rating;
        if (rating && rating !== postybirb_commons_1.SubmissionRating.GENERAL) {
            problems.push(`${rating} rating may violate website guidelines.`);
        }
        return { problems, warnings };
    }
};
Tumblr = __decorate([
    (0, common_1.Injectable)()
], Tumblr);
exports.Tumblr = Tumblr;
