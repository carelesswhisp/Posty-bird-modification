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
exports.Pixiv = void 0;
const common_1 = require("@nestjs/common");
const cheerio_1 = __importDefault(require("cheerio"));
const FormData = require('form-data');
const electron_1 = require("electron");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const plaintext_parser_1 = require("../../description-parsing/plaintext/plaintext.parser");
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const http_util_1 = __importDefault(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const post_data_interface_1 = require("../../submission/post/interfaces/post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const form_content_util_1 = __importDefault(require("../../utils/form-content.util"));
const html_parser_util_1 = __importDefault(require("../../utils/html-parser.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const website_base_1 = require("../website.base");
let Pixiv = class Pixiv extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://www.pixiv.net';
        this.MAX_CHARS = undefined;
        this.acceptsFiles = ['png', 'jpeg', 'jpg', 'gif'];
        this.waitBetweenPostsInterval = 60000 * 5;
        this.defaultDescriptionParser = plaintext_parser_1.PlaintextParser.parse;
        this.acceptsAdditionalFiles = true;
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const res = await http_util_1.default.get(this.BASE_URL, data._id);
        const match = res.body.includes('signup-form');
        if (!match) {
            status.loggedIn = true;
            status.username = 'Logged In';
        }
        return status;
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(32) };
    }
    async postNotificationSubmission(cancellationToken, data) {
        throw new common_1.NotImplementedException('Method not implemented');
    }
    async postFileSubmission(cancellationToken, data) {
        const page = await http_util_1.default.get(`${this.BASE_URL}/upload.php`, data.part.accountId);
        this.verifyResponse(page, 'Get page');
        if (page.body.includes('__NEXT_DATA__')) {
            return this.postFileSubmissionNew(page.body, cancellationToken, data);
        }
        return this.postFileSubmissionLegacy(page.body, cancellationToken, data);
    }
    async postFileSubmissionNew(body, cancellationToken, data) {
        const $ = cheerio_1.default.load(body);
        const accountInfo = JSON.parse($('#__NEXT_DATA__').contents().first().text());
        const token = accountInfo.props.pageProps.token;
        const files = [data.thumbnail, data.primary.file, ...data.additional.map(f => f.file)].filter(f => f);
        const { options } = data;
        const form = {
            title: data.title.substring(0, 32),
            caption: data.description,
            'tags[]': this.formatTags(data.tags).slice(0, 10),
            allowTagEdit: options.communityTags ? 'true' : 'false',
            xRestrict: this.getContentRating(data.rating),
            sexual: options.sexual ? 'true' : 'false',
            aiType: options.aiGenerated ? 'aiGenerated' : 'notAiGenerated',
            restrict: 'public',
            responseAutoAccept: 'false',
            'suggestedtags[]': '',
            original: options.original ? 'true' : 'false',
            'ratings[violent]': 'false',
            'ratings[drug]': 'false',
            'ratings[thoughts]': 'false',
            'ratings[antisocial]': 'false',
            'ratings[religion]': 'false',
            'attributes[yuri]': 'false',
            'attributes[bl]': 'false',
            'attributes[furry]': 'false',
            'attributes[lo]': 'false',
            tweet: 'false',
            allowComment: 'true',
            'titleTranslations[en]': '',
            'captionTranslations[en]': '',
        };
        const sexualType = form.xRestrict;
        if (sexualType !== 'general') {
            delete form.sexual;
            if (options.matureContent) {
                options.matureContent.forEach(c => (form[`attributes[${c}]`] = 'true'));
            }
        }
        if (options.containsContent) {
            options.containsContent.forEach(c => (form[`ratings[${c}]`] = 'true'));
        }
        this.checkCancelled(cancellationToken);
        const post = await this.postSpecial(data.part.accountId, form, { 'x-csrf-token': token }, files);
        try {
            const json = JSON.parse(post);
            if (!json.error) {
                return this.createPostResponse({});
            }
            else
                throw json;
        }
        catch (error) {
            return Promise.reject(this.createPostResponse({
                additionalInfo: post,
                message: error && error instanceof Error ? error + '' : JSON.stringify(error),
            }));
        }
    }
    async postSpecial(partitionId, data, headers, files) {
        const win = new electron_1.BrowserWindow({
            show: false,
            webPreferences: {
                partition: `persist:${partitionId}`,
            },
        });
        try {
            const form = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value.options && value.value) {
                    form.append(key, value.value, value.options);
                }
                else if (Array.isArray(value)) {
                    value.forEach(v => {
                        form.append(key, v);
                    });
                }
                else {
                    form.append(key, value);
                }
            });
            files.forEach((file, i) => {
                form.append('files[]', file.value, file.options);
                form.append(`imageOrder[${i}][type]`, 'newFile');
                form.append(`imageOrder[${i}][fileKey]: `, `${i}`);
            });
            await win.loadURL(this.BASE_URL);
            const opts = {
                postData: [
                    {
                        type: 'rawData',
                        bytes: form.getBuffer(),
                    },
                ],
                extraHeaders: [
                    `Content-Type: ${form.getHeaders()['content-type']}`,
                    ...Object.entries(headers || {}).map(([key, value]) => `${key}: ${value}`),
                ].join('\n'),
            };
            await win.loadURL(`${this.BASE_URL}/ajax/work/create/illustration`, opts);
            return await win.webContents.executeJavaScript('document.body.innerText');
        }
        catch (err) {
            return Promise.reject(this.createPostResponse({ additionalInfo: err }));
        }
    }
    async postFileSubmissionLegacy(body, cancellationToken, data) {
        const files = [data.thumbnail, data.primary.file, ...data.additional.map(f => f.file)].filter(f => f);
        const form = {
            tt: html_parser_util_1.default.getInputValue(body, 'tt', 2),
            uptype: 'illust',
            x_restrict_sexual: this.getContentRatingLegacy(data.rating),
            sexual: '',
            title: data.title.substring(0, 32),
            tag: this.formatTags(data.tags).slice(0, 10).join(' '),
            comment: data.description,
            rating: '1',
            mode: 'upload',
            suggested_tags: '',
            book_style: '0',
            restrict: '0',
            'quality[]': '',
            quality_text: '',
            qropen: '',
            ai_type: data.options.aiGenerated ? '2' : '1',
            'files[]': files,
            'file_info[]': files.map(f => JSON.stringify({
                name: f.options.filename,
                type: f.options.contentType,
                size: f.value.length,
            })),
        };
        const { options } = data;
        if (!options.communityTags)
            form.taglock = '1';
        if (options.original)
            form.original = 'on';
        const sexualType = form.x_restrict_sexual;
        if (sexualType === '0') {
            if (options.sexual)
                form.sexual = 'implicit';
        }
        else {
            if (options.matureContent) {
                options.matureContent.forEach(c => (form[c] = 'on'));
            }
        }
        if (options.containsContent) {
            options.containsContent.forEach(c => (form[c] = 'on'));
        }
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(`${this.BASE_URL}/upload.php`, data.part.accountId, {
            type: 'multipart',
            data: form,
            requestOptions: { qsStringifyOptions: { arrayFormat: 'repeat' } },
        });
        try {
            const json = JSON.parse(post.body);
            if (!json.error) {
                return this.createPostResponse({});
            }
            else {
                return Promise.reject(this.createPostResponse({
                    additionalInfo: post.body,
                    message: JSON.stringify(json.error),
                }));
            }
        }
        catch (_a) { }
        return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
    }
    getContentRating(rating) {
        switch (rating) {
            case postybirb_commons_1.SubmissionRating.ADULT:
            case postybirb_commons_1.SubmissionRating.MATURE:
                return 'r18';
            case postybirb_commons_1.SubmissionRating.EXTREME:
                return 'r18g';
            case postybirb_commons_1.SubmissionRating.GENERAL:
            default:
                return 'general';
        }
    }
    getContentRatingLegacy(rating) {
        switch (rating) {
            case postybirb_commons_1.SubmissionRating.ADULT:
            case postybirb_commons_1.SubmissionRating.MATURE:
                return '1';
            case postybirb_commons_1.SubmissionRating.EXTREME:
                return '2';
            case postybirb_commons_1.SubmissionRating.GENERAL:
            default:
                return '0';
        }
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        const title = submissionPart.data.title || defaultPart.data.title || submission.title;
        if (title.length > 32) {
            warnings.push(`Title will be truncated to 32 characters: ${title.substring(0, 32)}`);
        }
        if (form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 1) {
            problems.push('Requires at least 1 tag.');
        }
        const files = [
            submission.primary,
            ...(submission.additional || []).filter(f => !f.ignoredAccounts.includes(submissionPart.accountId)),
        ];
        if (submissionPart.data.aiGenerated === undefined) {
            problems.push('Please specify if the art is AI Generated.');
        }
        const maxMB = 32;
        files.forEach(file => {
            const { type, size, name, mimetype } = file;
            if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
                if (!website_validator_util_1.default.supportsFileType(file, this.acceptsFiles)) {
                    problems.push(`Does not support file format: (${name}) ${mimetype}.`);
                }
                if (isAutoscaling &&
                    type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                    image_manipulator_1.default.isMimeType(mimetype)) {
                    warnings.push(`${name} will be scaled down to ${maxMB}MB`);
                }
                else {
                    problems.push(`Pixiv limits ${mimetype} to ${maxMB}MB`);
                }
            }
        });
        return { problems, warnings };
    }
};
Pixiv = __decorate([
    (0, common_1.Injectable)()
], Pixiv);
exports.Pixiv = Pixiv;
