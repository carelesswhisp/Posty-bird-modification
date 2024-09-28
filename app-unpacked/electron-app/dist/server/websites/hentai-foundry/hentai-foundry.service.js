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
exports.HentaiFoundry = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const bbcode_parser_1 = require("../../description-parsing/bbcode/bbcode.parser");
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const http_util_1 = __importDefault(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const post_data_interface_1 = require("../../submission/post/interfaces/post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const html_parser_util_1 = __importDefault(require("../../utils/html-parser.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const website_base_1 = require("../website.base");
let HentaiFoundry = class HentaiFoundry extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://www.hentai-foundry.com';
        this.MAX_CHARS = undefined;
        this.acceptsFiles = ['jpeg', 'jpg', 'png', 'svg', 'gif'];
        this.defaultDescriptionParser = bbcode_parser_1.BBCodeParser.parse;
        this.usernameShortcuts = [
            {
                key: 'hf',
                url: 'https://www.hentai-foundry.com/user/$1',
            },
        ];
    }
    async checkLoginStatus(data) {
        var _a;
        const status = { loggedIn: false, username: null };
        const res = await http_util_1.default.get(this.BASE_URL, data._id);
        if ((_a = res.body) === null || _a === void 0 ? void 0 : _a.includes('Logout')) {
            status.loggedIn = true;
            status.username = res.body.match(/class=.navlink. href=.\/user\/(.*?)\//)[1];
            http_util_1.default.saveSessionCookies(this.BASE_URL, data._id);
        }
        if (!res.body) {
            this.logger.log(`HentaiFoundry returned empty body: ${res.response.statusCode}: ${res.response.statusMessage} - ${res.error}`);
        }
        return status;
    }
    getScalingOptions(file) {
        return {
            maxHeight: 1500,
            maxWidth: 1500,
            maxSize: filesize_util_1.default.MBtoBytes(2)
        };
    }
    async postNotificationSubmission(cancellationToken, data) {
        const page = await http_util_1.default.get(`${this.BASE_URL}/UserBlogs/create`, data.part.accountId);
        this.verifyResponse(page, 'Load page');
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(`${this.BASE_URL}/UserBlogs/create`, data.part.accountId, {
            type: 'multipart',
            data: {
                YII_CSRF_TOKEN: html_parser_util_1.default.getInputValue(page.body, 'YII_CSRF_TOKEN'),
                'UserBlogs[blog_title]': data.title,
                'UserBlogs[blog_body]': data.description,
            },
        });
        this.verifyResponse(post, 'Check post');
        return this.createPostResponse({ source: post.returnUrl });
    }
    async postFileSubmission(cancellationToken, data) {
        const page = await http_util_1.default.get(`${this.BASE_URL}/pictures/create`, data.part.accountId);
        this.verifyResponse(page, 'Load form');
        const { options } = data;
        const form = {
            YII_CSRF_TOKEN: html_parser_util_1.default.getInputValue(page.body, 'YII_CSRF_TOKEN'),
            'Pictures[user_id]': html_parser_util_1.default.getInputValue(page.body, 'Pictures[user_id]'),
            'Pictures[title]': data.title,
            'Pictures[description]': data.description,
            'Pictures[fileupload]': data.primary.file,
            'Pictures[submissionPolicyAgree]': '1',
            yt0: 'Create',
            'Pictures[edit_tags]': this.formatTags(data.tags).join(', '),
            'Pictures[is_scrap]': options.scraps ? '1' : '0',
            'Pictures[comments_type]': options.disableComments ? '-1' : '0',
            'Pictures[categoryHier]': options.category || '',
            'Pictures[rating_nudity]': options.nudityRating,
            'Pictures[rating_violence]': options.violenceRating,
            'Pictures[rating_profanity]': options.profanityRating,
            'Pictures[rating_racism]': options.racismRating,
            'Pictures[rating_sex]': options.sexRating,
            'Pictures[rating_spoilers]': options.spoilersRating,
            'Pictures[rating_yaoi]': options.yaoi ? '1' : '0',
            'Pictures[rating_yuri]': options.yuri ? '1' : '0',
            'Pictures[rating_teen]': options.teen ? '1' : '0',
            'Pictures[rating_guro]': options.guro ? '1' : '0',
            'Pictures[rating_furry]': options.furry ? '1' : '0',
            'Pictures[rating_beast]': options.beast ? '1' : '0',
            'Pictures[rating_male]': options.male ? '1' : '0',
            'Pictures[rating_female]': options.female ? '1' : '0',
            'Pictures[rating_futa]': options.futa ? '1' : '0',
            'Pictures[rating_other]': options.other ? '1' : '0',
            'Pictures[rating_scat]': options.scat ? '1' : '0',
            'Pictures[rating_incest]': options.incest ? '1' : '0',
            'Pictures[rating_rape]': options.rape ? '1' : '0',
            'Pictures[media_id]': options.media,
            'Pictures[time_taken]': options.timeTaken || '',
            'Pictures[reference]': options.reference || '',
            'Pictures[license_id]': '0',
        };
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(`${this.BASE_URL}/pictures/create`, data.part.accountId, {
            type: 'multipart',
            data: form,
        });
        this.verifyResponse(post, 'Verify post');
        if (!post.body.includes('Pictures_title')) {
            return this.createPostResponse({ source: post.returnUrl });
        }
        return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
    }
    formatTags(tags) {
        const maxLength = 500;
        const t = super.formatTags(tags);
        let tagString = t.join(', ').trim();
        return tagString.length > maxLength
            ? tagString
                .substring(0, maxLength)
                .split(', ')
                .filter(tag => tag.length >= 3)
            : t;
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        if (!submissionPart.data.category) {
            problems.push('Must select a category.');
        }
        if (!website_validator_util_1.default.supportsFileType(submission.primary, this.acceptsFiles)) {
            problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
        }
        const { type, size, name } = submission.primary;
        const scalingOptions = this.getScalingOptions(submission.primary);
        if (type === postybirb_commons_1.FileSubmissionType.IMAGE &&
            image_manipulator_1.default.isMimeType(submission.primary.mimetype)) {
            if (isAutoscaling) {
                if (scalingOptions.maxWidth &&
                    scalingOptions.maxHeight &&
                    (submission.primary.height > scalingOptions.maxHeight || submission.primary.width > scalingOptions.maxWidth)) {
                    warnings.push(`${name} will be scaled down to a max of 1500x1500`);
                }
                if (filesize_util_1.default.MBtoBytes(scalingOptions.maxSize) < size) {
                    warnings.push(`${name} will be scaled down to ${scalingOptions.maxSize}MB`);
                }
            }
            else {
                if (scalingOptions.maxWidth &&
                    scalingOptions.maxHeight &&
                    (submission.primary.height > scalingOptions.maxHeight || submission.primary.width > scalingOptions.maxWidth)) {
                    warnings.push(`${name} will be manually moderated unless you rescale it below 1500x1500`);
                }
                if (filesize_util_1.default.MBtoBytes(scalingOptions.maxSize) < size) {
                    problems.push(`${name} must be under ${scalingOptions.maxSize}MB`);
                }
            }
        }
        return { problems, warnings };
    }
};
HentaiFoundry = __decorate([
    (0, common_1.Injectable)()
], HentaiFoundry);
exports.HentaiFoundry = HentaiFoundry;
