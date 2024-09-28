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
exports.Pillowfort = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const http_util_1 = __importDefault(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const post_data_interface_1 = require("../../submission/post/interfaces/post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const browser_window_util_1 = __importDefault(require("../../utils/browser-window.util"));
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const html_parser_util_1 = __importDefault(require("../../utils/html-parser.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const website_base_1 = require("../website.base");
let Pillowfort = class Pillowfort extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://www.pillowfort.social';
        this.acceptsAdditionalFiles = true;
        this.MAX_CHARS = undefined;
        this.acceptsFiles = ['png', 'jpeg', 'jpg', 'gif'];
        this.usernameShortcuts = [
            {
                key: 'pf',
                url: 'https://www.pillowfort.social/$1',
            },
        ];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const res = await http_util_1.default.get(this.BASE_URL, data._id);
        await browser_window_util_1.default.getPage(data._id, this.BASE_URL, false);
        if (res.body.includes('/signout')) {
            status.loggedIn = true;
            status.username = res.body.match(/value="current_user">(.*?)</)[1];
        }
        return status;
    }
    parseDescription(text) {
        return text;
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(2) };
    }
    async uploadImage(photo, profileId, auth) {
        const upload = await http_util_1.default.post(`${this.BASE_URL}/image_upload`, profileId, {
            type: 'multipart',
            data: {
                file_name: photo.options.filename,
                photo,
            },
            requestOptions: { json: true },
            headers: {
                'X-CSRF-Token': auth,
            },
        });
        this.verifyResponse(upload, 'Image upload verify');
        return upload.body;
    }
    async postFileSubmission(cancellationToken, data) {
        const page = await http_util_1.default.get(`${this.BASE_URL}/posts/new`, data.part.accountId);
        this.verifyResponse(page, 'Get form page');
        const form = {
            authenticity_token: html_parser_util_1.default.getInputValue(page.body, 'authenticity_token'),
            utf8: '✓',
            post_to: 'current_user',
            post_type: 'picture',
            title: data.title,
            content: `<p>${data.description}</p>`,
            privacy: data.options.privacy,
            tags: this.formatTags(data.tags).join(', '),
            commit: 'Submit',
        };
        if (data.options.allowReblogging) {
            form.rebloggable = 'on';
        }
        if (data.options.allowComments) {
            form.commentable = 'on';
        }
        if (data.rating !== postybirb_commons_1.SubmissionRating.GENERAL) {
            form.nsfw = 'on';
        }
        const uploads = await Promise.all([data.primary, ...data.additional]
            .map(f => f.file)
            .map(f => this.uploadImage(f, data.part.accountId, form.authenticity_token)));
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(`${this.BASE_URL}/posts/create`, data.part.accountId, {
            type: 'function',
            data: (fd) => {
                Object.entries(form).forEach(([key, value]) => {
                    fd.append(key, value);
                });
                uploads.forEach((upload, i) => {
                    fd.append('picture[][pic_url]', upload.full_image);
                    fd.append('picture[][small_image_url]', upload.small_image);
                    fd.append('picture[][b2_lg_url]', '');
                    fd.append('picture[][b2_sm_url]', '');
                    fd.append('picture[][row]', `${i + 1}`);
                    fd.append('picture[][col]', '0');
                });
            },
        });
        this.verifyResponse(post, 'Verify post success');
        if (post.response.statusCode === 200) {
            return this.createPostResponse({});
        }
        return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
    }
    async postNotificationSubmission(cancellationToken, data) {
        const page = await http_util_1.default.get(`${this.BASE_URL}/posts/new`, data.part.accountId);
        this.verifyResponse(page, 'Get form page');
        const form = {
            authenticity_token: html_parser_util_1.default.getInputValue(page.body, 'authenticity_token'),
            utf8: '✓',
            post_to: 'current_user',
            post_type: 'text',
            title: data.title,
            content: `<p>${data.description}</p>`,
            privacy: data.options.privacy,
            tags: this.formatTags(data.tags).join(', '),
            commit: 'Submit',
        };
        if (data.options.allowReblogging) {
            form.rebloggable = 'on';
        }
        if (data.options.allowComments) {
            form.commentable = 'on';
        }
        if (data.rating !== postybirb_commons_1.SubmissionRating.GENERAL) {
            form.nsfw = 'on';
        }
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(`${this.BASE_URL}/posts/create`, data.part.accountId, {
            type: 'multipart',
            data: form,
        });
        this.verifyResponse(post, 'Verify post success');
        if (post.response.statusCode === 200) {
            return this.createPostResponse({});
        }
        return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
    }
    formatTags(tags) {
        return tags;
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        if (!website_validator_util_1.default.supportsFileType(submission.primary, this.acceptsFiles)) {
            problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
        }
        const { type, size, name } = submission.primary;
        const maxMB = 10;
        if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
            if (isAutoscaling &&
                type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                image_manipulator_1.default.isMimeType(submission.primary.mimetype)) {
                warnings.push(`${name} will be scaled down to ${maxMB}MB`);
            }
            else {
                problems.push(`Pillowfort limits ${submission.primary.mimetype} to ${maxMB}MB`);
            }
        }
        return { problems, warnings };
    }
};
Pillowfort = __decorate([
    (0, common_1.Injectable)()
], Pillowfort);
exports.Pillowfort = Pillowfort;
