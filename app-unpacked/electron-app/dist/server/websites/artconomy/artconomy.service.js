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
exports.Artconomy = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const markdown_parser_1 = require("../../description-parsing/markdown/markdown.parser");
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const http_util_1 = __importStar(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const website_base_1 = require("../website.base");
const form_content_util_1 = __importDefault(require("../../utils/form-content.util"));
let Artconomy = class Artconomy extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://artconomy.com';
        this.MAX_CHARS = 2000;
        this.acceptsFiles = [
            'png',
            'jpeg',
            'jpg',
            'gif',
            'mp4',
            'doc',
            'rtf',
            'txt',
            'mp3',
        ];
        this.defaultDescriptionParser = markdown_parser_1.MarkdownParser.parse;
        this.usernameShortcuts = [
            {
                key: 'ac',
                url: 'https://artconomy.com/profile/$1/about',
            },
        ];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const authCheck = await http_util_1.default.get(`${this.BASE_URL}/api/profiles/data/requester/`, data._id, {
            requestOptions: {
                json: true,
            },
        });
        if (authCheck.response.statusCode === 200 && authCheck.response.body.username !== '_') {
            this.storeAccountInformation(data._id, 'id', authCheck.response.body.id);
            this.storeAccountInformation(data._id, 'username', authCheck.response.body.username);
            const token = (await http_util_1.default.getWebsiteCookies(data._id, this.BASE_URL))
                .filter(c => c.name === 'csrftoken')
                .shift().value;
            this.storeAccountInformation(data._id, 'csrfToken', token);
            status.username = authCheck.response.body.username;
            status.loggedIn = true;
        }
        return status;
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(200) };
    }
    getRating(rating) {
        switch (rating) {
            case postybirb_commons_1.SubmissionRating.GENERAL:
                return 0;
            case postybirb_commons_1.SubmissionRating.MATURE:
                return 1;
            case postybirb_commons_1.SubmissionRating.ADULT:
                return 2;
            case postybirb_commons_1.SubmissionRating.EXTREME:
                return 3;
            default:
                return 2;
        }
    }
    async checkAssetUpload(upload) {
        if (!upload.body.id) {
            return Promise.reject(this.createPostResponse({
                message: upload.response.statusMessage,
                additionalInfo: JSON.stringify(upload.body),
            }));
        }
    }
    async postFileSubmission(cancellationToken, data) {
        const primaryAssetForm = {
            'files[]': data.primary.file,
        };
        const id = this.getAccountInfo(data.part.accountId, 'id');
        const username = this.getAccountInfo(data.part.accountId, 'username');
        const thumbnailAssetForm = {
            'files[]': data.thumbnail,
        };
        const options = this.requestOptions(data);
        this.checkCancelled(cancellationToken);
        let upload = await http_util_1.default.post(`${this.BASE_URL}/api/lib/asset/`, data.part.accountId, Object.assign(Object.assign({}, options), { type: 'multipart', data: primaryAssetForm }));
        await this.checkAssetUpload(upload);
        const primaryAsset = upload.body.id;
        let thumbnailAsset = null;
        if (data.thumbnail) {
            upload = await http_util_1.default.post(`${this.BASE_URL}/api/lib/asset/`, data.part.accountId, Object.assign(Object.assign({}, options), { type: 'multipart', data: thumbnailAssetForm }));
            await this.checkAssetUpload(upload);
            thumbnailAsset = upload.body.id;
        }
        const editForm = {
            file: primaryAsset,
            preview: thumbnailAsset,
            title: data.title,
            caption: data.description,
            tags: this.formatTags(data.tags),
            rating: this.getRating(data.rating),
            private: data.options.private,
            comments_disabled: data.options.commentsDisabled,
            artists: [],
        };
        if (data.options.isArtist) {
            editForm.artists.push(id);
        }
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(`${this.BASE_URL}/api/profiles/account/${username}/submissions/`, data.part.accountId, Object.assign(Object.assign({}, options), { type: 'json', data: editForm }));
        await this.checkAssetUpload(post);
        return this.createPostResponse({ source: `${this.BASE_URL}/submissions/${post.body.id}` });
    }
    requestOptions(data) {
        const csrfToken = this.getAccountInfo(data.part.accountId, 'csrfToken');
        return {
            headers: {
                'X-CSRFTOKEN': `${csrfToken}`,
                Referer: this.BASE_URL,
            },
            requestOptions: {
                json: true,
            },
        };
    }
    async postNotificationSubmission(cancellationToken, data) {
        const username = this.getAccountInfo(data.part.accountId, 'username');
        const options = this.requestOptions(data);
        const journal = {
            subject: data.title,
            body: data.description,
        };
        this.checkCancelled(cancellationToken);
        const postResponse = await http_util_1.default.post(`${this.BASE_URL}/api/profiles/account/${username}/journals/`, data.part.accountId, Object.assign(Object.assign({}, options), { data: journal }));
        this.verifyResponse(postResponse);
        return this.createPostResponse({
            source: `${this.BASE_URL}/profile/${username}/journals/${postResponse.body.id}`,
        });
    }
    parseTags(tags) {
        return tags.map(tag => {
            return tag.trim().replace(/\s/gm, '_');
        });
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        const files = [
            submission.primary,
            ...(submission.additional || []).filter(f => !f.ignoredAccounts.includes(submissionPart.accountId)),
        ];
        const tags = [...submissionPart.data.tags.value];
        if (submissionPart.data.tags.extendDefault) {
            tags.push(...defaultPart.data.tags.value);
        }
        if (tags.length < 5) {
            problems.push('You must have at least 5 tags. Think about the following: ' +
                'sex/gender (required, if character), ' +
                'species, genre, subject matter, ' +
                'focus of the piece, location, pose/position, art style, ' +
                'clothing/accessories, ' +
                'relationships depicted');
        }
        const description = this.defaultDescriptionParser(form_content_util_1.default.getDescription(defaultPart.data.description, submissionPart.data.description));
        if (description.length > this.MAX_CHARS) {
            problems.push('Description must be 2000 characters or fewer.');
        }
        const maxMB = 49;
        files.forEach(file => {
            const { type, size, name, mimetype } = file;
            if (!website_validator_util_1.default.supportsFileType(file, this.acceptsFiles)) {
                problems.push(`Does not support file format: (${name}) ${mimetype}.`);
            }
            if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
                if (isAutoscaling &&
                    type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                    image_manipulator_1.default.isMimeType(mimetype)) {
                    warnings.push(`${name} will be scaled down to ${maxMB}MB`);
                }
                else {
                    problems.push(`Artconomy limits ${mimetype} to ${maxMB}MB`);
                }
            }
        });
        return { problems, warnings };
    }
};
Artconomy = __decorate([
    (0, common_1.Injectable)()
], Artconomy);
exports.Artconomy = Artconomy;
