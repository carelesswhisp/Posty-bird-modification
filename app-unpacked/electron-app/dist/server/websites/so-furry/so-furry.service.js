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
exports.SoFurry = void 0;
const common_1 = require("@nestjs/common");
const cheerio_1 = __importDefault(require("cheerio"));
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
const generic_account_props_enum_1 = require("../generic/generic-account-props.enum");
const website_base_1 = require("../website.base");
const lodash_1 = __importDefault(require("lodash"));
const parser_1 = __importDefault(require("../../description-parsing/html-node/parser"));
const html_parser_1 = require("../../description-parsing/html/html.parser");
const browser_window_util_1 = __importDefault(require("../../utils/browser-window.util"));
let SoFurry = class SoFurry extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://www.sofurry.com';
        this.MAX_CHARS = undefined;
        this.acceptsFiles = ['png', 'jpeg', 'jpg', 'gif', 'swf', 'txt', 'mp3', 'mp4'];
        this.usernameShortcuts = [
            {
                key: 'sf',
                url: 'https://$1.sofurry.com/',
            },
        ];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        await browser_window_util_1.default.getPage(data._id, this.BASE_URL, true);
        const res = await http_util_1.default.get(`${this.BASE_URL}/upload/details?contentType=1`, data._id);
        if (res.body.includes('Logout')) {
            status.loggedIn = true;
            const $ = cheerio_1.default.load(res.body);
            status.username = $('a[class=avatar]').attr('href').split('.')[0].split('/').pop();
            this.getFolders(data._id, $);
        }
        return status;
    }
    getFolders(profileId, $) {
        const folders = [];
        $('#UploadForm_folderId')
            .children()
            .toArray()
            .forEach(o => {
            folders.push({ value: $(o).attr('value'), label: $(o).text() });
        });
        this.storeAccountInformation(profileId, generic_account_props_enum_1.GenericAccountProp.FOLDERS, folders);
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(50) };
    }
    parseDescription(text) {
        return html_parser_1.HTMLFormatParser.parse(text).replace(/\n/g, '');
    }
    getSubmissionType(type) {
        switch (type) {
            case postybirb_commons_1.FileSubmissionType.AUDIO:
                return '2';
            case postybirb_commons_1.FileSubmissionType.TEXT:
                return '0';
            case postybirb_commons_1.FileSubmissionType.IMAGE:
            case postybirb_commons_1.FileSubmissionType.VIDEO:
            default:
                return '1';
        }
    }
    getRating(rating) {
        switch (rating) {
            case postybirb_commons_1.SubmissionRating.EXTREME:
                return '2';
            case postybirb_commons_1.SubmissionRating.ADULT:
            case postybirb_commons_1.SubmissionRating.MATURE:
                return '1';
            case postybirb_commons_1.SubmissionRating.GENERAL:
            default:
                return '0';
        }
    }
    async postFileSubmission(cancellationToken, data) {
        const url = `${this.BASE_URL}/upload/details?contentType=${this.getSubmissionType(data.primary.type)}`;
        const page = await http_util_1.default.get(url, data.part.accountId);
        this.verifyResponse(page, 'Get form page');
        const form = {
            YII_CSRF_TOKEN: html_parser_util_1.default.getInputValue(page.body, 'YII_CSRF_TOKEN'),
            'UploadForm[binarycontent_5]': data.thumbnail || '',
            'UploadForm[P_title]': data.title,
            'UploadForm[description]': data.description.replace(/<\/div>(\n|\r)/g, '</div>'),
            'UploadForm[formtags]': this.formatTags(data.tags).join(', '),
            'UploadForm[contentLevel]': this.getRating(data.rating),
            'UploadForm[P_hidePublic]': '0',
            'UploadForm[folderId]': data.options.folder || '0',
        };
        if (data.primary.type === postybirb_commons_1.FileSubmissionType.TEXT) {
            form['UploadForm[textcontent]'] = data.primary.file.value;
            if (!website_validator_util_1.default.supportsFileType(data.submission.primary, this.acceptsFiles)) {
                form['UploadForm[textcontent]'] = data.fallback.value;
            }
            if (data.options.thumbnailAsCoverArt) {
                form['UploadForm[binarycontent_25]'] = data.thumbnail || '';
            }
        }
        else {
            form['UploadForm[binarycontent]'] = data.primary.file;
        }
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(url, data.part.accountId, {
            type: 'multipart',
            data: form,
            headers: {
                referer: url,
            },
        });
        this.verifyResponse(post, 'Verify posted');
        if (post.body.includes('edit')) {
            return this.createPostResponse({ source: post.returnUrl });
        }
        return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
    }
    fallbackFileParser(html) {
        const t = html_parser_1.HTMLFormatParser.parse(html);
        return { text: this.parseDescription(html), type: 'text/plain', extension: 'txt' };
    }
    async postNotificationSubmission(cancellationToken, data) {
        const url = `${this.BASE_URL}/upload/details?contentType=3`;
        const page = await http_util_1.default.get(url, data.part.accountId);
        this.verifyResponse(page, 'Get form page');
        const form = {
            YII_CSRF_TOKEN: html_parser_util_1.default.getInputValue(page.body, 'YII_CSRF_TOKEN'),
            'UploadForm[P_id]': html_parser_util_1.default.getInputValue(page.body, 'UploadForm[P_id]'),
            'UploadForm[P_title]': data.title,
            'UploadForm[textcontent]': data.description,
            'UploadForm[description]': plaintext_parser_1.PlaintextParser.parse(data.description.split('\n')[0]),
            'UploadForm[formtags]': this.formatTags(data.tags).join(', '),
            'UploadForm[contentLevel]': this.getRating(data.rating),
            'UploadForm[P_hidePublic]': '0',
            'UploadForm[folderId]': data.options.folder || '0',
            'UploadForm[newFolderName]': '',
            'UploadForm[P_isHTML]': '1',
            save: 'Publish',
        };
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(url, data.part.accountId, {
            type: 'multipart',
            data: form,
            headers: {
                referer: url,
            },
        });
        this.verifyResponse(post, 'Verify posted');
        if (post.body.includes('edit')) {
            return this.createPostResponse({ source: post.returnUrl });
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
        if (form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 2) {
            problems.push('Requires at least 2 tags.');
        }
        if (submissionPart.data.folder) {
            const folders = lodash_1.default.get(this.accountInformation.get(submissionPart.accountId), generic_account_props_enum_1.GenericAccountProp.FOLDERS, []);
            if (!folders.find(f => f.value === submissionPart.data.folder)) {
                warnings.push(`Folder (${submissionPart.data.folder}) not found.`);
            }
        }
        if (!website_validator_util_1.default.supportsFileType(submission.primary, this.acceptsFiles)) {
            if (submission.primary.type === postybirb_commons_1.FileSubmissionType.TEXT && !submission.fallback) {
                problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
                problems.push('A fallback file is required.');
            }
            else if (submission.primary.type === postybirb_commons_1.FileSubmissionType.TEXT && submission.fallback) {
                warnings.push('The fallback text will be used.');
            }
            else {
                problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
            }
        }
        const { type, size, name } = submission.primary;
        let maxMB = 50;
        if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
            if (isAutoscaling &&
                type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                image_manipulator_1.default.isMimeType(submission.primary.mimetype)) {
                warnings.push(`${name} will be scaled down to ${maxMB}MB`);
            }
            else {
                problems.push(`SoFurry limits ${submission.primary.mimetype} to ${maxMB}MB`);
            }
        }
        return { problems, warnings };
    }
};
SoFurry = __decorate([
    (0, common_1.Injectable)()
], SoFurry);
exports.SoFurry = SoFurry;
