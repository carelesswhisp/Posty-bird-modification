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
exports.Piczel = void 0;
const common_1 = require("@nestjs/common");
const lodash_1 = __importDefault(require("lodash"));
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const html_parser_1 = require("../../description-parsing/html/html.parser");
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const http_util_1 = __importDefault(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const login_response_interface_1 = require("../interfaces/login-response.interface");
const website_base_1 = require("../website.base");
const generic_account_props_enum_1 = require("../generic/generic-account-props.enum");
let Piczel = class Piczel extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://piczel.tv';
        this.MAX_CHARS = undefined;
        this.acceptsFiles = ['png', 'jpeg', 'jpg', 'gif'];
        this.acceptsAdditionalFiles = true;
        this.usernameShortcuts = [
            {
                key: 'pz',
                url: 'https://piczel.tv/gallery/$1',
            },
        ];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const res = await http_util_1.default.get(`${this.BASE_URL}/gallery/upload`, data._id);
        if (!res.body.includes('/signup')) {
            status.loggedIn = true;
            const preloadedData = JSON.parse(res.body.match(/<script type="text\/javascript">window\.__PRELOADED_STATE__ = (.*?)<\/script>/ms)[1]);
            status.username = preloadedData.currentUser.data.username;
            this.storeAccountInformation(data._id, 'data', preloadedData);
            this.getFolders(data._id, status.username);
        }
        return status;
    }
    async getFolders(profileId, username) {
        const res = await http_util_1.default.get(`${this.BASE_URL}/api/users/${username}/gallery/folders`, profileId, {
            requestOptions: { json: true },
        });
        const folders = res.body.map(f => ({
            value: f.id.toString(),
            label: f.name,
        }));
        this.storeAccountInformation(profileId, generic_account_props_enum_1.GenericAccountProp.FOLDERS, folders);
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(10) };
    }
    parseDescription(text) {
        text = text.replace(/<br(\/|\s\/){0,1}>/g, '\n');
        html_parser_1.HTMLFormatParser.BLOCKS.forEach(block => {
            text = text
                .replace(new RegExp(`</${block}>`, 'g'), '')
                .replace(new RegExp(`<${block}.*?>`, 'g'), '');
        });
        return text.replace(/<hr\s{0,1}\/{0,1}>/g, '------------');
    }
    async postFileSubmission(cancellationToken, data) {
        const form = {
            nsfw: data.rating !== postybirb_commons_1.SubmissionRating.GENERAL,
            description: data.description,
            title: data.title || 'New Submission',
            tags: this.formatTags(data.tags),
            files: [data.primary, ...data.additional]
                .filter(f => f)
                .map(f => ({
                name: f.file.options.filename,
                size: f.file.value.length,
                type: f.file.options.contentType,
                data: `data:${f.file.options.contentType};base64,${f.file.value.toString('base64')}`,
            })),
            uploadMode: 'PUBLISH',
            queue: false,
            publish_at: '',
            thumbnail_id: '0',
        };
        if (data.options.folder) {
            form.folder_id = data.options.folder;
        }
        const userData = this.getAccountInfo(data.part.accountId, 'data');
        const headers = {
            Accent: '*/*',
            client: userData.auth.client,
            expiry: userData.auth.expiry,
            'token-type': userData.auth['token-type'],
            uid: userData.auth.uid,
            Authorization: `${userData.auth['token-type']} ${userData.auth['access-token']}`,
            'access-token': userData.auth['access-token'],
        };
        this.checkCancelled(cancellationToken);
        const postResponse = await http_util_1.default.post(`${this.BASE_URL}/api/gallery`, data.part.accountId, {
            type: 'json',
            data: form,
            headers,
            requestOptions: { json: true },
        });
        this.verifyResponse(postResponse, 'Post');
        if (postResponse.body.id) {
            return this.createPostResponse({
                source: `${this.BASE_URL}/gallery/image/${postResponse.body.id}`,
            });
        }
        return Promise.reject(this.createPostResponse({ additionalInfo: postResponse.body }));
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
        const files = [
            submission.primary,
            ...(submission.additional || []).filter(f => !f.ignoredAccounts.includes(submissionPart.accountId)),
        ];
        const maxMB = 10;
        files.forEach(file => {
            const { type, size, name, mimetype } = file;
            if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
                if (!website_validator_util_1.default.supportsFileType(file, this.acceptsFiles)) {
                    problems.push(`Does not support file format: (${name}) ${mimetype}.`);
                }
                if (isAutoscaling &&
                    type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                    image_manipulator_1.default.isMimeType(mimetype)) {
                    warnings.push(`${name} will be scaled down to ${maxMB}MB`);
                }
                else {
                    problems.push(`Piczel limits ${mimetype} to ${maxMB}MB`);
                }
            }
        });
        return { problems, warnings };
    }
};
Piczel = __decorate([
    (0, common_1.Injectable)()
], Piczel);
exports.Piczel = Piczel;
