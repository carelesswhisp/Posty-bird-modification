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
exports.Aryion = void 0;
const common_1 = require("@nestjs/common");
const cheerio_1 = __importDefault(require("cheerio"));
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const username_parser_1 = require("../../description-parsing/miscellaneous/username.parser");
const bbcode_parser_1 = require("../../description-parsing/bbcode/bbcode.parser");
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const http_util_1 = __importDefault(require("../../http/http.util"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const generic_account_props_enum_1 = require("../generic/generic-account-props.enum");
const website_base_1 = require("../website.base");
let Aryion = class Aryion extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = 'https://aryion.com';
        this.MAX_CHARS = undefined;
        this.defaultDescriptionParser = bbcode_parser_1.BBCodeParser.parse;
        this.usernameShortcuts = [
            {
                key: 'ar',
                url: 'https://aryion.com/g4/user/$1',
            },
        ];
        this.acceptsFiles = [
            'jpg',
            'jpeg',
            'gif',
            'png',
            'doc',
            'docx',
            'xls',
            'xlsx',
            'swf',
            'vsd',
            'txt',
            'rtf',
            'avi',
            'mpg',
            'mpeg',
            'flv',
            'mp4',
        ];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const res = await http_util_1.default.get(`${this.BASE_URL}/g4/treeview.php`, data._id);
        if (res.body.includes('user-link') && !res.body.includes('Login to read messages')) {
            status.loggedIn = true;
            const $ = cheerio_1.default.load(res.body);
            status.username = $('.user-link').text();
            this.getFolders(data._id, $);
        }
        return status;
    }
    getFolders(profileId, $) {
        const folders = [];
        $('.treeview')
            .children()
            .each((i, e) => {
            const myTree = [];
            this.searchFolderTree($, e, myTree);
            folders.push(...myTree);
        });
        this.storeAccountInformation(profileId, generic_account_props_enum_1.GenericAccountProp.FOLDERS, folders);
    }
    searchFolderTree($, el, parent) {
        const me = {
            value: undefined,
            label: '',
        };
        $(el)
            .children()
            .each((i, n) => {
            const node = $(n);
            if (n.name === 'span') {
                me.value = node.attr('data-tid');
                me.label = node.text();
                parent.push(me);
            }
            else if (n.name === 'ul') {
                me.children = [];
                node.children().each((j, c) => this.searchFolderTree($, c, me.children));
            }
        });
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(20) };
    }
    preparseDescription(text) {
        return username_parser_1.UsernameParser.replaceText(text, 'ar', ':icon$1:');
    }
    async postFileSubmission(cancellationToken, data) {
        let postFile = data.primary.file;
        if (data.primary.type === postybirb_commons_1.FileSubmissionType.TEXT) {
            if (!website_validator_util_1.default.supportsFileType(data.submission.primary, this.acceptsFiles)) {
                postFile = data.fallback;
            }
        }
        const form = {
            action: 'new-item',
            parentid: data.options.folder,
            MAX_FILE_SIZE: '78643200',
            title: data.title,
            file: postFile,
            thumb: data.thumbnail,
            desc: data.description,
            tags: this.formatTags(data.tags)
                .filter(f => !f.match(/^vore$/i))
                .filter(f => !f.match(/^non-vore$/i))
                .join('\n'),
            'reqtag[]': data.options.requiredTag === '1' ? 'Non-Vore' : '',
            view_perm: data.options.viewPermissions,
            comment_perm: data.options.commentPermissions,
            tag_perm: data.options.tagPermissions,
            scrap: data.options.scraps ? 'on' : '',
        };
        this.checkCancelled(cancellationToken);
        const post = await http_util_1.default.post(`${this.BASE_URL}/g4/itemaction.php`, data.part.accountId, {
            type: 'multipart',
            data: form,
        });
        this.verifyResponse(post, 'Verify Post');
        try {
            const json = JSON.parse(post.body.replace(/(<textarea>|<\/textarea>)/g, ''));
            if (json.id) {
                return this.createPostResponse({ source: `${this.BASE_URL}${json.url}` });
            }
        }
        catch (err) { }
        return Promise.reject(this.createPostResponse({ additionalInfo: post.body }));
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        if (!submissionPart.data.folder || !submissionPart.data.folder.length) {
            problems.push('No folder selected.');
        }
        else {
            if (!website_validator_util_1.default.folderIdExists(submissionPart.data.folder.pop(), this.getAccountInfo(submissionPart.accountId, generic_account_props_enum_1.GenericAccountProp.FOLDERS))) {
                problems.push(`Folder (${submissionPart.data.folder}) not found.`);
            }
        }
        if (!submissionPart.data.requiredTag) {
            problems.push('No required tag selected.');
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
        const { type, size, name } = submission.primary;
        const maxMB = 20;
        if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
            if (isAutoscaling &&
                type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                image_manipulator_1.default.isMimeType(submission.primary.mimetype)) {
                warnings.push(`${name} will be scaled down to ${maxMB}MB`);
            }
            else {
                problems.push(`Aryion limits ${submission.primary.mimetype} to ${maxMB}MB`);
            }
        }
        return { problems, warnings };
    }
};
Aryion = __decorate([
    (0, common_1.Injectable)()
], Aryion);
exports.Aryion = Aryion;
