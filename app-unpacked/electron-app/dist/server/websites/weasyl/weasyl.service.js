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
exports.Weasyl = void 0;
const common_1 = require("@nestjs/common");
const lodash_1 = __importDefault(require("lodash"));
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const markdown_parser_1 = require("../../description-parsing/markdown/markdown.parser");
const username_parser_1 = require("../../description-parsing/miscellaneous/username.parser");
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
const login_response_interface_1 = require("../interfaces/login-response.interface");
const website_base_1 = require("../website.base");
const generic_account_props_enum_1 = require("../generic/generic-account-props.enum");
let Weasyl = class Weasyl extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://www.weasyl.com';
        this.MAX_CHARS = undefined;
        this.acceptsFiles = ['jpg', 'jpeg', 'png', 'gif', 'md', 'txt', 'pdf', 'swf', 'mp3'];
        this.usernameShortcuts = [
            {
                key: 'ws',
                url: 'https://weasyl.com/~$1',
            },
        ];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const res = await http_util_1.default.get(`${this.BASE_URL}/api/whoami`, data._id, {
            requestOptions: { json: true },
        });
        const login = lodash_1.default.get(res.body, 'login');
        status.loggedIn = !!login;
        status.username = login;
        if (status.loggedIn) {
            await this.retrieveFolders(data._id, status.username);
        }
        return status;
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(10) };
    }
    fallbackFileParser(html) {
        return {
            text: markdown_parser_1.MarkdownParser.parse(html),
            type: 'text/markdown',
            extension: 'md',
        };
    }
    preparseDescription(text) {
        return username_parser_1.UsernameParser.replaceText(text, 'ws', '<!~$1>');
    }
    parseDescription(text) {
        return text
            .replace(/<p/gm, '<div')
            .replace(/<\/p>/gm, '</div>')
            .replace(/style="text-align:center"/g, 'class="align-center"')
            .replace(/style="text-align:right"/g, 'class="align-right"')
            .replace(/<\/div>\n<br>/g, '</div><br>')
            .replace(/<\/div><br>/g, '</div><div><br></div>');
    }
    convertRating(rating) {
        switch (rating) {
            case postybirb_commons_1.SubmissionRating.MATURE:
                return 30;
            case postybirb_commons_1.SubmissionRating.ADULT:
            case postybirb_commons_1.SubmissionRating.EXTREME:
                return 40;
            case postybirb_commons_1.SubmissionRating.GENERAL:
            default:
                return 10;
        }
    }
    getContentType(type) {
        switch (type) {
            case postybirb_commons_1.FileSubmissionType.TEXT:
                return 'literary';
            case postybirb_commons_1.FileSubmissionType.AUDIO:
            case postybirb_commons_1.FileSubmissionType.VIDEO:
                return 'multimedia';
            case postybirb_commons_1.FileSubmissionType.IMAGE:
            default:
                return 'visual';
        }
    }
    async postNotificationSubmission(cancellationToken, data) {
        const page = await http_util_1.default.get(`${this.BASE_URL}/submit/journal`, data.part.accountId);
        this.verifyResponse(page);
        const form = {
            title: data.title,
            rating: this.convertRating(data.rating),
            content: data.description,
            tags: this.formatTags(data.tags).join(' '),
        };
        this.checkCancelled(cancellationToken);
        const postResponse = await http_util_1.default.post(`${this.BASE_URL}/submit/journal`, data.part.accountId, {
            type: 'multipart',
            data: form,
            headers: {
                Referer: `${this.BASE_URL}/submit/journal`,
                Origin: 'https://www.weasyl.com',
                Host: 'www.weasyl.com',
            },
        });
        this.verifyResponse(postResponse);
        return this.createPostResponse({});
    }
    async postFileSubmission(cancellationToken, data) {
        const type = this.getContentType(data.primary.type);
        const url = `${this.BASE_URL}/submit/${type}`;
        const page = await http_util_1.default.get(url, data.part.accountId);
        this.verifyResponse(page);
        let postFile = data.primary.file;
        if (data.primary.type === postybirb_commons_1.FileSubmissionType.TEXT) {
            if (!website_validator_util_1.default.supportsFileType(data.submission.primary, this.acceptsFiles)) {
                postFile = data.fallback;
            }
        }
        const form = {
            title: data.title,
            rating: this.convertRating(data.rating),
            content: data.description,
            tags: this.formatTags(data.tags).join(' '),
            submitfile: postFile,
            redirect: url,
        };
        if (data.thumbnail) {
            form.thumbfile = data.thumbnail;
        }
        if (data.primary.type === postybirb_commons_1.FileSubmissionType.TEXT ||
            data.primary.type === postybirb_commons_1.FileSubmissionType.AUDIO ||
            data.primary.type === postybirb_commons_1.FileSubmissionType.VIDEO) {
            if (data.thumbnail) {
                form.coverfile = data.thumbnail;
            }
            else {
                form.coverfile = '';
            }
        }
        const { options } = data;
        if (!options.notify) {
            form.nonotification = 'on';
        }
        if (options.critique) {
            form.critique = 'on';
        }
        form.folderid = options.folder || '';
        form.subtype = options.category || '';
        this.checkCancelled(cancellationToken);
        const postResponse = await http_util_1.default.post(url, data.part.accountId, {
            type: 'multipart',
            data: form,
            headers: {
                Referer: url,
                Origin: 'https://www.weasyl.com',
                Host: 'www.weasyl.com',
            },
        });
        let { body } = postResponse;
        if (body.includes('manage_thumbnail')) {
            const thumbnailPost = await http_util_1.default.post(`${this.BASE_URL}/manage/thumbnail`, data.part.accountId, {
                type: 'multipart',
                data: {
                    x1: '0',
                    x2: '0',
                    y1: '0',
                    y2: '0',
                    thumbfile: '',
                    submitid: html_parser_util_1.default.getInputValue(body, 'submitid'),
                },
                headers: {
                    Referer: url,
                    Origin: 'https://www.weasyl.com',
                    Host: 'www.weasyl.com',
                },
            });
            body = thumbnailPost.body;
        }
        if (body.includes('You have already made a submission with this submission file')) {
            return this.createPostResponse({
                message: 'You have already made a submission with this submission file',
            });
        }
        if (body.includes('Submission Information')) {
            return this.createPostResponse({
                source: postResponse.returnUrl,
            });
        }
        else if (body.includes('This page contains content that you cannot view according to your current allowed ratings')) {
            return this.createPostResponse({
                source: postResponse.returnUrl,
            });
        }
        else if (body.includes('Weasyl experienced a technical issue')) {
            const recheck = await http_util_1.default.get(postResponse.returnUrl, data.part.accountId, {
                skipCookies: true,
            });
            if (recheck.body.includes('Submission Information')) {
                return this.createPostResponse({
                    source: postResponse.returnUrl,
                });
            }
            else {
                return Promise.reject(this.createPostResponse({
                    message: 'Weasyl experienced a technical issue and cannot verify if posting completed',
                    additionalInfo: recheck.body,
                }));
            }
        }
        return Promise.reject(this.createPostResponse({
            message: 'Unknown response from Weasyl',
            additionalInfo: postResponse.body,
        }));
    }
    async retrieveFolders(id, loginName) {
        const res = await http_util_1.default.get(`${this.BASE_URL}/api/users/${loginName}/view`, id, {
            requestOptions: { json: true },
        });
        const convertedFolders = [];
        const folders = res.body.folders || [];
        folders.forEach(f => {
            const folder = {
                label: f.title,
                value: f.folder_id,
            };
            convertedFolders.push(folder);
            if (f.subfolders) {
                f.subfolders.forEach(sf => {
                    const subfolder = {
                        label: `${folder.label} / ${sf.title}`,
                        value: sf.folder_id,
                    };
                    convertedFolders.push(subfolder);
                });
            }
        });
        this.accountInformation.set(id, { folders: convertedFolders });
    }
    formatTags(tags) {
        return super.formatTags(tags);
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        if (submissionPart.data.folder) {
            const folders = lodash_1.default.get(this.accountInformation.get(submissionPart.accountId), generic_account_props_enum_1.GenericAccountProp.FOLDERS, []);
            if (!folders.find(f => f.value === submissionPart.data.folder)) {
                warnings.push(`Folder (${submissionPart.data.folder}) not found.`);
            }
        }
        if (form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 2) {
            problems.push('Requires at least 2 tags.');
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
        const { type, size, name, mimetype } = submission.primary;
        let maxMB = 50;
        if (type === postybirb_commons_1.FileSubmissionType.VIDEO || type === postybirb_commons_1.FileSubmissionType.AUDIO) {
            maxMB = 15;
        }
        else if (type === postybirb_commons_1.FileSubmissionType.TEXT) {
            if (mimetype === 'text/markdown' || mimetype === 'text/plain') {
                maxMB = 2;
            }
            else {
                maxMB = 10;
            }
        }
        if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
            if (isAutoscaling &&
                type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                image_manipulator_1.default.isMimeType(submission.primary.mimetype)) {
                warnings.push(`${name} will be scaled down to ${maxMB}MB`);
            }
            else {
                problems.push(`Weasyl limits ${submission.primary.mimetype} to ${maxMB}MB`);
            }
        }
        return { problems, warnings };
    }
};
Weasyl = __decorate([
    (0, common_1.Injectable)()
], Weasyl);
exports.Weasyl = Weasyl;
