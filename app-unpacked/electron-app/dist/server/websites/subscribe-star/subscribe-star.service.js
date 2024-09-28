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
exports.SubscribeStar = void 0;
const common_1 = require("@nestjs/common");
const cheerio_1 = __importDefault(require("cheerio"));
const electron_1 = require("electron");
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
const uuid_1 = require("uuid");
const generic_account_props_enum_1 = require("../generic/generic-account-props.enum");
const website_base_1 = require("../website.base");
const lodash_1 = __importDefault(require("lodash"));
let SubscribeStar = class SubscribeStar extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://www.subscribestar.com';
        this.acceptsAdditionalFiles = true;
        this.enableAdvertisement = false;
        this.MAX_CHARS = undefined;
        this.usernameShortcuts = [
            {
                key: 'ss',
                url: 'https://www.subscribestar.com/$1',
            },
        ];
        this.acceptsFiles = [];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const res = await http_util_1.default.get(this.BASE_URL, data._id, { updateCookies: true });
        if (res.body.includes('top_bar-user_name')) {
            status.loggedIn = true;
            status.username = res.body.match(/<div class="top_bar-user_name">(.*?)<\/div>/)[1];
            let usernameLink = res.body.match(/class="top_bar-branding">(.*?)href="(.*?)"/ims)[2];
            if (usernameLink && usernameLink.includes('/feed')) {
                usernameLink = `/${status.username}`;
            }
            this.storeAccountInformation(data._id, 'username', usernameLink);
            await this.getTiers(data._id);
        }
        return status;
    }
    async getTiers(profileId) {
        const tiers = [
            {
                label: 'Public',
                value: 'free',
            },
        ];
        const { body } = await http_util_1.default.get(`${this.BASE_URL}/profile/settings`, profileId);
        const $ = cheerio_1.default.load(body);
        $('.tiers-settings_item').each((i, el) => {
            const $el = $(el);
            tiers.push({
                label: $el.find('.tiers-settings_item-title').text(),
                value: $el.attr('data-id'),
            });
        });
        if (tiers.length === 1) {
            tiers.push({
                label: 'Subscribers Only',
                value: 'basic',
            });
        }
        this.storeAccountInformation(profileId, generic_account_props_enum_1.GenericAccountProp.FOLDERS, tiers);
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(5) };
    }
    parseDescription(text) {
        return text
            .replace(/<p/gm, '<div')
            .replace(/<\/p>/gm, '</div>')
            .replace(/<hr\s{0,1}\/{0,1}>/g, '------------<br>')
            .replace(/\n/g, '');
    }
    async postMessily(partition, data) {
        const cmd = `
    const data = ${JSON.stringify(data)};
    var fd = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => fd.append(key, v));
      } else {
        fd.append(key, value);
      }
    });
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/posts.json', false);
    xhr.setRequestHeader("X-CSRF-Token", document.body.parentElement.innerHTML.match(/<meta name="csrf-token" content="(.*?)"/)[1]);
    xhr.send(fd);
    return xhr.responseText
    `;
        const upload = await browser_window_util_1.default.runScriptOnPage(partition, `${this.BASE_URL}`, cmd);
        if (!upload) {
            throw this.createPostResponse({
                message: `Failed to upload post`,
                additionalInfo: 'Finalize',
            });
        }
        return JSON.parse(upload);
    }
    async postFileMessily(partition, data, url) {
        const cmd = `
    const data = JSON.parse('${JSON.stringify(data)}');
    var fd = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => fd.append(key, v));
      } else {
        fd.append(key, value);
      }
    });
    fd.append('authenticity_token', document.body.parentElement.innerHTML.match(/<meta name="csrf-token" content="(.*?)"/)[1]);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '${url}', false);
    xhr.setRequestHeader("X-CSRF-Token", document.body.parentElement.innerHTML.match(/<meta name="csrf-token" content="(.*?)"/)[1]);
    xhr.send(fd);
    return xhr.responseText
    `;
        const upload = await browser_window_util_1.default.runScriptOnPage(partition, `${this.BASE_URL}`, cmd);
        if (!upload) {
            throw this.createPostResponse({
                message: `Failed to upload post`,
                additionalInfo: 'Finalize',
            });
        }
        const res = JSON.parse(upload);
        if (res.redirect_path) {
            throw this.createPostResponse({
                message: `Failed to upload post`,
                additionalInfo: 'Finalize',
            });
        }
        return res;
    }
    async postNotificationSubmission(cancellationToken, data) {
        const form = {
            html_content: `<div>${data.options.useTitle && data.title ? `<h1>${data.title}</h1>` : ''}${data.description}</div>`,
            pinned_uploads: '[]',
            new_editor: 'true',
            'tier_ids[]': data.options.tiers.includes('free') ? undefined : data.options.tiers,
            'tags[]': data.tags,
            is_draft: '',
            has_poll: 'false',
            finish_date: '',
            finish_time: '',
            posting_option: 'Publish Now',
        };
        this.checkCancelled(cancellationToken);
        const post = await this.postMessily(data.part.accountId, form);
        if (post.error) {
            return Promise.reject(this.createPostResponse({ error: post.error, additionalInfo: post }));
        }
        return this.createPostResponse({
            source: `${this.BASE_URL}/posts/${post.html.match(/data-id="(.*?)"/)[1]}`,
        });
    }
    async postFileSubmission(cancellationToken, data) {
        const usernameLink = this.getAccountInfo(data.part.accountId, 'username');
        let { csrf, cookies, postKey, bucket } = await browser_window_util_1.default.runScriptOnPage(data.part.accountId, `${this.BASE_URL}${usernameLink}`, `
      async function getInfo() {
        var csrf = document.body.parentElement.innerHTML.match(/<meta name="csrf-token" content="(.*?)"/)[1].trim();
        var cookies = (await cookieStore.getAll()).reduce((a, b) => \`$\{a\} $\{b.name\}=$\{b.value\};\`, '').trim();
        var postKey = document.body.parentElement.innerHTML.replace(/\&quot;/g, '"').match(/data-s3-upload-path=\\"(.*?)\\"/)[1].trim();
        var bucket = document.body.parentElement.innerHTML.replace(/\&quot;/g, '"').match(/data-s3-bucket="(.*?)"/)[1].trim();
        var out = { csrf, cookies, postKey, bucket }

        return out;
      }
      
      return getInfo();
    `);
        const files = [data.primary, ...data.additional].map(f => f.file);
        this.checkCancelled(cancellationToken);
        let processData = null;
        for (const file of files) {
            const key = `${postKey}/${(0, uuid_1.v1)()}.${file.options.filename.split('.').pop()}`;
            const presignUrl = `${this.BASE_URL}/presigned_url/upload?_=${Date.now()}&key=${encodeURIComponent(key)}&file_name=${encodeURIComponent(file.options.filename)}&content_type=${encodeURIComponent(file.options.contentType)}&bucket=${bucket}`;
            const presign = await http_util_1.default.get(presignUrl, data.part.accountId, {
                requestOptions: {
                    json: true,
                },
            });
            const postFile = await http_util_1.default.post(presign.body.url, data.part.accountId, {
                type: 'multipart',
                data: Object.assign(Object.assign({}, presign.body.fields), { file, authenticity_token: csrf }),
                headers: {
                    Referer: 'https://www.subscribestar.com/',
                    Origin: 'https://www.subscribestar.com',
                    cookie: cookies,
                },
            });
            this.verifyResponse(postFile, 'Uploading File');
            const record = {
                path: key,
                url: `${presign.body.url}/${key}`,
                original_filename: file.options.filename,
                content_type: file.options.contentType,
                bucket,
                authenticity_token: csrf,
            };
            if (record.content_type.includes('image')) {
                const { width, height } = electron_1.nativeImage.createFromBuffer(file.value).getSize();
                record.width = width;
                record.height = height;
            }
            const processFile = await this.postFileMessily(data.part.accountId, record, `/post_uploads/process_s3_attachments.json`);
            processData = processFile;
        }
        if (files.length > 1) {
            const order = processData.imgs_and_videos
                .sort((a, b) => a.id - b.id)
                .map(record => record.id);
            const reorder = await this.postFileMessily(data.part.accountId, {
                'upload_ids[]': order,
            }, `/post_uploads/reorder`);
        }
        const form = {
            html_content: `<div>${data.options.useTitle && data.title ? `<h1>${data.title}</h1>` : ''}${data.description}</div>`,
            pinned_uploads: '[]',
            new_editor: 'true',
            'tier_ids[]': data.options.tiers.includes('free') ? undefined : data.options.tiers,
            'tags[]': data.tags,
            is_draft: '',
            has_poll: 'false',
            finish_date: '',
            finish_time: '',
            posting_option: 'Publish Now',
        };
        const post = await this.postMessily(data.part.accountId, form);
        if (post.error) {
            return Promise.reject(this.createPostResponse({ error: post.error, additionalInfo: post }));
        }
        return this.createPostResponse({
            source: `${this.BASE_URL}/posts/${post.html.match(/data-id="(.*?)"/)[1]}`,
        });
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        if (!submissionPart.data.tiers) {
            problems.push('No access tiers selected.');
        }
        if (submissionPart.data.tiers && submissionPart.data.tiers.length) {
            const folders = lodash_1.default.get(this.accountInformation.get(submissionPart.accountId), generic_account_props_enum_1.GenericAccountProp.FOLDERS, []);
            submissionPart.data.tiers.forEach(tier => {
                if (!folders.find(f => f.value === tier)) {
                    warnings.push(`Access Tier (${tier}) not found.`);
                }
            });
        }
        const files = [
            submission.primary,
            ...(submission.additional || []).filter(f => !f.ignoredAccounts.includes(submissionPart.accountId)),
        ];
        files.forEach(file => {
            const { type, size, name, mimetype } = file;
            let maxMB = 5;
            if (type === postybirb_commons_1.FileSubmissionType.AUDIO) {
                maxMB = 50;
            }
            else if (type === postybirb_commons_1.FileSubmissionType.TEXT) {
                maxMB = 300;
            }
            else if (type === postybirb_commons_1.FileSubmissionType.VIDEO) {
                maxMB = 250;
            }
            if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
                if (isAutoscaling &&
                    type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                    image_manipulator_1.default.isMimeType(mimetype)) {
                    warnings.push(`${name} will be scaled down to ${maxMB}MB`);
                }
                else {
                    problems.push(`SubscribeStar limits ${mimetype} to ${maxMB}MB`);
                }
            }
        });
        return { problems, warnings };
    }
    validateNotificationSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        if (!submissionPart.data.tiers) {
            problems.push('No access tiers selected.');
        }
        if (submissionPart.data.tiers && submissionPart.data.tiers.length) {
            const folders = lodash_1.default.get(this.accountInformation.get(submissionPart.accountId), generic_account_props_enum_1.GenericAccountProp.FOLDERS, []);
            submissionPart.data.tiers.forEach(tier => {
                if (!folders.find(f => f.value === tier)) {
                    warnings.push(`Access Tier (${tier}) not found.`);
                }
            });
        }
        return { problems, warnings };
    }
};
SubscribeStar = __decorate([
    (0, common_1.Injectable)()
], SubscribeStar);
exports.SubscribeStar = SubscribeStar;
