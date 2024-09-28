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
exports.DeviantArt = void 0;
const common_1 = require("@nestjs/common");
const lodash_1 = __importDefault(require("lodash"));
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
const form_content_util_1 = __importDefault(require("../../utils/form-content.util"));
const http_experimental_1 = require("../../utils/http-experimental");
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const generic_account_props_enum_1 = require("../generic/generic-account-props.enum");
const website_base_1 = require("../website.base");
let DeviantArt = class DeviantArt extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://www.deviantart.com';
        this.MAX_CHARS = undefined;
        this.acceptsFiles = [
            'jpeg',
            'jpg',
            'png',
            'bmp',
            'flv',
            'txt',
            'rtf',
            'odt',
            'swf',
            'tiff',
            'tif',
            'gif',
        ];
        this.usernameShortcuts = [
            {
                key: 'da',
                url: 'https://deviantart.com/$1',
            },
        ];
        this.MAX_TAGS = 30;
        this.titleLimit = 50;
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const res = await http_experimental_1.HttpExperimental.get(this.BASE_URL, { partition: data._id });
        const cookies = await http_util_1.default.getWebsiteCookies(data._id, this.BASE_URL);
        const userInfoCookie = cookies.find(c => c.name === 'userinfo');
        if (userInfoCookie) {
            status.loggedIn = true;
            status.username = JSON.parse(decodeURIComponent(userInfoCookie.value).split(';')[1]).username;
            await this.getFolders(data._id, status.username);
        }
        return status;
    }
    async getFolders(profileId, username) {
        try {
            const csrf = await this.getCSRF(profileId);
            const res = await http_experimental_1.HttpExperimental.get(`${this.BASE_URL}/_puppy/dashared/gallection/folders?offset=0&limit=250&type=gallery&with_all_folder=true&with_permissions=true&username=${encodeURIComponent(username)}&da_minor_version=20230710&csrf_token=${csrf}`, { partition: profileId });
            const folders = [];
            res.body.results.forEach((f) => {
                const { parentId } = f;
                let label = f.name;
                if (parentId) {
                    const parent = folders.find(r => r.value === parentId);
                    if (parent) {
                        label = `${parent.label} / ${label}`;
                    }
                }
                folders.push({ value: f.folderId, label });
            });
            this.storeAccountInformation(profileId, generic_account_props_enum_1.GenericAccountProp.FOLDERS, folders);
        }
        catch (e) {
            console.error(e);
        }
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(30) };
    }
    formatTags(tags) {
        tags = super.parseTags(tags);
        if (tags.length > this.MAX_TAGS) {
            return tags.slice(0, this.MAX_TAGS - 1);
        }
        else
            return tags;
    }
    async getCSRF(profileId) {
        var _a;
        const url = await http_experimental_1.HttpExperimental.get(this.BASE_URL, { partition: profileId });
        return (_a = url.body.match(/window.__CSRF_TOKEN__ = '(.*)'/)) === null || _a === void 0 ? void 0 : _a[1];
    }
    async postFileSubmission(cancellationToken, data, accountData) {
        var _a, _b, _c, _d;
        const fileUpload = await http_experimental_1.HttpExperimental.post(`${this.BASE_URL}/_puppy/dashared/deviation/submit/upload/deviation`, {
            partition: data.part.accountId,
            type: 'multipart',
            data: {
                upload_file: data.primary.file,
                use_defaults: 'true',
                folder_name: 'Saved Submissions',
                da_minor_version: '20230710',
                csrf_token: await this.getCSRF(data.part.accountId),
            },
        });
        if (fileUpload.body.status !== 'success') {
            return Promise.reject(this.createPostResponse({
                additionalInfo: fileUpload.body,
                message: 'Failed to upload file.',
            }));
        }
        this.checkCancelled(cancellationToken);
        const mature = data.options.isMature ||
            data.rating === postybirb_commons_1.SubmissionRating.ADULT ||
            data.rating === postybirb_commons_1.SubmissionRating.MATURE ||
            data.rating === postybirb_commons_1.SubmissionRating.EXTREME;
        const description = await browser_window_util_1.default.runScriptOnPage(data.part.accountId, this.BASE_URL, `
        var blocksFromHTML = Draft.convertFromHTML(\`${data.description.replace(/`/g, '&#96;') || '<div></div>'}\`);
        var x = Draft.ContentState.createFromBlockArray(
            blocksFromHTML.contentBlocks,
            blocksFromHTML.entityMap,
          )
        return JSON.stringify(Draft.convertToRaw(x))
      `);
        const updateBody = {
            allow_comments: data.options.disableComments ? false : true,
            allow_free_download: data.options.freeDownload ? true : false,
            deviationid: fileUpload.body.deviationId,
            da_minor_version: 20230710,
            display_resolution: 0,
            editorRaw: description,
            editor_v3: '',
            galleryids: data.options.folders,
            is_ai_generated: (_a = data.options.isAIGenerated) !== null && _a !== void 0 ? _a : false,
            is_scrap: data.options.scraps,
            license_options: {
                creative_commons: (_b = data.options.isCreativeCommons) !== null && _b !== void 0 ? _b : false,
                commercial: (_c = data.options.isCommercialUse) !== null && _c !== void 0 ? _c : false,
                modify: data.options.allowModifications || 'no',
            },
            location_tag: null,
            noai: (_d = data.options.noAI) !== null && _d !== void 0 ? _d : true,
            subject_tag_types: '_empty',
            subject_tags: '_empty',
            tags: this.formatTags(data.tags),
            tierids: '_empty',
            title: this.truncateTitle(data.title).title,
            csrf_token: await this.getCSRF(data.part.accountId),
        };
        if (data.options.freeDownload) {
            updateBody.pcp_price_points = 0;
        }
        if (mature) {
            updateBody.is_mature = true;
        }
        if (data.options.folders.length === 0) {
            const folders = this.getAccountInfo(data.part.accountId, generic_account_props_enum_1.GenericAccountProp.FOLDERS) || [];
            const featured = folders.find(f => f.label === 'Featured');
            if (featured) {
                updateBody.galleryids = [`${featured.value}`];
            }
        }
        const update = await http_util_1.default.post(`${this.BASE_URL}/_napi/shared_api/deviation/update`, data.part.accountId, {
            type: 'json',
            data: updateBody,
            requestOptions: { json: true },
        });
        this.checkCancelled(cancellationToken);
        if (update.body.status !== 'success') {
            return Promise.reject(this.createPostResponse({
                additionalInfo: update.body,
                message: 'Failed to update file post.',
            }));
        }
        const publish = await http_experimental_1.HttpExperimental.post(`${this.BASE_URL}/_puppy/dashared/deviation/publish`, {
            partition: data.part.accountId,
            type: 'json',
            data: {
                stashid: fileUpload.body.deviationId,
                da_minor_version: 20230710,
                csrf_token: await this.getCSRF(data.part.accountId),
            },
        });
        if (publish.body.status !== 'success') {
            return Promise.reject(this.createPostResponse({
                additionalInfo: publish.body,
                message: 'Failed to publish post.',
            }));
        }
        return this.createPostResponse({ source: publish.body.url });
    }
    async postNotificationSubmission(cancellationToken, data, accountData) {
        var _a, _b;
        this.checkCancelled(cancellationToken);
        const description = await browser_window_util_1.default.runScriptOnPage(data.part.accountId, this.BASE_URL, `
        var blocksFromHTML = Draft.convertFromHTML(\`${data.description.replace(/`/g, '&#96;') || '<div></div>'}\`);
        var x = Draft.ContentState.createFromBlockArray(
            blocksFromHTML.contentBlocks,
            blocksFromHTML.entityMap,
          )
        return JSON.stringify(Draft.convertToRaw(x))
      `);
        const form = {
            csrf_token: await this.getCSRF(data.part.accountId),
            da_minor_version: 20230710,
            editorRaw: description,
            title: data.title,
        };
        const create = await http_experimental_1.HttpExperimental.post(`${this.BASE_URL}/_napi/shared_api/journal/create`, {
            partition: data.part.accountId,
            type: 'json',
            data: form,
        });
        if (!((_a = create.body.deviation) === null || _a === void 0 ? void 0 : _a.deviationId)) {
            return Promise.reject(this.createPostResponse({
                additionalInfo: create.body,
                message: 'Failed to create post.',
            }));
        }
        const publish = await http_experimental_1.HttpExperimental.post(`${this.BASE_URL}/_puppy/dashared/journal/publish`, {
            partition: data.part.accountId,
            type: 'json',
            data: {
                deviationid: create.body.deviation.deviationId,
                da_minor_version: 20230710,
                csrf_token: await this.getCSRF(data.part.accountId),
                featured: true,
            },
        });
        if (!((_b = publish.body.deviation) === null || _b === void 0 ? void 0 : _b.deviationId)) {
            return Promise.reject(this.createPostResponse({
                additionalInfo: publish.body,
                message: 'Failed to publish post.',
            }));
        }
        return this.createPostResponse({ source: publish.body.deviation.url });
    }
    truncateTitle(title) {
        const newTitle = title.substring(0, this.titleLimit);
        return { title: newTitle, exceedsLimit: newTitle !== title };
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        const { title, exceedsLimit } = this.truncateTitle(submissionPart.data.title || defaultPart.data.title || submission.title);
        if (exceedsLimit) {
            warnings.push(`Title will be truncated to ${this.titleLimit} characters: ${title}`);
        }
        if (submissionPart.data.folders && submissionPart.data.folders.length) {
            const folders = lodash_1.default.get(this.accountInformation.get(submissionPart.accountId), generic_account_props_enum_1.GenericAccountProp.FOLDERS, []);
            submissionPart.data.folders.forEach(f => {
                if (!website_validator_util_1.default.folderIdExists(f, folders)) {
                    warnings.push(`Folder (${f}) not found.`);
                }
            });
        }
        if (form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags).length > this.MAX_TAGS) {
            problems.push(`Tags will be limited to ${this.MAX_TAGS}.`);
        }
        const rating = submissionPart.data.rating || defaultPart.data.rating;
        if ((rating && rating === postybirb_commons_1.SubmissionRating.EXTREME) || rating === postybirb_commons_1.SubmissionRating.ADULT) {
            problems.push(`${rating} rating may violate website guidelines.`);
        }
        if (!website_validator_util_1.default.supportsFileType(submission.primary, this.acceptsFiles)) {
            problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
        }
        const { type, size, name } = submission.primary;
        let maxMB = 30;
        if (type === postybirb_commons_1.FileSubmissionType.VIDEO) {
            maxMB = 200;
        }
        if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
            if (isAutoscaling &&
                type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                image_manipulator_1.default.isMimeType(submission.primary.mimetype)) {
                warnings.push(`${name} will be scaled down to ${maxMB}MB`);
            }
            else {
                problems.push(`Deviant Art limits ${submission.primary.mimetype} to ${maxMB}MB`);
            }
        }
        return { problems, warnings };
    }
};
DeviantArt = __decorate([
    (0, common_1.Injectable)()
], DeviantArt);
exports.DeviantArt = DeviantArt;
