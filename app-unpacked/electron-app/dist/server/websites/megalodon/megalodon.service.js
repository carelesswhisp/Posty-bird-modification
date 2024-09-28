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
exports.Megalodon = void 0;
const megalodon_1 = __importDefault(require("megalodon"));
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const plaintext_parser_1 = require("../../description-parsing/plaintext/plaintext.parser");
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const post_data_interface_1 = require("../../submission/post/interfaces/post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const form_content_util_1 = __importDefault(require("../../utils/form-content.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const website_base_1 = require("../website.base");
const lodash_1 = __importDefault(require("lodash"));
const file_manager_service_1 = require("../../file-manager/file-manager.service");
const fs = __importStar(require("fs"));
const os_1 = require("os");
const path = __importStar(require("path"));
const submission_part_entity_1 = __importDefault(require("../../submission/submission-part/models/submission-part.entity"));
const wait_util_1 = __importDefault(require("../../utils/wait.util"));
const INFO_KEY = 'INSTANCE INFO';
class Megalodon extends website_base_1.Website {
    constructor(fileRepository) {
        super();
        this.fileRepository = fileRepository;
        this.megalodonService = 'mastodon';
        this.maxMediaCount = undefined;
        this.MAX_CHARS = undefined;
        this.enableAdvertisement = false;
        this.acceptsAdditionalFiles = true;
        this.defaultDescriptionParser = plaintext_parser_1.PlaintextParser.parse;
        this.acceptsFiles = [
            'png',
            'jpeg',
            'jpg',
            'gif',
            'webp',
            'm4v',
            'mov'
        ];
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const accountData = data.data;
        this.logger.debug(`Login check: ${data._id} = ${accountData.website}`);
        if (accountData && accountData.token) {
            await this.getAndStoreInstanceInfo(data._id, accountData);
            status.loggedIn = true;
            status.username = accountData.username;
        }
        return status;
    }
    async getAndStoreInstanceInfo(profileId, data) {
        const client = (0, megalodon_1.default)(this.megalodonService, data.website, data.token);
        const instance = await client.getInstance();
        this.logger.debug("*************");
        this.logger.debug(`Account ID ${profileId}`);
        this.logger.debug(instance.data);
        this.logger.debug("*************");
        this.storeAccountInformation(profileId, INFO_KEY, instance.data);
    }
    generateTagsString(tags, description, websitePart) {
        var _a;
        const instanceSettings = this.getInstanceSettings(websitePart.accountId);
        const { includedTags } = this.calculateFittingTags(tags, description, instanceSettings.maxChars);
        return (_a = this.formatTags(includedTags).join(' ')) !== null && _a !== void 0 ? _a : '';
    }
    async postFileSubmission(cancellationToken, data, accountData) {
        var _a;
        this.logger.log("Posting a file");
        const instanceSettings = this.getInstanceSettings(data.part.accountId);
        const M = (0, megalodon_1.default)(this.megalodonService, accountData.website, accountData.token);
        const files = [data.primary, ...data.additional];
        const uploadedMedias = [];
        for (const file of files) {
            this.checkCancelled(cancellationToken);
            uploadedMedias.push(await this.uploadMedia(accountData, file.file, file.altText || data.options.altText));
        }
        const isSensitive = data.rating !== postybirb_commons_1.SubmissionRating.GENERAL;
        const chunks = lodash_1.default.chunk(uploadedMedias, instanceSettings.maxImages);
        let status = `${data.options.useTitle && data.title ? `${data.title}\n` : ''}${data.description}`.substring(0, instanceSettings.maxChars);
        let lastId = '';
        let source = '';
        const replyToId = this.getPostIdFromUrl(data.options.replyToUrl);
        for (let i = 0; i < chunks.length; i++) {
            this.checkCancelled(cancellationToken);
            const statusOptions = {
                sensitive: isSensitive,
                visibility: data.options.visibility || 'public',
                media_ids: chunks[i],
            };
            if (i !== 0) {
                statusOptions.in_reply_to_id = lastId;
            }
            else if (replyToId) {
                statusOptions.in_reply_to_id = replyToId;
            }
            if (data.spoilerText) {
                statusOptions.spoiler_text = data.spoilerText;
            }
            let attempts = 0;
            const max_attempts = 5;
            while (true) {
                try {
                    ++attempts;
                    const ms = attempts * attempts * 1000;
                    this.logger.log(`Waiting for ${ms}ms for media to process`);
                    await wait_util_1.default.wait(ms);
                    const result = (await M.postStatus(status, statusOptions)).data;
                    if (!source)
                        source = result.url;
                    lastId = result.id;
                    break;
                }
                catch (err) {
                    if (((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status) === 422 && attempts < max_attempts) {
                        this.logger.warn(`Retrying after 422 error, attempt ${attempts}/${max_attempts}`);
                        continue;
                    }
                    else {
                        return Promise.reject(this.createPostResponse({
                            message: err.message,
                            stack: err.stack,
                            additionalInfo: { chunkNumber: i },
                        }));
                    }
                }
            }
        }
        this.checkCancelled(cancellationToken);
        return this.createPostResponse({ source });
    }
    async postNotificationSubmission(cancellationToken, data, accountData) {
        this.logger.log("Posting a notification");
        const M = (0, megalodon_1.default)(this.megalodonService, accountData.website, accountData.token);
        const isSensitive = data.rating !== postybirb_commons_1.SubmissionRating.GENERAL;
        const statusOptions = {
            sensitive: isSensitive,
            visibility: data.options.visibility || 'public',
        };
        let status = `${data.options.useTitle && data.title ? `${data.title}\n` : ''}${data.description}`;
        if (data.spoilerText) {
            statusOptions.spoiler_text = data.spoilerText;
        }
        const replyToId = this.getPostIdFromUrl(data.options.replyToUrl);
        if (replyToId) {
            statusOptions.in_reply_to_id = replyToId;
        }
        this.checkCancelled(cancellationToken);
        try {
            const result = (await M.postStatus(status, statusOptions)).data;
            return this.createPostResponse({ source: result.url });
        }
        catch (error) {
            return Promise.reject(this.createPostResponse(error));
        }
    }
    formatTags(tags) {
        return this.parseTags(tags.map(tag => tag.replace(/[^a-z0-9]/gi, ' ')).map(tag => tag.split(' ').join('')), { spaceReplacer: '_' }).map(tag => `#${tag}`);
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const instanceSettings = this.getInstanceSettings(submissionPart.accountId);
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        const description = this.defaultDescriptionParser(form_content_util_1.default.getDescription(defaultPart.data.description, submissionPart.data.description));
        if (description.length > instanceSettings.maxChars) {
            warnings.push(`Max description length allowed is ${instanceSettings.maxChars} characters.`);
        }
        else {
            if (description.toLowerCase().indexOf('{tags}') > -1) {
                this.validateInsertTags(warnings, this.formatTags(form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags)), description, instanceSettings.maxChars);
            }
            else {
                warnings.push(`You have not inserted the {tags} shortcut in your description; 
          tags will not be inserted in your post`);
            }
        }
        const files = [
            submission.primary,
            ...(submission.additional || []).filter(f => !f.ignoredAccounts.includes(submissionPart.accountId)),
        ];
        files.forEach(file => {
            const { type, size, name, mimetype } = file;
            if (!website_validator_util_1.default.supportsFileType(file, this.acceptsFiles)) {
                problems.push(`Does not support file format: (${name}) ${mimetype}.`);
            }
            const scalingOptions = this.getScalingOptions(file, submissionPart.accountId);
            if (scalingOptions && scalingOptions.maxSize < size) {
                if (isAutoscaling &&
                    type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                    image_manipulator_1.default.isMimeType(mimetype)) {
                    warnings.push(`${name} will be scaled down to ${filesize_util_1.default.BytesToMB(scalingOptions.maxSize)}MB`);
                }
                else {
                    problems.push(`This instance limits ${mimetype} to ${filesize_util_1.default.BytesToMB(scalingOptions.maxSize)}MB`);
                }
            }
            if (scalingOptions &&
                isAutoscaling &&
                type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                scalingOptions.maxWidth &&
                scalingOptions.maxHeight &&
                (file.height > scalingOptions.maxHeight || file.width > scalingOptions.maxWidth)) {
                warnings.push(`${name} will be scaled down to a maximum size of ${scalingOptions.maxWidth}x${scalingOptions.maxHeight}, while maintaining aspect ratio`);
            }
        });
        if ((submissionPart.data.tags.value.length > 1 || defaultPart.data.tags.value.length > 1) &&
            submissionPart.data.visibility != 'public') {
            warnings.push(`This post won't be listed under any hashtag as it is not public. Only public posts can be searched by hashtag.`);
        }
        this.validateReplyToUrl(problems, submissionPart.data.replyToUrl);
        return { problems, warnings };
    }
    validateNotificationSubmission(submission, submissionPart, defaultPart) {
        const instanceSettings = this.getInstanceSettings(submissionPart.accountId);
        const problems = [];
        const warnings = [];
        const description = this.defaultDescriptionParser(form_content_util_1.default.getDescription(defaultPart.data.description, submissionPart.data.description));
        if (description.length > instanceSettings.maxChars) {
            warnings.push(`Max description length allowed is ${instanceSettings.maxChars} characters.`);
        }
        else {
            this.validateInsertTags(warnings, this.formatTags(form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags)), description, instanceSettings.maxChars);
        }
        this.validateReplyToUrl(problems, submissionPart.data.replyToUrl);
        return { problems, warnings };
    }
    validateReplyToUrl(problems, url) {
        if ((url === null || url === void 0 ? void 0 : url.trim()) && !this.getPostIdFromUrl(url)) {
            problems.push("Invalid post URL to reply to.");
        }
    }
    async uploadMedia(data, file, altText) {
        this.logger.log("Uploading media");
        const M = (0, megalodon_1.default)(this.megalodonService, data.website, data.token);
        const tempDir = (0, os_1.tmpdir)();
        fs.writeFileSync(path.join(tempDir, file.options.filename), file.value);
        const upload = await M.uploadMedia(fs.createReadStream(path.join(tempDir, file.options.filename)), { description: altText });
        fs.unlink(path.join(tempDir, file.options.filename), (err) => {
            if (err) {
                this.logger.error("Unable to remove the temp file", err.stack, err.message);
            }
        });
        if (upload.status > 300) {
            this.logger.log(upload);
            return Promise.reject(this.createPostResponse({ additionalInfo: upload.status, message: upload.statusText }));
        }
        this.logger.log("Image uploaded");
        return upload.data.id;
    }
}
exports.Megalodon = Megalodon;
