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
exports.KoFi = void 0;
const common_1 = require("@nestjs/common");
const cheerio_1 = __importDefault(require("cheerio"));
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const plaintext_parser_1 = require("../../description-parsing/plaintext/plaintext.parser");
const http_util_1 = __importDefault(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const browser_window_util_1 = __importDefault(require("../../utils/browser-window.util"));
const html_parser_util_1 = __importDefault(require("../../utils/html-parser.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const generic_account_props_enum_1 = require("../generic/generic-account-props.enum");
const website_base_1 = require("../website.base");
const lodash_1 = __importDefault(require("lodash"));
let KoFi = class KoFi extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://ko-fi.com';
        this.MAX_CHARS = undefined;
        this.acceptsFiles = ['jpeg', 'jpg', 'png', 'gif'];
        this.acceptsAdditionalFiles = true;
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const body = await browser_window_util_1.default.getPage(data._id, `${this.BASE_URL}/settings`, true);
        if (!body.includes('btn-login')) {
            status.loggedIn = true;
            status.username = html_parser_util_1.default.getInputValue(body, 'DisplayName');
            this.storeAccountInformation(data._id, 'id', body.match(/pageId:\s'(.*?)'/)[1]);
            await this.getAlbums(body.match(/buttonId:\s'(.*?)'/)[1], data._id);
        }
        return status;
    }
    async getAlbums(id, partition) {
        const { body } = await http_util_1.default.get(`${this.BASE_URL}/${id}/gallery`, partition);
        const albums = [];
        const $ = cheerio_1.default.load(body);
        $('.hz-album-each').each((i, el) => {
            const $el = $(el);
            const label = $el.text().trim();
            if (label !== 'New') {
                albums.push({
                    label,
                    value: $el.children('a').attr('href').split('/').pop(),
                });
            }
        });
        this.storeAccountInformation(partition, generic_account_props_enum_1.GenericAccountProp.FOLDERS, albums);
    }
    getScalingOptions(file) {
        return undefined;
    }
    parseDescription(text) {
        return text;
    }
    postParseDescription(text, type) {
        return type === postybirb_commons_1.SubmissionType.FILE
            ? plaintext_parser_1.PlaintextParser.parse(text.replace('<p><a href="http://www.postybirb.com">Posted using PostyBirb</a></p>', 'Posted using PostyBirb'))
            : text;
    }
    async postFileSubmission(cancellationToken, data) {
        this.checkCancelled(cancellationToken);
        const imageUploadIds = [];
        let body = null;
        try {
            const filesToPost = [data.primary, ...data.additional].slice(0, 8);
            for (const fileRecord of filesToPost) {
                const upload = await http_util_1.default.post(`${this.BASE_URL}/api/media/gallery-item/upload?throwOnError=true`, data.part.accountId, {
                    type: 'multipart',
                    data: {
                        filenames: fileRecord.file.options.filename,
                        'file[0]': fileRecord.file,
                    },
                });
                body = upload.body;
                const json = JSON.parse(upload.body);
                imageUploadIds.push(json[0].ExternalId);
            }
        }
        catch (err) {
            return Promise.reject(this.createPostResponse({ message: err, additionalInfo: body }));
        }
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(`${this.BASE_URL}/Gallery/AddGalleryItem`, data.part.accountId, {
            type: 'json',
            data: {
                Album: data.options.album || '',
                Audience: data.options.audience,
                Description: data.description,
                EnableHiRes: data.options.hiRes || false,
                GalleryItemId: '',
                ImageUploadIds: imageUploadIds,
                PostToTwitter: false,
                ScheduleEnabled: false,
                Title: data.title,
                UploadAsIndividualImages: false,
            },
            requestOptions: { gzip: true },
            headers: {
                'Accept-Encoding': 'gzip, deflate, br',
                Accept: 'text/html, */*',
                Pragma: 'no-cache',
                'Cache-Control': 'no-cache',
                Referer: 'https://ko-fi.com/',
                Connection: 'keep-alive',
            },
        });
        const success = (typeof post.body === 'object' && post.body.success) ||
            (typeof post.body === 'string' && post.body.includes(JSON.stringify({ success: true })));
        if (!success) {
            return Promise.reject(this.createPostResponse({
                message: 'Post did not success',
                additionalInfo: post.body,
            }));
        }
        return this.createPostResponse({});
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        if (submissionPart.data.album) {
            const folders = lodash_1.default.get(this.accountInformation.get(submissionPart.accountId), generic_account_props_enum_1.GenericAccountProp.FOLDERS, []);
            if (!folders.find(f => f.value === submissionPart.data.album)) {
                warnings.push(`Folder (${submissionPart.data.album}) not found.`);
            }
        }
        const rating = submissionPart.data.rating || defaultPart.data.rating;
        if (rating !== postybirb_commons_1.SubmissionRating.GENERAL) {
            problems.push(`Does not support rating: ${rating}`);
        }
        if (!website_validator_util_1.default.supportsFileType(submission.primary, this.acceptsFiles)) {
            problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
        }
        return { problems, warnings };
    }
};
KoFi = __decorate([
    (0, common_1.Injectable)()
], KoFi);
exports.KoFi = KoFi;
