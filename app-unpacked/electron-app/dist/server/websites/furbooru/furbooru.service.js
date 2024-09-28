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
exports.Furbooru = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const markdown_parser_1 = require("../../description-parsing/markdown/markdown.parser");
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const http_util_1 = __importDefault(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const browser_window_util_1 = __importDefault(require("../../utils/browser-window.util"));
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const form_content_util_1 = __importDefault(require("../../utils/form-content.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const website_base_1 = require("../website.base");
let Furbooru = class Furbooru extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://furbooru.org';
        this.MAX_CHARS = undefined;
        this.acceptsFiles = ['jpeg', 'jpg', 'png', 'svg', 'gif', 'webm'];
        this.acceptsSourceUrls = true;
        this.enableAdvertisement = false;
        this.defaultDescriptionParser = markdown_parser_1.MarkdownParser.parse;
        this.usernameShortcuts = [
            {
                key: 'furb',
                url: 'https://furbooru.org/profiles/$1',
            },
        ];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const res = await http_util_1.default.get(`${this.BASE_URL}`, data._id);
        if (res.body.includes('Logout')) {
            status.loggedIn = true;
            status.username = res.body.match(/data-user-name="(.*?)"/)[1];
            http_util_1.default.saveSessionCookies(this.BASE_URL, data._id);
        }
        return status;
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(100) };
    }
    async postFileSubmission(cancellationToken, data) {
        try {
            return await this.attemptFilePost(cancellationToken, data);
        }
        catch (err) {
            this.logger.warn(err, 'Furbooru Post Retry');
            return await this.attemptFilePost(cancellationToken, data);
        }
    }
    getRating(rating) {
        switch (rating) {
            case postybirb_commons_1.SubmissionRating.MATURE:
                return 'questionable';
            case postybirb_commons_1.SubmissionRating.ADULT:
            case postybirb_commons_1.SubmissionRating.EXTREME:
                return 'explicit';
            case postybirb_commons_1.SubmissionRating.GENERAL:
            default:
                return 'safe';
        }
    }
    async attemptFilePost(cancellationToken, data) {
        const tags = this.parseTags(data.tags, {
            spaceReplacer: ' ',
            minLength: 1,
            maxLength: 100,
        });
        const ratingTag = this.getRating(data.rating);
        const knownRatings = [
            'safe',
            'suggestive',
            'questionable',
            'explicit',
            'semi-grimdark',
            'grimdark',
            'grotesque',
        ];
        const lowerCaseTags = tags.map(t => t.toLowerCase());
        if (!lowerCaseTags.includes(ratingTag)) {
            let add = true;
            for (const r of knownRatings) {
                if (lowerCaseTags.includes(r)) {
                    add = false;
                    break;
                }
            }
            if (add) {
                tags.push(ratingTag);
            }
        }
        const form = Object.assign(Object.assign({}, (await browser_window_util_1.default.getFormData(data.part.accountId, `${this.BASE_URL}/images/new`, {
            custom: 'document.body.querySelectorAll("form")[3]',
        }))), { _method: 'post', 'image[tag_input]': this.formatTags(tags).join(', ').trim(), 'image[image]': data.primary.file, 'image[description]': data.description, 'image[source_url]': data.options.source || data.sources[0] || '' });
        this.checkCancelled(cancellationToken);
        const postResponse = await http_util_1.default.post(`${this.BASE_URL}/images`, data.part.accountId, {
            type: 'multipart',
            data: form,
        });
        this.verifyResponse(postResponse);
        return this.createPostResponse({});
    }
    formatTags(tags) {
        return tags;
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        if (form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 5) {
            problems.push('Requires at least 5 tags.');
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
                problems.push(`Furbooru limits ${submission.primary.mimetype} to ${maxMB}MB`);
            }
        }
        return { problems, warnings };
    }
};
Furbooru = __decorate([
    (0, common_1.Injectable)()
], Furbooru);
exports.Furbooru = Furbooru;
