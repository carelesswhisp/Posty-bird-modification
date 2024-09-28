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
exports.FurAffinity = void 0;
const common_1 = require("@nestjs/common");
const cheerio_1 = __importDefault(require("cheerio"));
const lodash_1 = __importDefault(require("lodash"));
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const bbcode_parser_1 = require("../../description-parsing/bbcode/bbcode.parser");
const username_parser_1 = require("../../description-parsing/miscellaneous/username.parser");
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const post_data_interface_1 = require("../../submission/post/interfaces/post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const form_content_util_1 = __importDefault(require("../../utils/form-content.util"));
const html_parser_util_1 = __importDefault(require("../../utils/html-parser.util"));
const http_experimental_1 = require("../../utils/http-experimental");
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const generic_account_props_enum_1 = require("../generic/generic-account-props.enum");
const website_base_1 = require("../website.base");
let FurAffinity = class FurAffinity extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://www.furaffinity.net';
        this.waitBetweenPostsInterval = 70000;
        this.MAX_CHARS = undefined;
        this.defaultDescriptionParser = bbcode_parser_1.BBCodeParser.parse;
        this.usernameShortcuts = [
            {
                key: 'fa',
                url: 'https://www.furaffinity.net/user/$1',
            },
        ];
        this.acceptsFiles = [
            'jpg',
            'gif',
            'png',
            'jpeg',
            'jpg',
            'swf',
            'doc',
            'docx',
            'rtf',
            'txt',
            'pdf',
            'odt',
            'mid',
            'wav',
            'mp3',
            'mpeg',
            'mpg',
        ];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const res = await http_experimental_1.HttpExperimental.get(`${this.BASE_URL}/controls/submissions`, {
            partition: data._id,
        });
        if (res.body.includes('logout-link')) {
            status.loggedIn = true;
            const $ = cheerio_1.default.load(res.body);
            status.username = $('.loggedin_user_avatar').attr('alt');
            this.getFolders(data._id, $);
        }
        return status;
    }
    getFolders(profileId, $) {
        const folders = [];
        const flatFolders = [];
        $('select[name=assign_folder_id]')
            .children()
            .each((i, el) => {
            const $el = $(el);
            if (el.name === 'option') {
                if ($el.attr('value') === '0') {
                    return;
                }
                const folder = { value: $el.attr('value'), label: $el.text() };
                folders.push(folder);
                flatFolders.push(folder);
            }
            else {
                const optgroup = {
                    label: $el.attr('label'),
                    children: [],
                };
                $el.children().each((i, opt) => {
                    const $opt = $(opt);
                    const f = {
                        value: $opt.attr('value'),
                        label: $opt.text(),
                    };
                    optgroup.children.push(f);
                    flatFolders.push(f);
                });
                folders.push(optgroup);
            }
        });
        this.storeAccountInformation(profileId, generic_account_props_enum_1.GenericAccountProp.FOLDERS, folders);
        this.storeAccountInformation(profileId, 'flat_folders', flatFolders);
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(10) };
    }
    preparseDescription(text) {
        return username_parser_1.UsernameParser.replaceText(text, 'fa', ':icon$1:', (str) => str.replace(/_/g, ''));
    }
    parseDescription(text) {
        return super.parseDescription(text).replace(/\[hr\]/g, '-----');
    }
    async postNotificationSubmission(cancellationToken, data) {
        const page = await http_experimental_1.HttpExperimental.get(`${this.BASE_URL}/controls/journal`, {
            partition: data.part.accountId,
        });
        this.verifyResponseExperimental(page, 'Check control');
        const form = {
            key: html_parser_util_1.default.getInputValue(page.body.split('action="/controls/journal/"').pop(), 'key'),
            message: data.description,
            subject: data.title,
            submit: 'Create / Update Journal',
            id: '',
            do: 'update',
        };
        if (data.options.feature) {
            form.make_featured = 'on';
        }
        this.checkCancelled(cancellationToken);
        const post = await http_experimental_1.HttpExperimental.post(`${this.BASE_URL}/controls/journal/`, {
            partition: data.part.accountId,
            type: 'multipart',
            data: form,
        });
        this.verifyResponseExperimental(post, 'Post');
        if (post.body.includes('journal-title')) {
            return this.createPostResponse({ source: post.responseUrl });
        }
        return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
    }
    getContentType(type) {
        switch (type) {
            case postybirb_commons_1.FileSubmissionType.TEXT:
                return 'story';
            case postybirb_commons_1.FileSubmissionType.VIDEO:
                return 'flash';
            case postybirb_commons_1.FileSubmissionType.AUDIO:
                return 'music';
            case postybirb_commons_1.FileSubmissionType.IMAGE:
            default:
                return 'submission';
        }
    }
    getContentCategory(type) {
        switch (type) {
            case postybirb_commons_1.FileSubmissionType.TEXT:
                return '13';
            case postybirb_commons_1.FileSubmissionType.VIDEO:
                return '7';
            case postybirb_commons_1.FileSubmissionType.AUDIO:
                return '16';
            case postybirb_commons_1.FileSubmissionType.IMAGE:
            default:
                return '1';
        }
    }
    getRating(rating) {
        switch (rating) {
            case postybirb_commons_1.SubmissionRating.ADULT:
            case postybirb_commons_1.SubmissionRating.EXTREME:
                return '1';
            case postybirb_commons_1.SubmissionRating.MATURE:
                return '2';
            case postybirb_commons_1.SubmissionRating.GENERAL:
            default:
                return '0';
        }
    }
    processForError(body) {
        if (body.includes('redirect-message')) {
            const $ = cheerio_1.default.load(body);
            let msg = $('.redirect-message').first().text();
            if (msg === null || msg === void 0 ? void 0 : msg.includes('CAPTCHA')) {
                msg =
                    'You need at least 11+ posts on your account before you can use PostyBirb with Fur Affinity.';
            }
            return msg;
        }
        return undefined;
    }
    async postFileSubmission(cancellationToken, data) {
        const part1 = await http_experimental_1.HttpExperimental.get(`${this.BASE_URL}/submit/`, {
            partition: data.part.accountId,
            headers: {
                Referer: 'https://www.furaffinity.net/submit/',
            },
        });
        this.checkCancelled(cancellationToken);
        this.verifyResponseExperimental(part1, 'Part 1');
        let err = this.processForError(part1.body);
        if (err) {
            return Promise.reject(this.createPostResponse({ message: err, additionalInfo: part1.body }));
        }
        const part2Form = {
            key: html_parser_util_1.default.getInputValue(part1.body.split('upload_form').pop(), 'key'),
            submission: data.primary.file,
            thumbnail: data.thumbnail,
            submission_type: this.getContentType(data.primary.type),
        };
        if (data.primary.type === postybirb_commons_1.FileSubmissionType.TEXT) {
            if (!website_validator_util_1.default.supportsFileType(data.submission.primary, this.acceptsFiles)) {
                part2Form.submission = data.fallback;
            }
        }
        this.checkCancelled(cancellationToken);
        const part2 = await http_experimental_1.HttpExperimental.post(`${this.BASE_URL}/submit/upload`, {
            partition: data.part.accountId,
            type: 'multipart',
            data: part2Form,
            headers: {
                Referer: 'https://www.furaffinity.net/submit',
            },
        });
        this.verifyResponseExperimental(part2, 'Part 2');
        err = this.processForError(part2.body);
        if (err) {
            return Promise.reject(this.createPostResponse({ message: err, additionalInfo: part2.body }));
        }
        const { options } = data;
        const form = {
            key: html_parser_util_1.default.getInputValue(part2.body.split('"submit-finalize"').pop(), 'key'),
            title: data.title,
            keywords: this.getFormTags(data.tags),
            message: data.description,
            rating: this.getRating(data.rating),
            create_folder_name: '',
            cat: options.category,
            atype: options.theme,
            species: options.species,
            gender: options.gender,
        };
        if (data.primary.type !== postybirb_commons_1.FileSubmissionType.IMAGE) {
            form.cat = this.getContentCategory(data.primary.type);
        }
        if (options.disableComments) {
            form.lock_comments = 'on';
        }
        if (options.scraps) {
            form.scrap = '1';
        }
        if (options.folders) {
            form['folder_ids'] = options.folders;
        }
        this.checkCancelled(cancellationToken);
        const post = await http_experimental_1.HttpExperimental.post(`${this.BASE_URL}/submit/finalize`, {
            partition: data.part.accountId,
            type: 'urlencoded',
            data: form,
        });
        this.verifyResponseExperimental(post, 'Finalize');
        const { body } = post;
        if (!post.responseUrl.includes('?upload-successful')) {
            err = this.processForError(body);
            if (err) {
                return Promise.reject(this.createPostResponse({ message: err, additionalInfo: body }));
            }
            return Promise.reject(this.createPostResponse({ message: 'Something went wrong', additionalInfo: body }));
        }
        return this.createPostResponse({ source: post.responseUrl.replace('?upload-successful', '') });
    }
    getFormTags(tags) {
        const maxLength = 250;
        tags = super.parseTags(tags).map(tag => tag.replace(/(\/|\\)/gm, '_'));
        const filteredTags = tags.filter(tag => tag.length >= 3);
        let tagString = filteredTags.join(' ').trim();
        if (tagString.length > maxLength) {
            const fitTags = [];
            filteredTags.forEach(tag => {
                if (fitTags.join(' ').length + 1 + tag.length < maxLength) {
                    fitTags.push(tag);
                }
            });
            tagString = fitTags.join(' ');
        }
        return tagString.length > maxLength ? tagString.substring(0, maxLength) : tagString;
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        if (form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags).join(' ').length > 250) {
            warnings.push('Tags will be truncated to a length of 250 characters.');
        }
        if (submissionPart.data.folders) {
            const folders = lodash_1.default.get(this.accountInformation.get(submissionPart.accountId), 'flat_folders', []);
            submissionPart.data.folders.forEach(folder => {
                if (!folders.find(f => f.value === folder)) {
                    warnings.push(`Folder (${folder}) not found.`);
                }
            });
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
        const maxMB = 10;
        if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
            if (isAutoscaling &&
                type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                image_manipulator_1.default.isMimeType(submission.primary.mimetype)) {
                warnings.push(`${name} will be scaled down to ${maxMB}MB`);
            }
            else {
                problems.push(`Fur Affinity limits ${submission.primary.mimetype} to ${maxMB}MB`);
            }
        }
        return { problems, warnings };
    }
};
FurAffinity = __decorate([
    (0, common_1.Injectable)()
], FurAffinity);
exports.FurAffinity = FurAffinity;
