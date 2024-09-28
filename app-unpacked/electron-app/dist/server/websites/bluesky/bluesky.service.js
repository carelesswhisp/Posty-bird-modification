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
exports.Bluesky = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const post_data_interface_1 = require("../../submission/post/interfaces/post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const website_base_1 = require("../website.base");
const api_1 = require("@atproto/api");
const plaintext_parser_1 = require("../../description-parsing/plaintext/plaintext.parser");
const node_fetch_1 = __importDefault(require("node-fetch"));
const form_content_util_1 = __importDefault(require("../../utils/form-content.util"));
const GET_TIMEOUT = 15e3;
const POST_TIMEOUT = 60e3;
async function fetchHandler(reqUri, reqMethod, reqHeaders, reqBody) {
    const reqMimeType = reqHeaders['Content-Type'] || reqHeaders['content-type'];
    if (reqMimeType && reqMimeType.startsWith('application/json')) {
        reqBody = (0, api_1.stringifyLex)(reqBody);
    }
    else if (typeof reqBody === 'string' &&
        (reqBody.startsWith('/') || reqBody.startsWith('file:'))) {
        reqBody = { uri: reqBody };
    }
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), reqMethod === 'post' ? POST_TIMEOUT : GET_TIMEOUT);
    const res = await (0, node_fetch_1.default)(reqUri, {
        method: reqMethod,
        headers: reqHeaders,
        body: reqBody,
        signal: controller.signal,
    });
    const resStatus = res.status;
    const resHeaders = {};
    res.headers.forEach((value, key) => {
        resHeaders[key] = value;
    });
    const resMimeType = resHeaders['Content-Type'] || resHeaders['content-type'];
    let resBody;
    if (resMimeType) {
        if (resMimeType.startsWith('application/json')) {
            resBody = (0, api_1.jsonToLex)(await res.json());
        }
        else if (resMimeType.startsWith('text/')) {
            resBody = await res.text();
        }
        else {
            resBody = await res.blob();
        }
    }
    clearTimeout(to);
    return {
        status: resStatus,
        headers: resHeaders,
        body: resBody,
    };
}
function getRichTextLength(text) {
    return new api_1.RichText({ text }).graphemeLength;
}
let Bluesky = class Bluesky extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.BASE_URL = '';
        this.acceptsFiles = ['png', 'jpeg', 'jpg', 'gif'];
        this.acceptsAdditionalFiles = true;
        this.refreshInterval = 45 * 60000;
        this.defaultDescriptionParser = plaintext_parser_1.PlaintextParser.parse;
        this.MAX_CHARS = 300;
        this.MAX_MEDIA = 4;
        this.enableAdvertisement = false;
    }
    async checkLoginStatus(data) {
        api_1.BskyAgent.configure({ fetch: fetchHandler });
        const status = { loggedIn: false, username: null };
        const agent = new api_1.BskyAgent({ service: 'https://bsky.social' });
        await agent
            .login({
            identifier: data.data.username,
            password: data.data.password,
        })
            .then(res => {
            if (res.success) {
                status.loggedIn = true;
                status.username = data.data.username;
            }
            else {
                status.loggedIn = false;
            }
        })
            .catch(error => {
            status.loggedIn = false;
            this.logger.error(error);
        });
        return status;
    }
    getScalingOptions(file) {
        return {
            maxHeight: 2000,
            maxWidth: 2000,
            maxSize: filesize_util_1.default.MBtoBytes(0.9),
        };
    }
    formatTags(tags) {
        return this.parseTags(tags.map(tag => tag.replace(/[^a-z0-9]/gi, ' ')).map(tag => tag.split(' ').join('')), { spaceReplacer: '_' }).map(tag => `#${tag}`);
    }
    async uploadMedia(agent, data, file, altText) {
        const blobUpload = await agent
            .uploadBlob(file.value, { encoding: file.options.contentType })
            .catch(err => {
            return Promise.reject(this.createPostResponse({}));
        });
        if (blobUpload.success) {
            return blobUpload.data.blob;
        }
    }
    async postFileSubmission(cancellationToken, data, accountData) {
        this.checkCancelled(cancellationToken);
        const agent = new api_1.BskyAgent({ service: 'https://bsky.social' });
        await agent.login({
            identifier: accountData.username,
            password: accountData.password,
        });
        let profile = await agent.getProfile({ actor: agent.session.did });
        const reply = await this.getReplyRef(agent, data.options.replyToUrl);
        const files = [data.primary, ...data.additional];
        let uploadedMedias = [];
        let fileCount = 0;
        for (const file of files) {
            const altText = file.altText || data.options.altText;
            const ref = await this.uploadMedia(agent, accountData, file.file, altText);
            const image = { image: ref, alt: altText };
            uploadedMedias.push(image);
            fileCount++;
            if (fileCount == this.MAX_MEDIA) {
                break;
            }
        }
        const embeds = {
            images: uploadedMedias,
            $type: 'app.bsky.embed.images',
        };
        let labelsRecord;
        if (data.options.label_rating) {
            labelsRecord = {
                values: [{ val: data.options.label_rating }],
                $type: 'com.atproto.label.defs#selfLabels',
            };
        }
        const rt = new api_1.RichText({ text: data.description });
        await rt.detectFacets(agent);
        let postResult = await agent
            .post(Object.assign({ text: rt.text, facets: rt.facets, embed: embeds, labels: labelsRecord }, (reply ? { reply } : {})))
            .catch(err => {
            return Promise.reject(this.createPostResponse({ message: err }));
        });
        if (postResult && postResult.uri) {
            const handle = profile.data.handle;
            const server = 'bsky.app';
            const postId = postResult.uri.slice(postResult.uri.lastIndexOf('/') + 1);
            let friendlyUrl = `https://${server}/profile/${handle}/post/${postId}`;
            if (data.options.threadgate) {
                this.createThreadgate(agent, postResult.uri, data.options.threadgate);
            }
            return this.createPostResponse({
                source: friendlyUrl,
            });
        }
        else {
            return Promise.reject(this.createPostResponse({ message: 'Unknown error occurred' }));
        }
    }
    createThreadgate(agent, postUri, fromPostThreadGate) {
        let allow = [];
        switch (fromPostThreadGate) {
            case 'mention':
                allow.push({ $type: 'app.bsky.feed.threadgate#mentionRule' });
                break;
            case 'following':
                allow.push({ $type: 'app.bsky.feed.threadgate#followingRule' });
                break;
            case 'mention,following':
                allow.push({ $type: 'app.bsky.feed.threadgate#followingRule' });
                allow.push({ $type: 'app.bsky.feed.threadgate#mentionRule' });
                break;
            default:
                break;
        }
        const postUrip = new api_1.AtUri(postUri);
        agent.api.app.bsky.feed.threadgate
            .create({ repo: agent.session.did, rkey: postUrip.rkey }, { post: postUri, createdAt: new Date().toISOString(), allow })
            .finally(() => {
            return;
        });
    }
    async postNotificationSubmission(cancellationToken, data, accountData) {
        this.checkCancelled(cancellationToken);
        const agent = new api_1.BskyAgent({ service: 'https://bsky.social' });
        await agent.login({
            identifier: accountData.username,
            password: accountData.password,
        });
        let profile = await agent.getProfile({ actor: agent.session.did });
        const reply = await this.getReplyRef(agent, data.options.replyToUrl);
        let labelsRecord;
        if (data.options.label_rating) {
            labelsRecord = {
                values: [{ val: data.options.label_rating }],
                $type: 'com.atproto.label.defs#selfLabels',
            };
        }
        const rt = new api_1.RichText({ text: data.description });
        await rt.detectFacets(agent);
        let postResult = await agent
            .post(Object.assign({ text: rt.text, facets: rt.facets, labels: labelsRecord }, (reply ? { reply } : {})))
            .catch(err => {
            return Promise.reject(this.createPostResponse({ message: err }));
        });
        if (postResult && postResult.uri) {
            const handle = profile.data.handle;
            const server = 'bsky.app';
            const postId = postResult.uri.slice(postResult.uri.lastIndexOf('/') + 1);
            let friendlyUrl = `https://${server}/profile/${handle}/post/${postId}`;
            if (data.options.threadgate) {
                this.createThreadgate(agent, postResult.uri, data.options.threadgate);
            }
            return this.createPostResponse({
                source: friendlyUrl,
            });
        }
        else {
            return Promise.reject(this.createPostResponse({ message: 'Unknown error occurred' }));
        }
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        const files = [
            submission.primary,
            ...(submission.additional || []).filter(f => !f.ignoredAccounts.includes(submissionPart.accountId)),
        ];
        if (!submissionPart.data.altText && files.some(f => !f.altText)) {
            problems.push('Bluesky currently always requires alt text to be provided, ' +
                'even if your settings say otherwise. This is a bug on their side.');
        }
        this.validateRating(submissionPart, defaultPart, warnings);
        this.validateDescription(problems, warnings, submissionPart, defaultPart);
        files.forEach(file => {
            const { type, size, name, mimetype } = file;
            if (!website_validator_util_1.default.supportsFileType(file, this.acceptsFiles)) {
                problems.push(`Does not support file format: (${name}) ${mimetype}.`);
            }
            let maxMB = 1;
            if (filesize_util_1.default.MBtoBytes(maxMB) < size) {
                if (isAutoscaling &&
                    type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                    image_manipulator_1.default.isMimeType(mimetype)) {
                    warnings.push(`${name} will be scaled down to ${maxMB}MB`);
                }
                else {
                    problems.push(`BlueSky limits ${mimetype} to ${maxMB}MB`);
                }
            }
            if (isAutoscaling &&
                type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                (file.height > 2000 || file.width > 2000)) {
                warnings.push(`${name} will be scaled down to a maximum size of 2000x2000, while maintaining
            aspect ratio`);
            }
        });
        if (files.length > this.MAX_MEDIA) {
            warnings.push('Too many files selected for this platform, only the first four will be posted');
        }
        this.validateReplyToUrl(problems, submissionPart.data.replyToUrl);
        return { problems, warnings };
    }
    validateNotificationSubmission(submission, submissionPart, defaultPart) {
        const problems = [];
        const warnings = [];
        this.validateDescription(problems, warnings, submissionPart, defaultPart);
        this.validateReplyToUrl(problems, submissionPart.data.replyToUrl);
        this.validateRating(submissionPart, defaultPart, warnings);
        return { problems, warnings };
    }
    validateRating(submissionPart, defaultPart, warnings) {
        const rating = submissionPart.data.rating || defaultPart.data.rating;
        if (rating) {
            if (!submissionPart.data.label_rating && rating !== postybirb_commons_1.SubmissionRating.GENERAL) {
                warnings.push(`Make sure that the Default rating '${rating !== null && rating !== void 0 ? rating : postybirb_commons_1.SubmissionRating.GENERAL}' matches Bluesky Label Rating.`);
            }
        }
    }
    validateDescription(problems, warnings, submissionPart, defaultPart) {
        const description = this.defaultDescriptionParser(form_content_util_1.default.getDescription(defaultPart.data.description, submissionPart.data.description));
        const rt = new api_1.RichText({ text: description });
        const agent = new api_1.BskyAgent({ service: 'https://bsky.social' });
        rt.detectFacets(agent);
        if (rt.graphemeLength > this.MAX_CHARS) {
            problems.push(`Max description length allowed is ${this.MAX_CHARS} characters.`);
        }
        else {
            if (description.toLowerCase().indexOf('{tags}') > -1) {
                this.validateInsertTags(warnings, this.formatTags(form_content_util_1.default.getTags(defaultPart.data.tags, submissionPart.data.tags)), description, this.MAX_CHARS, getRichTextLength);
            }
            else {
                warnings.push(`You have not inserted the {tags} shortcut in your description; 
          tags will not be inserted in your post`);
            }
        }
    }
    validateReplyToUrl(problems, url) {
        if ((url === null || url === void 0 ? void 0 : url.trim()) && !this.getPostIdFromUrl(url)) {
            problems.push('Invalid post URL to reply to.');
        }
    }
    async getReplyRef(agent, url) {
        if (!(url === null || url === void 0 ? void 0 : url.trim())) {
            return null;
        }
        const postId = this.getPostIdFromUrl(url);
        if (!postId) {
            throw new Error(`Invalid reply to url '${url}'`);
        }
        const parent = await agent.getPost(postId);
        const reply = parent.value.reply;
        const root = reply ? reply.root : parent;
        return {
            root: { uri: root.uri, cid: root.cid },
            parent: { uri: parent.uri, cid: parent.cid },
        };
    }
    getPostIdFromUrl(url) {
        const link = /\/profile\/([^\/]+)\/post\/([a-zA-Z0-9\.\-_~]+)/.exec(url);
        if (link) {
            return { repo: link[1], rkey: link[2] };
        }
        const at = /(did:plc:[a-zA-Z0-9\.\-_~]+)\/.+\.post\/([a-zA-Z0-9\.\-_~]+)/.exec(url);
        if (at) {
            return { repo: at[1], rkey: at[2] };
        }
        return null;
    }
};
Bluesky = __decorate([
    (0, common_1.Injectable)()
], Bluesky);
exports.Bluesky = Bluesky;
