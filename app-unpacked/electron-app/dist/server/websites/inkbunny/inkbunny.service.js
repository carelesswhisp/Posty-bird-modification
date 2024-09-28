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
exports.Inkbunny = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const bbcode_parser_1 = require("../../description-parsing/bbcode/bbcode.parser");
const username_parser_1 = require("../../description-parsing/miscellaneous/username.parser");
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const http_util_1 = __importDefault(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const form_content_util_1 = __importDefault(require("../../utils/form-content.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const website_base_1 = require("../website.base");
let Inkbunny = class Inkbunny extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://inkbunny.net';
        this.MAX_CHARS = undefined;
        this.acceptsFiles = [
            'png',
            'jpeg',
            'jpg',
            'gif',
            'swf',
            'flv',
            'mp4',
            'doc',
            'rtf',
            'txt',
            'mp3',
        ];
        this.acceptsAdditionalFiles = true;
        this.defaultDescriptionParser = bbcode_parser_1.BBCodeParser.parse;
        this.usernameShortcuts = [
            {
                key: 'ib',
                url: 'https://inkbunny.net/$1',
            },
        ];
    }
    async checkLoginStatus(data) {
        var _a;
        const status = { loggedIn: false, username: null };
        const accountData = data.data;
        if (accountData && accountData.username && accountData.sid) {
            const authCheck = await http_util_1.default.post(`${this.BASE_URL}/api_watchlist.php`, data._id, {
                type: 'multipart',
                requestOptions: { json: true },
                data: {
                    sid: accountData.sid,
                    limit: 5,
                },
            });
            if (!((_a = authCheck.body) === null || _a === void 0 ? void 0 : _a.error_code)) {
                status.username = accountData.username;
                status.loggedIn = true;
            }
            if (!authCheck.body) {
                this.logger.log(`Inkbunny returned empty body: ${authCheck.response.statusCode}: ${authCheck.response.statusMessage} - ${authCheck.error}`);
            }
        }
        return status;
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(200) };
    }
    preparseDescription(text) {
        text = username_parser_1.UsernameParser.replaceText(text, 'fa', '[fa]$1[/fa]');
        text = username_parser_1.UsernameParser.replaceText(text, 'sf', '[sf]$1[/sf]');
        text = username_parser_1.UsernameParser.replaceText(text, 'da', '[da]$1[/da]');
        text = username_parser_1.UsernameParser.replaceText(text, 'ws', '[w]$1[/w]');
        text = username_parser_1.UsernameParser.replaceText(text, 'ib', '[iconname]$1[/iconname]');
        return text;
    }
    parseDescription(text) {
        text = super.parseDescription(text);
        return text.replace(/\[hr\]/g, '-----');
    }
    getRating(rating) {
        switch (rating) {
            case postybirb_commons_1.SubmissionRating.GENERAL:
                return '0';
            case postybirb_commons_1.SubmissionRating.MATURE:
                return '2';
            case postybirb_commons_1.SubmissionRating.ADULT:
            case postybirb_commons_1.SubmissionRating.EXTREME:
                return '4';
            default:
                return rating;
        }
    }
    async postFileSubmission(cancellationToken, data, accountData) {
        var _a, _b, _c;
        const form = {
            sid: accountData.sid,
            'uploadedfile[0]': data.primary.file,
        };
        if (data.thumbnail) {
            form['uploadedthumbnail[]'] = data.thumbnail;
        }
        data.additional.forEach((file, index) => {
            form[`uploadedfile[${index + 1}]`] = file.file;
        });
        this.checkCancelled(cancellationToken);
        const upload = await http_util_1.default.post(`${this.BASE_URL}/api_upload.php`, undefined, {
            skipCookies: true,
            requestOptions: { json: true },
            type: 'multipart',
            data: form,
        });
        if (!((_a = upload === null || upload === void 0 ? void 0 : upload.body) === null || _a === void 0 ? void 0 : _a.sid)) {
            return Promise.reject(this.createPostResponse({
                message: (_c = (_b = upload === null || upload === void 0 ? void 0 : upload.body) === null || _b === void 0 ? void 0 : _b.error_code) !== null && _c !== void 0 ? _c : upload === null || upload === void 0 ? void 0 : upload.body,
                additionalInfo: JSON.stringify(upload.body),
            }));
        }
        const editForm = {
            sid: accountData.sid,
            submission_id: upload.body.submission_id,
            title: data.title,
            desc: data.description,
            keywords: this.formatTags(data.tags).join(',').trim(),
        };
        const ratings = this.getRating(data.rating);
        if (ratings !== '0') {
            for (const rating of ratings.split(',')) {
                editForm[`tag[${rating}]`] = 'yes';
            }
        }
        const { options } = data;
        if (options.submissionType) {
            editForm.type = options.submissionType;
        }
        if (options.scraps) {
            editForm.scraps = 'yes';
        }
        if (!options.notify) {
            editForm.visibility = 'yes_nowatch';
        }
        else {
            editForm.visibility = 'yes';
        }
        if (options.blockGuests) {
            editForm.guest_block = 'yes';
        }
        if (options.friendsOnly) {
            editForm.friends_only = 'yes';
        }
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(`${this.BASE_URL}/api_editsubmission.php`, undefined, {
            type: 'multipart',
            data: editForm,
            skipCookies: true,
        });
        let json = null;
        try {
            json = JSON.parse(post.body);
        }
        catch (err) {
            return Promise.reject({ message: post.body, additionalInfo: post.body });
        }
        if (!json.submission_id || json.error_code !== undefined) {
            return Promise.reject(this.createPostResponse({
                message: json.error_code,
                additionalInfo: json.error_code,
            }));
        }
        return this.createPostResponse({ source: `${this.BASE_URL}/s/${json.submission_id}` });
    }
    parseTags(tags) {
        return tags.map(tag => {
            return tag.trim().replace(/\s/gm, '_').replace(/\\/gm, '/');
        });
    }
    transformAccountData(data) {
        return { username: data.username };
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        if (form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags).length < 4) {
            problems.push('Requires at least 4 tags.');
        }
        const files = [
            submission.primary,
            ...(submission.additional || []).filter(f => !f.ignoredAccounts.includes(submissionPart.accountId)),
        ];
        const maxMB = 200;
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
                    problems.push(`Inkbunny limits ${mimetype} to ${maxMB}MB`);
                }
            }
        });
        return { problems, warnings };
    }
};
Inkbunny = __decorate([
    (0, common_1.Injectable)()
], Inkbunny);
exports.Inkbunny = Inkbunny;
