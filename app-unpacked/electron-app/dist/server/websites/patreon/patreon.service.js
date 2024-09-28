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
exports.Patreon = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const post_data_interface_1 = require("../../submission/post/interfaces/post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const browser_window_util_1 = __importDefault(require("../../utils/browser-window.util"));
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const uuid_1 = require("uuid");
const generic_account_props_enum_1 = require("../generic/generic-account-props.enum");
const website_base_1 = require("../website.base");
const http_util_1 = __importDefault(require("../../http/http.util"));
let Patreon = class Patreon extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://www.patreon.com';
        this.acceptsAdditionalFiles = true;
        this.MAX_CHARS = undefined;
        this.refreshBeforePost = true;
        this.waitBetweenPostsInterval = 90000;
        this.enableAdvertisement = false;
        this.usernameShortcuts = [
            {
                key: 'pa',
                url: 'https://www.patreon.com/$1',
            },
        ];
        this.acceptsFiles = [
            'png',
            'jpeg',
            'jpg',
            'gif',
            'midi',
            'ogg',
            'oga',
            'wav',
            'x-wav',
            'webm',
            'mp3',
            'mpeg',
            'pdf',
            'txt',
            'rtf',
            'md',
        ];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const body = await browser_window_util_1.default.runScriptOnPage(data._id, `${this.BASE_URL}/membership`, 'return window.patreon.bootstrap.creator', 1000);
        if (body.data) {
            status.loggedIn = true;
            status.username = body.data.attributes.name;
            this.loadTiers(data._id, body.included.filter(included => included.type === 'reward' || included.type === 'access-rule'));
        }
        return status;
    }
    loadTiers(profileId, rewardAttributes) {
        const tiers = rewardAttributes
            .filter(({ type }) => type === 'reward')
            .map(attr => ({
            label: attr.attributes.title || attr.attributes.description,
            value: attr.id,
        }));
        rewardAttributes
            .filter(({ type }) => type === 'access-rule')
            .forEach(rule => {
            var _a, _b, _c;
            if ((_c = (_b = (_a = rule.relationships) === null || _a === void 0 ? void 0 : _a.tier) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.id) {
                const matchingTier = tiers.find(t => t.value === rule.relationships.tier.data.id);
                if (matchingTier) {
                    matchingTier.value = rule.id;
                }
            }
        });
        rewardAttributes
            .filter(({ type }) => type === 'access-rule')
            .forEach(rule => {
            if (rule.attributes.access_rule_type === 'public') {
                tiers.find(t => t.value === '-1').value = rule.id;
            }
            if (rule.attributes.access_rule_type === 'patrons') {
                tiers.push({
                    value: rule.id,
                    label: 'Patrons Only',
                });
            }
        });
        this.storeAccountInformation(profileId, generic_account_props_enum_1.GenericAccountProp.FOLDERS, tiers);
    }
    async getCSRF(profileId) {
        const csrf = await browser_window_util_1.default.runScriptOnPage(profileId, `${this.BASE_URL}`, 'return window.__NEXT_DATA__.props.pageProps.bootstrapEnvelope.csrfSignature', 100);
        if (!csrf) {
            throw new Error('No CSRF Token found.');
        }
        return csrf;
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(200) };
    }
    parseDescription(text) {
        if (!text) {
            return '';
        }
        text = text.replace(/[\u00A0-\u9999<>&](?!#)/gim, i => {
            return '&#' + i.charCodeAt(0) + ';';
        });
        text = text.replace(/&#([0-9]{1,3});/gi, (match, num) => {
            return String.fromCharCode(parseInt(num));
        });
        return text
            .replace(/\n/g, '')
            .replace(/<p/gm, '<div')
            .replace(/<\/p>/gm, '</div>')
            .replace(/(<s>|<\/s>)/g, '')
            .replace(/<hr\s{0,1}\/{0,1}>/g, '------------<br>');
    }
    getPostType(type, alt = false) {
        if (alt) {
            if (type === postybirb_commons_1.FileSubmissionType.IMAGE) {
                return 'image_file';
            }
            if (type === postybirb_commons_1.FileSubmissionType.AUDIO) {
                return 'audio_embed';
            }
            if (type === postybirb_commons_1.FileSubmissionType.TEXT) {
                return 'text_only';
            }
        }
        else {
            if (type === postybirb_commons_1.FileSubmissionType.IMAGE) {
                return 'image_file';
            }
            if (type === postybirb_commons_1.FileSubmissionType.AUDIO) {
                return 'audio_file';
            }
            if (type === postybirb_commons_1.FileSubmissionType.TEXT) {
                return 'text_only';
            }
        }
        return 'image_file';
    }
    async createPost(profileId, csrf, data) {
        const cmd = `
    var data = ${JSON.stringify(data)};
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/posts?fields[post]=post_type%2Cpost_metadata&json-api-version=1.0&include=[]', false);
    xhr.setRequestHeader('X-CSRF-Signature', '${csrf}');
    xhr.setRequestHeader("Content-Type", "application/vnd.api+json");
    xhr.send(JSON.stringify(data));
    var body = xhr.response;
    return Object.assign({}, { body: body, status: xhr.status })`;
        const create = await browser_window_util_1.default.runScriptOnPage(profileId, `${this.BASE_URL}`, cmd);
        return JSON.parse(create.body);
    }
    async finalizePost(profileId, id, csrf, data) {
        const cmd = `
    var data = ${JSON.stringify(data)};
    var xhr = new XMLHttpRequest();
    xhr.open('PATCH', '/api/posts/${id}?json-api-version=1.0', false);
    xhr.setRequestHeader('X-CSRF-Signature', '${csrf}');
    xhr.setRequestHeader("Content-Type", "application/vnd.api+json");
    xhr.send(JSON.stringify(data));
    var body = xhr.response;
    return Object.assign({}, { body: body, status: xhr.status })`;
        return browser_window_util_1.default.runScriptOnPage(profileId, `${this.BASE_URL}/posts/${id}/edit`, cmd);
    }
    toUTCISO(date) {
        let d = typeof date === 'string' ? new Date(date) : date;
        return d.toISOString().split('.').shift();
    }
    async postNotificationSubmission(cancellationToken, data) {
        const csrf = await this.getCSRF(data.part.accountId);
        const createData = {
            data: {
                type: 'post',
                attributes: {
                    post_type: 'text_only',
                },
            },
        };
        const create = await this.createPost(data.part.accountId, csrf, createData);
        const link = create.data.id;
        const formattedTags = this.formatTags(data.tags)
            .map(tag => {
            return {
                type: 'post_tag',
                id: `user_defined;${tag}`,
                attributes: {
                    value: tag,
                    cardinality: 1,
                },
            };
        })
            .slice(0, 50);
        const relationshipTags = formattedTags.map(tag => {
            return {
                id: tag.id,
                type: tag.type,
            };
        });
        const { options } = data;
        const accessRules = options.tiers.map(tier => {
            return { type: 'access-rule', id: tier };
        });
        const attributes = {
            content: data.description,
            post_type: createData.data.type,
            is_paid: options.charge ? 'true' : 'false',
            title: data.title,
            teaser_text: (options.teaser || '').slice(0, 140),
            post_metadata: {},
            tags: { publish: true },
        };
        if (options.schedule) {
            attributes.scheduled_for = this.toUTCISO(options.schedule);
            attributes.tags.publish = false;
        }
        const relationships = {
            post_tag: {
                data: relationshipTags.length > 0 ? relationshipTags[0] : {},
            },
            user_defined_tags: {
                data: relationshipTags,
            },
            access_rule: {
                data: accessRules[accessRules.length - 1],
            },
            access_rules: {
                data: accessRules,
            },
        };
        const form = {
            data: {
                attributes,
                relationships,
                type: 'post',
            },
            included: formattedTags,
        };
        accessRules.forEach(rule => form.included.push(rule));
        this.checkCancelled(cancellationToken);
        const post = await this.finalizePost(data.part.accountId, link, csrf, form);
        try {
            const json = JSON.parse(post.body);
            if (!json.errors) {
                return this.createPostResponse({ source: `${this.BASE_URL}/posts/${link}` });
            }
        }
        catch (_a) { }
        return Promise.reject(this.createPostResponse({ additionalInfo: post }));
    }
    async postFileSubmission(cancellationToken, data) {
        const csrf = await this.getCSRF(data.part.accountId);
        const createData = {
            data: {
                type: 'post',
                attributes: {
                    post_type: this.getPostType(data.primary.type),
                },
            },
        };
        const create = await this.createPost(data.part.accountId, csrf, createData);
        const link = create.data.id;
        [data.primary.file, data.thumbnail, ...data.additional.map(f => f.file)]
            .filter(f => f)
            .forEach(f => (f.options.filename = f.options.filename.replace(/'/g, '')));
        let uploadType = 'main';
        let shouldUploadThumbnail = false;
        if (data.primary.type === postybirb_commons_1.FileSubmissionType.AUDIO) {
            uploadType = 'audio';
            shouldUploadThumbnail = data.thumbnail ? true : false;
        }
        let primaryFileUpload;
        let thumbnailFileUpload;
        const additionalUploads = [];
        const additionalImageUploads = [];
        try {
            if (data.primary.type === postybirb_commons_1.FileSubmissionType.TEXT) {
                const upload = await this.uploadAttachment(link, data.primary.file, csrf, data.part.accountId);
                additionalUploads.push(upload);
            }
            else {
                primaryFileUpload = await this.uploadFile(link, data.primary.file, csrf, data.part.accountId, uploadType);
                if (shouldUploadThumbnail) {
                    thumbnailFileUpload = await this.uploadFile(link, data.thumbnail, csrf, data.part.accountId, 'main');
                }
            }
            for (const file of data.additional) {
                if (data.primary.type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                    file.type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                    !data.options.allAsAttachment) {
                    const upload = await this.uploadFile(link, file.file, csrf, data.part.accountId, uploadType);
                    additionalImageUploads.push(upload);
                }
                else {
                    const upload = await this.uploadAttachment(link, file.file, csrf, data.part.accountId);
                    additionalUploads.push(upload);
                }
            }
        }
        catch (err) {
            return Promise.reject(this.createPostResponse({ additionalInfo: err }));
        }
        const formattedTags = this.formatTags(data.tags)
            .map(tag => {
            return {
                type: 'post_tag',
                id: `user_defined;${tag}`,
                attributes: {
                    value: tag,
                    cardinality: 1,
                },
            };
        })
            .slice(0, 50);
        const relationshipTags = formattedTags.map(tag => {
            return {
                id: tag.id,
                type: tag.type,
            };
        });
        const { options } = data;
        const accessRules = options.tiers.map(tier => {
            return { type: 'access-rule', id: tier };
        });
        const attributes = {
            content: data.description,
            post_type: createData.data.type,
            is_paid: options.charge ? 'true' : 'false',
            title: data.title,
            teaser_text: (options.teaser || '').slice(0, 140),
            post_metadata: {},
            tags: { publish: true },
        };
        if (options.schedule) {
            attributes.scheduled_for = this.toUTCISO(options.schedule);
            attributes.tags.publish = false;
        }
        if (options.earlyAccess) {
            attributes.change_visibility_at = this.toUTCISO(options.earlyAccess);
        }
        const relationships = {
            post_tag: {
                data: relationshipTags.length > 0 ? relationshipTags[0] : {},
            },
            user_defined_tags: {
                data: relationshipTags,
            },
            access_rule: {
                data: accessRules[accessRules.length - 1],
            },
            access_rules: {
                data: accessRules,
            },
        };
        let image_order = [];
        if (data.primary.type === postybirb_commons_1.FileSubmissionType.AUDIO ||
            data.primary.type === postybirb_commons_1.FileSubmissionType.IMAGE) {
            image_order = [
                thumbnailFileUpload ? thumbnailFileUpload.body.data.id : primaryFileUpload.body.data.id,
                ...additionalImageUploads.map(img => img.body.data.id),
            ];
        }
        const form = {
            data: {
                attributes,
                relationships,
                type: 'post',
            },
            included: formattedTags,
            meta: {
                image_order,
            },
        };
        accessRules.forEach(rule => form.included.push(rule));
        this.checkCancelled(cancellationToken);
        const post = await this.finalizePost(data.part.accountId, link, csrf, form);
        try {
            const json = JSON.parse(post.body);
            if (!json.errors) {
                return this.createPostResponse({ source: `${this.BASE_URL}/posts/${link}` });
            }
        }
        catch (_a) { }
        return Promise.reject(this.createPostResponse({ additionalInfo: post }));
    }
    async uploadFile(link, file, csrf, profileId, relationship) {
        const data = {
            data: {
                attributes: {
                    state: 'pending_upload',
                    owner_id: link,
                    owner_type: 'post',
                    owner_relationship: relationship || 'main',
                    file_name: file.options.filename,
                },
                type: 'media',
            },
        };
        const buf = file.value.toString('base64');
        const cmd = `
    const data = '${JSON.stringify(data)}';
    var h = new XMLHttpRequest();
    h.open('POST', '/api/media?json-api-version=1.0', false);
    h.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    h.setRequestHeader("X-CSRF-Signature", "${csrf}");
    h.send(data);
    var body = JSON.parse(h.response);
    var x = body.data.attributes.upload_parameters;
    var dest = body.data.attributes.upload_url;
    var fd = new FormData();
    var buf = atob('${buf}');
    var file = new File([Uint8Array.from(buf, x => x.charCodeAt(0))], '${file.options.filename}', { type: '${file.options.contentType}' });
    Object.entries(x).forEach(([key, value]) => fd.append(key, value));
    fd.append('file', file);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', dest, false);
    xhr.send(fd);
    return Object.assign({}, { body: body, status: xhr.status, response: xhr.response })`;
        const upload = await browser_window_util_1.default.runScriptOnPage(profileId, `${this.BASE_URL}/posts/${link}/edit`, cmd);
        if (upload && upload.body && upload.status && upload.status < 320) {
            return upload;
        }
        else {
            throw this.createPostResponse({
                message: `Failed to upload file: ${file.options.filename}`,
                additionalInfo: upload,
            });
        }
    }
    async uploadAttachment(link, file, csrf, profileId) {
        const uuid = (0, uuid_1.v1)();
        const data = {
            qquuid: uuid,
            qqfilename: file.options.filename,
            qqtotalfilesize: file.value.length,
        };
        const buf = file.value.toString('base64');
        const cmd = `
    const data = '${JSON.stringify(data)}';
    var fd = new FormData();
    var buf = atob('${buf}');
    var file = new File([Uint8Array.from(buf, x => x.charCodeAt(0))], '${file.options.filename}', { type: '${file.options.contentType}' });
    Object.entries(data).forEach(([key, value]) => fd.append(key, value));
    fd.append('file', file);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/posts/${link}/attachments?json-api-version=1.0', false);
    xhr.setRequestHeader("X-CSRF-Signature", "${csrf}");
    xhr.send(fd);
    return xhr.status`;
        const upload = await browser_window_util_1.default.runScriptOnPage(profileId, `${this.BASE_URL}/posts/${link}/edit`, cmd);
        if (!(upload && upload < 320)) {
            throw this.createPostResponse({
                message: `Failed to upload file: ${file.options.filename}`,
                additionalInfo: 'Attachment',
            });
        }
    }
    formatTags(tags) {
        return tags.filter(tag => tag.length <= 25);
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        const options = submissionPart.data;
        if (options.tiers && options.tiers.length) {
            const folders = this.getAccountInfo(submissionPart.accountId, generic_account_props_enum_1.GenericAccountProp.FOLDERS);
            options.tiers.forEach(tier => {
                if (!website_validator_util_1.default.folderIdExists(tier, folders)) {
                    problems.push(`Access Tier (${tier}) could not be found.`);
                }
            });
        }
        else {
            problems.push('Please pick an access tier.');
        }
        const files = [
            submission.primary,
            ...(submission.additional || []).filter(f => !f.ignoredAccounts.includes(submissionPart.accountId)),
        ];
        files.forEach(file => {
            const { type, size, name, mimetype } = file;
            const maxMB = 200;
            if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
                if (isAutoscaling &&
                    type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                    image_manipulator_1.default.isMimeType(mimetype)) {
                    warnings.push(`${name} will be scaled down to ${maxMB}MB`);
                }
                else {
                    problems.push(`Patreon limits ${mimetype} to ${maxMB}MB`);
                }
            }
        });
        return { problems, warnings };
    }
    validateNotificationSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const options = submissionPart.data;
        if (options.tiers && options.tiers.length) {
            const folders = this.getAccountInfo(submissionPart.accountId, generic_account_props_enum_1.GenericAccountProp.FOLDERS);
            options.tiers.forEach(tier => {
                if (!website_validator_util_1.default.folderIdExists(tier, folders)) {
                    problems.push(`Access Tier (${tier}) could not be found.`);
                }
            });
        }
        else {
            problems.push('Please pick an access tier.');
        }
        return { problems, warnings };
    }
};
Patreon = __decorate([
    (0, common_1.Injectable)()
], Patreon);
exports.Patreon = Patreon;
