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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityPubImporter = void 0;
const fs = __importStar(require("fs-extra"));
const importer_1 = require("./importer");
const postybirb_commons_1 = require("postybirb-commons");
const common_1 = require("@nestjs/common");
const postybirb_commons_2 = require("postybirb-commons");
const file_submission_type_helper_1 = require("../../file-submission/helpers/file-submission-type.helper");
const path_1 = require("path");
function looksLikeSubmission(mimetype, name) {
    return (0, file_submission_type_helper_1.getSubmissionType)(mimetype, name) !== postybirb_commons_1.FileSubmissionType.UNKNOWN;
}
class ActivityPubImporter extends importer_1.Importer {
    constructor(service) {
        super(service);
        this.logger = new common_1.Logger(ActivityPubImporter.name);
    }
    getName() {
        return ActivityPubImporter.name;
    }
    getDisplayName() {
        return 'ActivityPub export';
    }
    identify(tree) {
        let hasActorJson = false;
        let hasOutboxJson = false;
        for (const { type, name } of tree.entries) {
            if (type === 'file') {
                if (name === 'actor.json') {
                    hasActorJson = true;
                }
                else if (name === 'outbox.json') {
                    hasOutboxJson = true;
                }
            }
        }
        return hasActorJson && hasOutboxJson;
    }
    async extract(tree) {
        const imports = [];
        const outbox = await this.parseOutboxJson(tree);
        for (const item of outbox.orderedItems || []) {
            const imp = this.extractItem(tree, item);
            if (imp) {
                imports.push(imp);
            }
        }
        const count = imports.length;
        this.tryExtractImports(imports).then(successes => {
            this.logger.debug(`${successes}/${count} imported`, 'Imported Finished');
            this.showCompletedNotification(successes, count);
        });
        return count;
    }
    async parseOutboxJson({ entries }) {
        for (const entry of entries) {
            if (entry.type === 'file' && entry.name === 'outbox.json') {
                const text = await fs.readFile(entry.path, 'utf-8');
                return JSON.parse(text);
            }
        }
        throw Error('No outbox.json found');
    }
    extractItem({ path }, item) {
        if ((item === null || item === void 0 ? void 0 : item.type) !== 'Create') {
            return null;
        }
        if (this.looksLikeDirectMessage(item)) {
            return null;
        }
        const object = item.object;
        if ((object === null || object === void 0 ? void 0 : object.type) !== 'Note' || !object.attachment) {
            return null;
        }
        const imp = {
            id: object.id || '',
            published: object.published || '',
            content: object.content || '',
            sensitive: !!object.sensitive,
            summary: object.summary || '',
            attachments: [],
            tags: [],
        };
        for (const attachment of object.attachment || []) {
            if ((attachment === null || attachment === void 0 ? void 0 : attachment.type) === 'Document' && attachment.url) {
                const attachmentPath = (0, path_1.join)(path, attachment.url);
                if (looksLikeSubmission(attachment.mediaType || 'unkown/unknown', attachmentPath)) {
                    imp.attachments.push({
                        path: attachmentPath,
                        altText: attachment.name || '',
                    });
                }
            }
        }
        if (imp.attachments.length === 0) {
            return null;
        }
        for (const tag of object.tag) {
            if ((tag === null || tag === void 0 ? void 0 : tag.type) === 'Hashtag' && tag.name) {
                imp.tags.push(tag.name.replace('#', ''));
            }
        }
        return imp;
    }
    looksLikeDirectMessage({ to, cc }) {
        for (const recipient of [...(to || []), ...(cc || [])]) {
            if (/(#public|\/followers)$/i.test(recipient)) {
                return false;
            }
        }
        return true;
    }
    async tryExtractImports(imports) {
        let successes = 0;
        let current = 0;
        let lastProgress = null;
        for (const imp of imports) {
            try {
                await this.extractImport(imp);
                ++successes;
            }
            catch (err) {
                this.logger.error(`${imp.id}: ${err}`, null, 'Import Error');
                this.showImportError(`${imp.id}`);
            }
            ++current;
            lastProgress = this.showImportProgress(current, imports.length, lastProgress);
        }
        return successes;
    }
    async extractImport(imp) {
        const [firstAttachment, ...moreAttachments] = imp.attachments;
        const submission = await this.createSubmission({ path: firstAttachment.path }, this.getDefaultPartData(imp));
        this.logger.debug(submission._id, 'Imported Submission');
        for (const { path } of moreAttachments) {
            await this.service.submissionService.addFileSubmissionAdditionalFile(await this.readUploadedFile({ path }), submission._id, path);
        }
    }
    getDefaultPartData({ published, content, sensitive, attachments, tags, }) {
        const data = {};
        const descriptionParts = [];
        if (content) {
            descriptionParts.push(this.scrubHtmlDescription(content));
        }
        if (published) {
            descriptionParts.push(`<p>Originally posted on ${published.substring(0, 10)}.</p>`);
        }
        if (descriptionParts) {
            data.description = { overwriteDefault: false, value: descriptionParts.join('<p></p>') };
        }
        if (tags) {
            data.tags = { extendDefault: true, value: tags };
        }
        data.rating = sensitive ? postybirb_commons_2.SubmissionRating.ADULT : postybirb_commons_2.SubmissionRating.GENERAL;
        const altText = attachments[0].altText;
        if (altText) {
            data.altText = altText;
        }
        return data;
    }
    scrubHtmlElement(elem) {
        const name = elem.name.toLowerCase();
        const attribs = elem.attribs;
        const classes = (attribs['class'] || '').toLowerCase().trim().split(/\s+/);
        if (name === 'a' && classes.includes('hashtag')) {
            return null;
        }
        else {
            return elem;
        }
    }
}
exports.ActivityPubImporter = ActivityPubImporter;
