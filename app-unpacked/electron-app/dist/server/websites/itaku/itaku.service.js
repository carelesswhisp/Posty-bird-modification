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
exports.Itaku = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const plaintext_parser_1 = require("../../description-parsing/plaintext/plaintext.parser");
const http_util_1 = __importDefault(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const post_data_interface_1 = require("../../submission/post/interfaces/post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const browser_window_util_1 = __importDefault(require("../../utils/browser-window.util"));
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const form_content_util_1 = __importDefault(require("../../utils/form-content.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const generic_account_props_enum_1 = require("../generic/generic-account-props.enum");
const website_base_1 = require("../website.base");
let Itaku = class Itaku extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://itaku.ee';
        this.MAX_CHARS = 5000;
        this.acceptsFiles = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm'];
        this.acceptsAdditionalFiles = true;
        this.defaultDescriptionParser = plaintext_parser_1.PlaintextParser.parse;
        this.usernameShortcuts = [
            {
                key: 'it',
                url: 'https://itaku.ee/profile/$1',
            },
        ];
    }
    async checkLoginStatus(data) {
        var _a;
        const status = { loggedIn: false, username: null };
        const ls = await browser_window_util_1.default.getLocalStorage(data._id, this.BASE_URL);
        if (!ls.token) {
            return status;
        }
        this.storeAccountInformation(data._id, 'token', ls.token.replace(/"/g, ''));
        const res = await http_util_1.default.get(`${this.BASE_URL}/api/auth/user/`, data._id, {
            requestOptions: { json: true },
            headers: {
                Authorization: `Token ${this.getAccountInfo(data._id, 'token')}`,
            },
        });
        const login = (_a = res.body.profile) === null || _a === void 0 ? void 0 : _a.displayname;
        if (login) {
            status.loggedIn = true;
            status.username = login;
            this.storeAccountInformation(data._id, 'owner', res.body.profile.owner);
            await this.retrieveFolders(data._id, res.body.profile.owner);
        }
        return status;
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(file.type === postybirb_commons_1.FileSubmissionType.IMAGE ? 10 : 500) };
    }
    async retrieveFolders(id, ownerId) {
        const postFolderRes = await http_util_1.default.get(`${this.BASE_URL}/api/post_folders/?owner=${ownerId}`, id, {
            requestOptions: { json: true },
            headers: {
                Authorization: `Token ${this.getAccountInfo(id, 'token')}`,
            },
        });
        const postFolders = postFolderRes.body.map(f => ({
            value: f.title,
            label: f.title,
        }));
        this.storeAccountInformation(id, `POST-${generic_account_props_enum_1.GenericAccountProp.FOLDERS}`, postFolders);
        const galleryFolderRes = await http_util_1.default.get(`${this.BASE_URL}/api/galleries/?owner=${ownerId}&page_size=300`, id, {
            requestOptions: { json: true },
            headers: {
                Authorization: `Token ${this.getAccountInfo(id, 'token')}`,
            },
        });
        const galleryFolders = galleryFolderRes.body.results.map(f => ({
            value: f.title,
            label: f.title,
        }));
        this.storeAccountInformation(id, `GALLERY-${generic_account_props_enum_1.GenericAccountProp.FOLDERS}`, galleryFolders);
    }
    convertRating(rating) {
        switch (rating) {
            case postybirb_commons_1.SubmissionRating.GENERAL:
                return 'SFW';
            case postybirb_commons_1.SubmissionRating.MATURE:
                return 'Questionable';
            case postybirb_commons_1.SubmissionRating.ADULT:
            case postybirb_commons_1.SubmissionRating.EXTREME:
                return 'NSFW';
        }
    }
    async postFileSubmission(cancellationToken, data, accountData) {
        const files = [data.primary, ...data.additional];
        const haveMultipleFiles = files.length > 1;
        const imageIds = [];
        for (const file of files) {
            this.checkCancelled(cancellationToken);
            const body = await this.postImage(data, file, haveMultipleFiles);
            if (body.id) {
                imageIds.push(body.id);
            }
            else {
                return Promise.reject(this.createPostResponse({ additionalInfo: body }));
            }
        }
        if (haveMultipleFiles) {
            return this.makePost(data, imageIds);
        }
        else {
            return this.createPostResponse({
                source: `${this.BASE_URL}/images/${imageIds[0]}`,
            });
        }
    }
    async postImage(data, fileRecord, haveMultipleFiles) {
        const postData = {
            title: data.title,
            description: data.description,
            sections: JSON.stringify(data.options.folders),
            maturity_rating: this.convertRating(data.rating),
            tags: JSON.stringify(data.tags.map(tag => ({ name: tag.substring(0, 59) }))),
            visibility: data.options.visibility,
        };
        if (!haveMultipleFiles && data.options.shareOnFeed) {
            postData.add_to_feed = 'true';
        }
        if (data.spoilerText) {
            postData.content_warning = data.spoilerText;
        }
        if (fileRecord.type === postybirb_commons_1.FileSubmissionType.IMAGE) {
            postData.image = fileRecord.file;
        }
        else {
            postData.video = fileRecord.file;
        }
        const post = await http_util_1.default.post(`${this.BASE_URL}/api/galleries/${data.primary.type === postybirb_commons_1.FileSubmissionType.IMAGE ? 'images' : 'videos'}/`, data.part.accountId, {
            type: 'multipart',
            data: postData,
            headers: {
                Authorization: `Token ${this.getAccountInfo(data.part.accountId, 'token')}`,
            },
            requestOptions: {
                json: true,
            },
        });
        this.verifyResponse(post);
        return post.body;
    }
    async postNotificationSubmission(cancellationToken, data, accountData) {
        this.checkCancelled(cancellationToken);
        return this.makePost(data, []);
    }
    async makePost(data, imageIds) {
        const postData = {
            title: data.title,
            content: data.description,
            folders: data.options.folders,
            gallery_images: imageIds,
            maturity_rating: this.convertRating(data.rating),
            tags: data.tags.map(tag => ({ name: tag.substring(0, 59) })),
            visibility: data.options.visibility,
        };
        if (data.options.spoilerText) {
            postData.content_warning = data.options.spoilerText;
        }
        const post = await http_util_1.default.post(`${this.BASE_URL}/api/posts/`, data.part.accountId, {
            type: 'json',
            data: postData,
            headers: {
                Authorization: `Token ${this.getAccountInfo(data.part.accountId, 'token')}`,
            },
            requestOptions: {
                json: true,
            },
        });
        this.verifyResponse(post);
        if (!post.body.id) {
            return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
        }
        return this.createPostResponse({ source: `${this.BASE_URL}/posts/${post.body.id}` });
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        var _a;
        const problems = [];
        const warnings = [];
        const description = this.defaultDescriptionParser(form_content_util_1.default.getDescription(defaultPart.data.description, submissionPart.data.description));
        if (description.length > this.MAX_CHARS) {
            problems.push(`Max description length allowed is 5000 characters.`);
        }
        if (form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 5) {
            problems.push('Requires at least 5 tags.');
        }
        const { type, size, name } = submission.primary;
        if (!website_validator_util_1.default.supportsFileType(submission.primary, this.acceptsFiles)) {
            problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
        }
        if (type === postybirb_commons_1.FileSubmissionType.IMAGE && filesize_util_1.default.MBtoBytes(10) < size) {
            warnings.push(`${name} will be scaled down to 10MB`);
        }
        else if (type === postybirb_commons_1.FileSubmissionType.VIDEO && filesize_util_1.default.MBtoBytes(500) < size) {
            problems.push(`Itaku limits ${submission.primary.mimetype} to 500MB`);
        }
        if (((_a = submission.additional) === null || _a === void 0 ? void 0 : _a.length) && !submissionPart.data.shareOnFeed) {
            problems.push(`Posting multiple images requires share on feed to be enabled`);
        }
        const spoilerText = form_content_util_1.default.getSpoilerText(defaultPart.data, submissionPart.data);
        if (spoilerText.length > 30) {
            problems.push(`Max content warning length allowed is 30 characters`);
        }
        return { problems, warnings };
    }
    validateNotificationSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const description = plaintext_parser_1.PlaintextParser.parse(form_content_util_1.default.getDescription(defaultPart.data.description, submissionPart.data.description), 23);
        if (!description) {
            problems.push('Description required');
        }
        if (description.length > this.MAX_CHARS) {
            problems.push(`Max description length allowed is 5000 characters.`);
        }
        return { problems, warnings };
    }
};
Itaku = __decorate([
    (0, common_1.Injectable)()
], Itaku);
exports.Itaku = Itaku;
