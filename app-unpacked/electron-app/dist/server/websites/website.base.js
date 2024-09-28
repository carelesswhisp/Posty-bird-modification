"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Website = void 0;
const common_1 = require("@nestjs/common");
const lodash_1 = __importDefault(require("lodash"));
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../account/models/user-account.entity"));
const html_parser_1 = require("../description-parsing/html/html.parser");
const plaintext_parser_1 = require("../description-parsing/plaintext/plaintext.parser");
const http_util_1 = require("../http/http.util");
const cancellation_token_1 = require("../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../submission/post/interfaces/file-post-data.interface");
const post_data_interface_1 = require("../submission/post/interfaces/post-data.interface");
const validation_parts_interface_1 = require("../submission/validator/interfaces/validation-parts.interface");
const http_experimental_1 = require("../utils/http-experimental");
class Website {
    constructor() {
        this.logger = new common_1.Logger(this.constructor.name);
        this.acceptsAdditionalFiles = false;
        this.acceptsSourceUrls = false;
        this.accountInformation = new Map();
        this.enableAdvertisement = true;
        this.refreshBeforePost = false;
        this.refreshInterval = 60000 * 10;
        this.usernameShortcuts = [];
        this.waitBetweenPostsInterval = 4000;
        this.defaultDescriptionParser = html_parser_1.HTMLFormatParser.parse;
    }
    checkCancelled(ct) {
        if (ct.isCancelled()) {
            throw new Error('Submission was cancelled while posting.');
        }
    }
    createPostResponse(postResponse) {
        return Object.assign(Object.assign({ message: postResponse.error ? 'Unknown Error' : '' }, postResponse), { time: new Date().toLocaleString(), website: this.constructor.name });
    }
    getAccountInfo(id, key) {
        return key
            ? lodash_1.default.get(this.accountInformation.get(id), key)
            : this.accountInformation.get(id) || {};
    }
    getDefaultOptions(submissionType) {
        const options = postybirb_commons_1.WebsiteOptions[this.constructor.name];
        switch (submissionType) {
            case postybirb_commons_1.SubmissionType.FILE:
                const FileObject = options
                    ? options.FileOptions || postybirb_commons_1.DefaultFileOptionsEntity
                    : postybirb_commons_1.DefaultFileOptionsEntity;
                return FileObject;
            case postybirb_commons_1.SubmissionType.NOTIFICATION:
                const NotificationObject = options
                    ? options.NotificationOptions || postybirb_commons_1.DefaultOptionsEntity
                    : postybirb_commons_1.DefaultOptionsEntity;
                return NotificationObject;
            default:
                throw new common_1.UnprocessableEntityException(`Unsupported submission type: ${submissionType}`);
        }
    }
    async postNotificationSubmission(cancellationToken, data, accountData) {
        throw new common_1.NotImplementedException('Method not implemented');
    }
    fallbackFileParser(html) {
        return { text: plaintext_parser_1.PlaintextParser.parse(html), type: 'text/plain', extension: 'txt' };
    }
    parseTags(tags, options = { spaceReplacer: '_', minLength: 1, maxLength: 100 }) {
        return tags
            .map(tag => tag.trim())
            .filter(tag => tag)
            .filter(tag => {
            return tag.length >= (options.minLength || 1) && tag.length <= (options.maxLength || 100);
        })
            .map(tag => tag.replace(/\s/g, options.spaceReplacer).trim());
    }
    formatTags(tags, options) {
        return this.parseTags(tags, options);
    }
    validateInsertTags(warnings, tags, description, limit, getLength = text => text.length) {
        const { includedTags, skippedTags } = this.calculateFittingTags(tags, description, limit, getLength);
        const skippedCount = skippedTags.length;
        if (skippedCount !== 0) {
            const includedCount = includedTags.length;
            if (includedCount === 0) {
                warnings.push(`Can't fit any tags. Reduce description length to be able to include them.`);
            }
            else {
                const totalCount = includedCount + skippedCount;
                warnings.push(`Can only fit ${includedCount} out of ${totalCount} tags. ` +
                    `Reduce description length to be able to include more. ` +
                    `Skipped tags: ${skippedTags.join(', ')}. ` +
                    `Included tags: ${includedTags.join(', ')}`);
            }
        }
    }
    generateTagsString(tags, description, websitePart) {
        const { includedTags } = this.calculateFittingTags(tags, description, this.MAX_CHARS);
        const formattedTags = this.formatTags(includedTags);
        if (Array.isArray(formattedTags)) {
            return formattedTags.join(' ');
        }
        if (typeof formattedTags === 'string') {
            return formattedTags;
        }
        return '';
    }
    calculateFittingTags(tags, description, limit, getLength = text => text.length) {
        const includedTags = [];
        const skippedTags = [];
        const appendToDescription = function (tag) {
            const suffix = tag ? [...includedTags, tag] : includedTags;
            if (suffix.length === 0) {
                return description;
            }
            else {
                return description + '\n\n' + suffix.join(' ');
            }
        };
        for (const tag of tags) {
            if (getLength(appendToDescription(tag)) <= limit) {
                includedTags.push(tag);
            }
            else {
                skippedTags.push(tag);
            }
        }
        return { includedTags, skippedTags };
    }
    parseDescription(text, type) {
        return this.defaultDescriptionParser(text);
    }
    postParseDescription(text, type) {
        return text;
    }
    preparseDescription(text, type) {
        return text || '';
    }
    storeAccountInformation(profileId, key, value) {
        this.accountInformation.set(profileId, Object.assign(Object.assign({}, this.accountInformation.get(profileId)), { [key]: value }));
    }
    transformAccountData(data) {
        return {};
    }
    validateNotificationSubmission(submission, submissionPart, defaultPart) {
        return { problems: [], warnings: [] };
    }
    verifyResponseExperimental(response, info) {
        if (response.statusCode > 303) {
            throw this.createPostResponse({
                error: response.body || response.statusCode,
                additionalInfo: `${info ? `${info}\n\n` : ''}${response.body
                    ? typeof response.body === 'object'
                        ? JSON.stringify(response.body, null, 1)
                        : response.body
                    : ''}`,
            });
        }
    }
    verifyResponse(response, info) {
        if (response.error || response.response.statusCode > 303) {
            throw this.createPostResponse({
                error: response.error || response.response.statusCode,
                additionalInfo: `${info ? `${info}\n\n` : ''}${response.body
                    ? typeof response.body === 'object'
                        ? JSON.stringify(response.body, null, 1)
                        : response.body
                    : ''}`,
            });
        }
    }
}
exports.Website = Website;
