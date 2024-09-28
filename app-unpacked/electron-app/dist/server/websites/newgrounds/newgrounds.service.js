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
exports.Newgrounds = void 0;
const common_1 = require("@nestjs/common");
const electron_1 = require("electron");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const gif_manipulator_1 = require("../../file-manipulation/manipulators/gif.manipulator");
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
const browser_window_util_1 = __importDefault(require("../../utils/browser-window.util"));
const wait_util_1 = __importDefault(require("../../utils/wait.util"));
let Newgrounds = class Newgrounds extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://www.newgrounds.com';
        this.acceptsFiles = ['jpeg', 'jpg', 'png', 'gif', 'bmp'];
        this.MAX_CHARS = undefined;
        this.usernameShortcuts = [
            {
                key: 'ng',
                url: 'https://$1.newgrounds.com',
            },
        ];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const res = await http_util_1.default.get(this.BASE_URL, data._id, {
            requestOptions: { rejectUnauthorized: false },
        });
        if (res.body.includes('activeuser')) {
            status.loggedIn = true;
            status.username = res.body.match(/"name":"(.*?)"/)[1];
        }
        return status;
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(40) };
    }
    parseDescription(text) {
        return text.replace(/<div/gm, '<p').replace(/<\/div>/gm, '</p>');
    }
    async postNotificationSubmission(cancellationToken, data) {
        const page = await http_util_1.default.get(`${this.BASE_URL}/account/news/post`, data.part.accountId, {
            requestOptions: { rejectUnauthorized: false },
        });
        this.verifyResponse(page);
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(`${this.BASE_URL}/account/news/post`, data.part.accountId, {
            type: 'multipart',
            data: {
                post_id: '',
                userkey: html_parser_util_1.default.getInputValue(page.body, 'userkey'),
                subject: data.title,
                emoticon: '6',
                comments_pref: '1',
                tag: '',
                'tags[]': this.formatTags(data.tags),
                body: `<p>${data.description}</p>`,
            },
            requestOptions: {
                qsStringifyOptions: { arrayFormat: 'repeat' },
                rejectUnauthorized: false,
            },
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                Origin: 'https://www.newgrounds.com',
                Referer: `https://www.newgrounds.com/account/news/post`,
                'Accept-Encoding': 'gzip, deflate, br',
                Accept: '*',
                'Content-Type': 'multipart/form-data',
            },
        });
        this.verifyResponse(post);
        try {
            const json = JSON.parse(post.body);
            if (json.url) {
                return this.createPostResponse({ source: json.url });
            }
        }
        catch (_a) { }
        return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
    }
    async getThumbnail(thumbnail, primary) {
        var _a;
        let thumbfile = {
            value: (_a = thumbnail === null || thumbnail === void 0 ? void 0 : thumbnail.value) !== null && _a !== void 0 ? _a : primary.value,
            options: {
                filename: 'thumbnail.png',
                contentType: 'image/png',
            },
        };
        if (!thumbnail && primary.options.contentType === 'image/gif') {
            const frame0 = await gif_manipulator_1.GifManipulator.getFrame(primary.value);
            thumbfile.value = frame0;
        }
        const scalePx = 600;
        let thumb = electron_1.nativeImage.createFromBuffer(thumbfile.value);
        let { height, width } = thumb.getSize();
        const ar = thumb.getAspectRatio();
        if (ar >= 1) {
            if (width > scalePx) {
                thumb = thumb.resize({
                    width: scalePx,
                    height: Math.floor(scalePx / ar),
                });
                width = scalePx;
                height = Math.floor(scalePx / ar);
            }
        }
        else {
            if (height > scalePx) {
                thumb = thumb.resize({
                    width: Math.floor(scalePx * ar),
                    height: scalePx,
                });
                width = Math.floor(scalePx * ar);
                height = scalePx;
            }
        }
        thumbfile.value = thumb.toPNG();
        return thumbfile;
    }
    checkIsSaved(response) {
        return response.success === 'saved';
    }
    cleanUpFailedProject(partition, project_id, userKey) {
        return http_util_1.default.post(`${this.BASE_URL}/projects/art/remove/${project_id}`, partition, {
            type: 'multipart',
            data: {
                userkey: userKey,
            },
        });
    }
    async postFileSubmission(cancellationToken, data) {
        const userKey = await browser_window_util_1.default.runScriptOnPage(data.part.accountId, `${this.BASE_URL}/projects/art/new`, 'return PHP.get("uek")', 300);
        if (!userKey) {
            return Promise.reject(this.createPostResponse({ message: 'Could not get userkey' }));
        }
        this.checkCancelled(cancellationToken);
        const initRes = await http_util_1.default.post(`${this.BASE_URL}/projects/art/new`, data.part.accountId, {
            type: 'multipart',
            requestOptions: { json: true },
            data: {
                PHP_SESSION_UPLOAD_PROGRESS: 'projectform',
                init_project: '1',
                userkey: userKey,
            },
        });
        if (!initRes.body.project_id || !this.checkIsSaved(initRes.body)) {
            return Promise.reject(this.createPostResponse({
                message: 'Could not initialize post to Newgrounds',
                additionalInfo: initRes.body,
            }));
        }
        const { edit_url, project_id } = initRes.body;
        const thumbfile = await this.getThumbnail(data.thumbnail, data.primary.file);
        const primaryBuf = electron_1.nativeImage.createFromBuffer(data.primary.file.value);
        const size = primaryBuf.getSize();
        const fileUploadRes = await http_util_1.default.post(edit_url, data.part.accountId, {
            type: 'multipart',
            data: {
                userkey: userKey,
                width: size.width,
                height: size.height,
                new_image: data.primary.file,
                link_icon: '1',
                cropdata: `{"x":0,"y":45,"width":${size.width},"height":${size.height}}`,
                thumbnail: thumbfile,
            },
            requestOptions: { json: true },
        });
        if (!fileUploadRes.body.image || !this.checkIsSaved(initRes.body)) {
            this.cleanUpFailedProject(data.part.accountId, initRes.body.project_id, userKey);
            return Promise.reject(this.createPostResponse({
                message: 'Could not upload file to Newgrounds',
                additionalInfo: fileUploadRes.body,
            }));
        }
        const { linked_icon } = fileUploadRes.body;
        const linkImageRes = await http_util_1.default.post(edit_url, data.part.accountId, {
            type: 'multipart',
            data: {
                userkey: userKey,
                art_image_sort: `[${linked_icon}]`,
            },
            requestOptions: { json: true },
        });
        if (!this.checkIsSaved(linkImageRes.body)) {
            this.cleanUpFailedProject(data.part.accountId, initRes.body.project_id, userKey);
            return Promise.reject(this.createPostResponse({
                message: 'Could not upload file to Newgrounds',
                additionalInfo: linkImageRes.body,
            }));
        }
        const { options } = data;
        let contentUpdateRes = await http_util_1.default.post(edit_url, data.part.accountId, {
            type: 'multipart',
            requestOptions: { json: true },
            data: {
                PHP_SESSION_UPLOAD_PROGRESS: 'projectform',
                userkey: userKey,
                encoder: 'quill',
                'option[longdescription]': this.parseDescription(data.description),
            },
        });
        const updateProps = {
            title: data.title,
            'option[tags]': this.formatTags(data.tags).join(','),
            'option[include_in_portal]': options.sketch ? '0' : '1',
            'option[use_creative_commons]': options.creativeCommons ? '1' : '0',
            'option[cc_commercial]': options.commercial ? 'yes' : 'no',
            'option[cc_modifiable]': options.modification ? 'yes' : 'no',
            'option[genreid]': options.category,
            'option[nudity]': options.nudity,
            'option[violence]': options.violence,
            'option[language_textual]': options.explicitText,
            'option[adult_themes]': options.adultThemes,
        };
        for (const [key, value] of Object.entries(updateProps)) {
            await wait_util_1.default.wait(1000);
            contentUpdateRes = await http_util_1.default.post(edit_url, data.part.accountId, {
                type: 'multipart',
                requestOptions: { json: true },
                data: {
                    PHP_SESSION_UPLOAD_PROGRESS: 'projectform',
                    userkey: userKey,
                    [key]: value,
                },
            });
            console.log(key, value, contentUpdateRes.body);
        }
        if (!this.checkIsSaved(contentUpdateRes.body)) {
            this.cleanUpFailedProject(data.part.accountId, initRes.body.project_id, userKey);
            return Promise.reject(this.createPostResponse({
                message: 'Could not update content',
                additionalInfo: contentUpdateRes.body,
            }));
        }
        const resKeys = Object.entries(contentUpdateRes.body).filter(([key]) => key.endsWith('_error'));
        if (resKeys.length > 0) {
            this.cleanUpFailedProject(data.part.accountId, initRes.body.project_id, userKey);
            return Promise.reject(this.createPostResponse({
                message: 'Could not update content:\n' + resKeys.map(([_, value]) => value).join('\n'),
                additionalInfo: contentUpdateRes.body,
            }));
        }
        this.checkCancelled(cancellationToken);
        if (contentUpdateRes.body.can_publish) {
            const publishRes = await http_util_1.default.post(`${this.BASE_URL}/projects/art/${project_id}/publish`, data.part.accountId, {
                type: 'multipart',
                data: {
                    userkey: userKey,
                    submit: '1',
                    agree: 'Y',
                    __ng_design: '2015',
                },
            });
            try {
                this.verifyResponse(publishRes);
                return this.createPostResponse({ source: publishRes.returnUrl });
            }
            catch (err) {
                this.cleanUpFailedProject(data.part.accountId, initRes.body.project_id, userKey);
                return Promise.reject(err);
            }
        }
        else {
            this.cleanUpFailedProject(data.part.accountId, initRes.body.project_id, userKey);
            return Promise.reject(this.createPostResponse({
                message: 'Could not publish content. It may be missing data',
                additionalInfo: contentUpdateRes.body,
            }));
        }
    }
    formatTags(tags) {
        return super
            .formatTags(tags, { spaceReplacer: '-' })
            .map(tag => {
            return tag.replace(/(\(|\)|:|#|;|\]|\[|')/g, '').replace(/_/g, '-');
        })
            .slice(0, 12);
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        if (!submissionPart.data.category) {
            problems.push('Must select a category value.');
        }
        if (!submissionPart.data.nudity) {
            problems.push('Must select a Nudity value.');
        }
        if (!submissionPart.data.violence) {
            problems.push('Must select a Violence value.');
        }
        if (!submissionPart.data.explicitText) {
            problems.push('Must select an Explicit Text value.');
        }
        if (!submissionPart.data.adultThemes) {
            problems.push('Must select an Adult Themes value.');
        }
        if (!website_validator_util_1.default.supportsFileType(submission.primary, this.acceptsFiles)) {
            problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
        }
        const { type, size, name } = submission.primary;
        let maxMB = 40;
        if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
            if (isAutoscaling &&
                type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                image_manipulator_1.default.isMimeType(submission.primary.mimetype)) {
                warnings.push(`${name} will be scaled down to ${maxMB}MB`);
            }
            else {
                problems.push(`Newgrounds limits ${submission.primary.mimetype} to ${maxMB}MB`);
            }
        }
        return { problems, warnings };
    }
};
Newgrounds = __decorate([
    (0, common_1.Injectable)()
], Newgrounds);
exports.Newgrounds = Newgrounds;
