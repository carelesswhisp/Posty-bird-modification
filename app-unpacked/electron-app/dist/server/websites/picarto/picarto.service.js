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
exports.Picarto = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const plaintext_parser_1 = require("../../description-parsing/plaintext/plaintext.parser");
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const http_util_1 = __importDefault(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const browser_window_util_1 = __importDefault(require("../../utils/browser-window.util"));
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const generic_account_props_enum_1 = require("../generic/generic-account-props.enum");
const website_base_1 = require("../website.base");
let Picarto = class Picarto extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://picarto.tv';
        this.acceptsFiles = ['jpeg', 'jpg', 'png', 'gif'];
        this.MAX_CHARS = undefined;
        this.acceptsAdditionalFiles = true;
        this.refreshBeforePost = true;
        this.defaultDescriptionParser = plaintext_parser_1.PlaintextParser.parse;
        this.usernameShortcuts = [
            {
                key: 'ptv',
                url: 'https://picarto.tv/$1',
            },
        ];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const ls = await browser_window_util_1.default.getLocalStorage(data._id, this.BASE_URL, 3000);
        if (!ls.auth) {
            return status;
        }
        const auth = JSON.parse(ls.auth);
        this.storeAccountInformation(data._id, 'auth_token', auth.access_token);
        this.storeAccountInformation(data._id, 'channelId', auth.user.channel.id);
        this.storeAccountInformation(data._id, 'username', auth.user.username);
        status.loggedIn = true;
        status.username = auth.user.username;
        await this.getAlbums(data._id, auth.access_token);
        return status;
    }
    async getAlbums(id, accessToken) {
        const res = await http_util_1.default.post('https://ptvintern.picarto.tv/ptvapi', id, {
            type: 'json',
            data: {
                query: '{\n  albums {\n    id\n    title\n    cover\n    artworks {\n      id\n      thumbnail_image {\n        name\n        __typename\n      }\n      __typename\n    }\n    default\n    pieces\n    __typename\n  }\n  listContest {\n    id\n    name: event_name\n    cover\n    __typename\n  }\n}\n',
                variables: {},
            },
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            requestOptions: {
                json: true,
            },
        });
        const { data } = res.body;
        const { albums } = data;
        const folders = albums.map(album => ({ value: album.id, label: album.title }));
        this.storeAccountInformation(id, generic_account_props_enum_1.GenericAccountProp.FOLDERS, folders);
    }
    getScalingOptions(file) {
        return {
            maxHeight: 3840,
            maxWidth: 2160,
            maxSize: filesize_util_1.default.MBtoBytes(15)
        };
    }
    getRating(rating) {
        switch (rating) {
            case postybirb_commons_1.SubmissionRating.GENERAL:
                return 'SFW';
            case postybirb_commons_1.SubmissionRating.MATURE:
                return 'ECCHI';
            case postybirb_commons_1.SubmissionRating.ADULT:
            case postybirb_commons_1.SubmissionRating.EXTREME:
                return 'NSFW';
        }
    }
    async postFileSubmission(cancellationToken, data, accountData) {
        var _a, _b, _c, _d, _e, _f, _g;
        const authToken = this.getAccountInfo(data.part.accountId, 'auth_token');
        const channelId = this.getAccountInfo(data.part.accountId, 'channelId');
        const authRes = await http_util_1.default.post('https://ptvintern.picarto.tv/ptvapi', undefined, {
            type: 'json',
            data: {
                operationName: 'generateToken',
                query: 'query generateToken($channelId: Int, $channelName: String, $userId: Int) {\n  generateJwtToken(\n    channel_id: $channelId\n    channel_name: $channelName\n    user_id: $userId\n  ) {\n    key\n    __typename\n  }\n}',
                variables: {
                    channelId: channelId,
                },
            },
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            requestOptions: {
                json: true,
            },
        });
        this.verifyResponse(authRes, 'Auth get');
        this.checkCancelled(cancellationToken);
        const uploadRes = await http_util_1.default.post(`https://picarto.tv/images/_upload`, undefined, {
            type: 'multipart',
            data: {
                file_name: data.primary.file,
                channel_id: channelId.toString(),
            },
            headers: {
                Authorization: `Bearer ${authRes.body.data.generateJwtToken.key}`,
            },
            requestOptions: {
                json: true,
            },
        });
        this.verifyResponse(uploadRes, 'File upload');
        const variations = (await Promise.all(data.additional.slice(0, 4).map(({ file }) => {
            return http_util_1.default.post(`https://picarto.tv/images/_upload`, undefined, {
                type: 'multipart',
                data: {
                    file_name: file,
                    channel_id: channelId.toString(),
                },
                headers: {
                    Authorization: `Bearer ${authRes.body.data.generateJwtToken.key}`,
                },
                requestOptions: {
                    json: true,
                },
            });
        }))).map(res => res.body.data.uid);
        this.checkCancelled(cancellationToken);
        const finishPost = await http_util_1.default.post(`https://ptvintern.picarto.tv/ptvapi`, undefined, {
            type: 'json',
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
            requestOptions: {
                json: true,
            },
            data: {
                query: 'mutation ($input: CreateArtworkInput) {\n  createArtwork(input: $input) {\n    status\n    message\n    data\n    __typename\n  }\n}',
                variables: {
                    input: {
                        album_id: data.options.folder || null,
                        category: data.options.category || 'Creative',
                        comment_setting: data.options.comments,
                        description: Buffer.from(data.description).toString('base64'),
                        download_original: data.options.downloadSource,
                        main_image: uploadRes.body.data.uid,
                        rating: this.getRating(data.rating),
                        schedule_publishing_date: '',
                        schedule_publishing_time: '',
                        schedule_publishing_timezone: '',
                        software: data.options.softwares.join(','),
                        tags: this.formatTags(data.tags).join(','),
                        title: data.title,
                        variations: variations.join(','),
                        visibility: data.options.visibility,
                    },
                },
            },
        });
        this.verifyResponse(finishPost, 'Finish upload');
        if (((_c = (_b = (_a = finishPost.body) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.createArtwork) === null || _c === void 0 ? void 0 : _c.status) === 'error' ||
            ((_d = finishPost.body.errors) === null || _d === void 0 ? void 0 : _d.length)) {
            return Promise.reject(this.createPostResponse({
                message: (_g = (_f = (_e = finishPost.body) === null || _e === void 0 ? void 0 : _e.data) === null || _f === void 0 ? void 0 : _f.createArtwork) === null || _g === void 0 ? void 0 : _g.message,
                additionalInfo: finishPost.body,
            }));
        }
        return this.createPostResponse({});
    }
    formatTags(tags) {
        return super
            .formatTags(tags, { spaceReplacer: '_', maxLength: 30, minLength: 1 })
            .filter(tag => tag.length >= 1)
            .slice(0, 30);
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        if (!website_validator_util_1.default.supportsFileType(submission.primary, this.acceptsFiles)) {
            problems.push(`Currently supported file formats: ${this.acceptsFiles.join(', ')}`);
        }
        const { type, size, name } = submission.primary;
        if (filesize_util_1.default.MBtoBytes(15) < size) {
            if (isAutoscaling &&
                type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                image_manipulator_1.default.isMimeType(submission.primary.mimetype)) {
                warnings.push(`${name} will be scaled down to ${15}MB`);
            }
            else {
                problems.push(`Picarto limits ${submission.primary.mimetype} to ${15}MB`);
            }
        }
        return { problems, warnings };
    }
};
Picarto = __decorate([
    (0, common_1.Injectable)()
], Picarto);
exports.Picarto = Picarto;
