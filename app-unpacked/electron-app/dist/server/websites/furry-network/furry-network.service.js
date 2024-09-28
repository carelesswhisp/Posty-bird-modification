"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FurryNetwork = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const markdown_parser_1 = require("../../description-parsing/markdown/markdown.parser");
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const http_util_1 = __importStar(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const post_data_interface_1 = require("../../submission/post/interfaces/post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const browser_window_util_1 = __importDefault(require("../../utils/browser-window.util"));
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const website_base_1 = require("../website.base");
const lodash_1 = __importDefault(require("lodash"));
let FurryNetwork = class FurryNetwork extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://furrynetwork.com';
        this.MAX_CHARS = undefined;
        this.refreshBeforePost = true;
        this.acceptsFiles = [
            'png',
            'jpeg',
            'jpg',
            'mp3',
            'mp4',
            'webm',
            'swf',
            'gif',
            'wav',
            'txt',
            'plain',
        ];
        this.defaultDescriptionParser = markdown_parser_1.MarkdownParser.parse;
        this.collections = ['artwork', 'story', 'multimedia', 'journals'];
        this.usernameShortcuts = [
            {
                key: 'fn',
                url: 'https://furrynetwork.com/$1',
            },
        ];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const ls = await browser_window_util_1.default.getLocalStorage(data._id, this.BASE_URL, 2500);
        if (ls.token && ls.user) {
            status.loggedIn = true;
            const token = JSON.parse(ls.token);
            const user = JSON.parse(ls.user);
            status.username = user.email;
            status.data = token;
            this.storeAccountInformation(data._id, 'user', user);
            try {
                await Promise.all(user.characters.map(character => this.loadCollections(data._id, token.access_token, character.name)));
            }
            catch (_a) { }
        }
        return status;
    }
    async loadCollections(profileId, token, character) {
        const collection = {
            [postybirb_commons_1.FileSubmissionType.IMAGE]: [],
            [postybirb_commons_1.FileSubmissionType.TEXT]: [],
            [postybirb_commons_1.FileSubmissionType.AUDIO]: [],
            [postybirb_commons_1.FileSubmissionType.VIDEO]: [],
            NOTIFICATION: [],
        };
        for (const collectionType of this.collections) {
            const res = await http_util_1.default.get(`${this.BASE_URL}/api/character/${character}/${collectionType}/collections`, profileId, {
                requestOptions: { json: true },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            switch (collectionType) {
                case 'artwork':
                    collection.IMAGE = res.body;
                    break;
                case 'story':
                    collection.TEXT = res.body;
                    break;
                case 'journals':
                    collection.NOTIFICATION = res.body;
                    break;
                case 'multimedia':
                    collection.VIDEO = res.body;
                    collection.AUDIO = res.body;
                    break;
            }
        }
        this.storeAccountInformation(profileId, `${character}-collections`, collection);
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(32) };
    }
    generateUploadUrl(character, file, type) {
        let uploadURL = '';
        if (type === 'story') {
            uploadURL = `${this.BASE_URL}/api/story`;
        }
        else {
            const size = file.value.length;
            const name = file.options.filename.replace('.', '');
            uploadURL =
                `${this.BASE_URL}/api/submission/${character}/${type}/upload?` +
                    'resumableChunkNumber=1' +
                    `&resumableChunkSize=${size}` +
                    `&resumableCurrentChunkSize=${size}&resumableTotalSize=${size}&resumableType=${file.options.contentType}&resumableIdentifier=${size}-${name}&resumableFilename=${name}&resumableRelativePath=${name}&resumableTotalChunks=1`;
        }
        return uploadURL;
    }
    generatePostData(data, type, file) {
        const { options } = data;
        if (type === 'story') {
            return {
                collections: options.folders || [],
                description: data.description || data.title,
                status: 'public',
                title: data.title,
                tags: this.formatTags(data.tags),
                rating: this.getRating(data.rating),
                community_tags_allowed: options.communityTags,
                content: file.value.toString(),
            };
        }
        else {
            return {
                collections: options.folders || [],
                description: data.description,
                status: 'public',
                title: data.title,
                tags: this.formatTags(data.tags),
                rating: this.getRating(data.rating),
                community_tags_allowed: options.communityTags,
                publish: true,
            };
        }
    }
    async postFileChunks(profileId, character, file, type, headers) {
        const chunkSize = 524288 / 2;
        const chunks = lodash_1.default.chunk(file.value, chunkSize);
        const fileType = encodeURIComponent(file.options.contentType);
        const responses = [];
        for (let i = 0; i < chunks.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const chunk = chunks[i];
            const upload = {
                value: Buffer.from(chunk),
                options: file.options,
            };
            const url = `${this.BASE_URL}/api/submission/${character}/${type}/upload?` +
                `resumableChunkNumber=${i + 1}` +
                `&resumableChunkSize=${chunkSize}` +
                `&resumableCurrentChunkSize=${chunk.length}&resumableTotalSize=${file.value.length}&resumableType=${fileType}&resumableIdentifier=${file.value.length}-${encodeURIComponent(file.options.filename.replace('.', ''))}&resumableFilename=${encodeURIComponent(file.options.filename)}&resumableRelativePath=${encodeURIComponent(file.options.filename)}&resumableTotalChunks=${chunks.length}`;
            const cmd = `
      var b64 = '${upload.value.toString('base64')}';
      var blob = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '${url}', false);
      xhr.setRequestHeader('Authorization', '${headers.Authorization}');
      xhr.setRequestHeader("Content-Type", "binary/octet-stream, application/json");
      xhr.send(blob);
      var body = xhr.response;
      return Object.assign({}, { body: body, status: xhr.status })`;
            const create = await browser_window_util_1.default.runScriptOnPage(profileId, `${this.BASE_URL}`, cmd);
            responses.push(create);
        }
        const { body } = responses.find(r => r.body);
        if (body.startsWith('<')) {
            throw this.createPostResponse({
                error: 'HTML response instead of json, check logs for additional info',
                additionalInfo: body,
            });
        }
        const res = JSON.parse(body || '{}');
        if (!res || !res.id) {
            throw this.createPostResponse({ error: 'unexpected response type.', additionalInfo: res });
        }
        return res;
    }
    async uploadThumbnail(uploadId, profileId, character, file, type, headers) {
        const url = `${this.BASE_URL}/api/submission/${character}/${type}/${uploadId}/thumbnail?` +
            'resumableChunkNumber=1' +
            `&resumableChunkSize=${file.value.length}` +
            `&resumableCurrentChunkSize=${file.value.length}
      &resumableTotalSize=${file.value.length}
      &resumableType=${encodeURIComponent(file.options.contentType)}
      &resumableIdentifier=${file.value.length}-${encodeURIComponent(file.options.filename).replace('.', '')}
      &resumableFilename=${encodeURIComponent(file.options.filename)}&resumableRelativePath=${encodeURIComponent(file.options.filename)}
      &resumableTotalChunks=1`;
        const cmd = `
      var b64 = '${file.value.toString('base64')}';
      var blob = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '${url}', false);
      xhr.setRequestHeader('Authorization', '${headers.Authorization}');
      xhr.setRequestHeader("Content-Type", "binary/octet-stream, application/json");
      xhr.send(blob);
      var body = xhr.response;
      return Object.assign({}, { body: body, status: xhr.status })`;
        return await browser_window_util_1.default.runScriptOnPage(profileId, `${this.BASE_URL}`, cmd);
    }
    async uploadJson(profileId, url, data, headers) {
        const cmd = `
      var data = ${JSON.stringify(data)};
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '${url}', false);
      xhr.setRequestHeader('Authorization', '${headers.Authorization}');
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify(data));
      var body = xhr.response;
      return Object.assign({}, { body: body, status: xhr.status })`;
        return await browser_window_util_1.default.runScriptOnPage(profileId, `${this.BASE_URL}`, cmd);
    }
    async postFileSubmission(cancellationToken, data, accountData) {
        const { options } = data;
        const type = this.getContentType(data.primary.type, data.primary.file.options.contentType === 'image/gif');
        let file = data.primary.file;
        if (data.primary.type === postybirb_commons_1.FileSubmissionType.TEXT) {
            if (!website_validator_util_1.default.supportsFileType(data.submission.primary, this.acceptsFiles)) {
                file = data.fallback;
            }
        }
        let character = options.profile;
        if (!character) {
            const user = this.getAccountInfo(data.part.accountId, 'user');
            character = user.characters[0].name;
        }
        const url = this.generateUploadUrl(character, file, type);
        const headers = { Authorization: `Bearer ${accountData.access_token}` };
        const form = this.generatePostData(data, type, file);
        if (type === 'story') {
            this.checkCancelled(cancellationToken);
            const post = await this.uploadJson(data.part.accountId, url, form, headers);
            const postBody = JSON.parse(post.body);
            if (postBody.id && post.status <= 303) {
                return this.createPostResponse({});
            }
            return Promise.reject(this.createPostResponse({ message: post.body, additionalInfo: post.body }));
        }
        else {
            this.checkCancelled(cancellationToken);
            const upload = await this.postFileChunks(data.part.accountId, character, file, type, headers);
            this.checkCancelled(cancellationToken);
            const post = await http_util_1.default.patch(`${this.BASE_URL}/api/${type}/${upload.id}`, data.part.accountId, {
                type: 'json',
                data: form,
                requestOptions: { json: true },
                headers,
            });
            this.verifyResponse(post);
            if (post.body.id) {
                if (type === 'multimedia' && data.thumbnail) {
                    try {
                        const thumb = await this.uploadThumbnail(upload.id, data.part.accountId, character, data.thumbnail, type, headers);
                    }
                    catch (err) {
                        console.error(err);
                    }
                }
                return this.createPostResponse({ source: `${this.BASE_URL}/${type}/${post.body.id}` });
            }
            return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
        }
    }
    async postNotificationSubmission(cancellationToken, data, accountData) {
        const form = {
            community_tags_allowed: false,
            collections: [],
            content: data.description,
            description: data.description.split('.')[0],
            rating: this.getRating(data.rating),
            title: data.title,
            subtitle: '',
            tags: this.formatTags(data.tags),
            status: 'public',
        };
        this.checkCancelled(cancellationToken);
        const post = await this.uploadJson(data.part.accountId, `${this.BASE_URL}/api/journal`, form, {
            Authorization: `Bearer ${accountData.access_token}`,
        });
        const postBody = JSON.parse(post.body);
        if (postBody.id && post.status <= 303) {
            return this.createPostResponse({});
        }
        return Promise.reject(this.createPostResponse({ message: post.body, additionalInfo: post.body }));
    }
    getContentType(type, isGIF) {
        if (type === postybirb_commons_1.FileSubmissionType.IMAGE && !isGIF)
            return 'artwork';
        if (type === postybirb_commons_1.FileSubmissionType.TEXT)
            return 'story';
        if (type === postybirb_commons_1.FileSubmissionType.VIDEO || type === postybirb_commons_1.FileSubmissionType.AUDIO || isGIF)
            return 'multimedia';
        return 'artwork';
    }
    getRating(rating) {
        switch (rating) {
            case postybirb_commons_1.SubmissionRating.MATURE:
                return 1;
            case postybirb_commons_1.SubmissionRating.ADULT:
            case postybirb_commons_1.SubmissionRating.EXTREME:
                return 2;
            case postybirb_commons_1.SubmissionRating.GENERAL:
            default:
                return 0;
        }
    }
    formatTags(tags) {
        return super
            .formatTags(tags, { spaceReplacer: '-', maxLength: 30, minLength: 3 })
            .map(tag => tag
            .replace(/(\(|\)|:|#|;|\]|\[|\.|')/g, '')
            .replace(/(\\|\/)/g, '-')
            .replace(/\?/g, 'unknown'))
            .filter(tag => tag.length >= 3)
            .slice(0, 30);
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        if (!submissionPart.data.profile) {
            warnings.push('Default profile will be used');
        }
        if (submissionPart.data.folders.length) {
            let type = submission.primary.type;
            if (submission.primary.mimetype === 'image/gif') {
                type = postybirb_commons_1.FileSubmissionType.VIDEO;
            }
            const collections = this.getAccountInfo(submissionPart.accountId, `${submissionPart.data.profile}-collections`);
            if (collections && collections[type]) {
                submissionPart.data.folders.forEach(f => {
                    const found = collections[type].find(c => c.id === f);
                    if (!found) {
                        problems.push(`Folder (${f}) not found.`);
                    }
                });
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
        const { type, size, name, mimetype } = submission.primary;
        let maxMB = 32;
        if (type === postybirb_commons_1.FileSubmissionType.VIDEO || mimetype === 'image/gif') {
            maxMB = 200;
        }
        if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
            if (isAutoscaling &&
                type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                image_manipulator_1.default.isMimeType(submission.primary.mimetype)) {
                warnings.push(`${name} will be scaled down to ${maxMB}MB`);
            }
            else {
                problems.push(`Furry Network limits ${submission.primary.mimetype} to ${maxMB}MB`);
            }
        }
        return { problems, warnings };
    }
    validateNotificationSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        if (!submissionPart.data.profile) {
            warnings.push('Default profile will be used');
        }
        if (submissionPart.data.folders.length) {
            const type = 'NOTIFICATION';
            const collections = this.getAccountInfo(submissionPart.accountId, `${submissionPart.data.profile}-collections`);
            if (collections && collections[type]) {
                submissionPart.data.folders.forEach(f => {
                    const found = collections[type].find(c => c.id === f);
                    if (!found) {
                        problems.push(`Folder (${f}) not found.`);
                    }
                });
            }
        }
        return { problems, warnings };
    }
};
FurryNetwork = __decorate([
    (0, common_1.Injectable)()
], FurryNetwork);
exports.FurryNetwork = FurryNetwork;
