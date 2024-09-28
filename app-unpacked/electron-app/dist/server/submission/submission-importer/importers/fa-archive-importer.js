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
exports.FaArchiveImporter = void 0;
const _ = __importStar(require("lodash"));
const fs = __importStar(require("fs-extra"));
const importer_1 = require("./importer");
const domhandler_1 = require("domhandler");
const postybirb_commons_1 = require("postybirb-commons");
const common_1 = require("@nestjs/common");
const postybirb_commons_2 = require("postybirb-commons");
const file_submission_type_helper_1 = require("../../file-submission/helpers/file-submission-type.helper");
const path_1 = require("path");
function looksLikeSubmission(name) {
    return (0, file_submission_type_helper_1.getSubmissionType)('unknown/unknown', name) !== postybirb_commons_1.FileSubmissionType.UNKNOWN;
}
function looksLikeThumbnail(name) {
    return /^\.(gif|png|jpe?g)$/i.test((0, path_1.parse)(name).ext);
}
class FaArchiveImporter extends importer_1.Importer {
    constructor(service) {
        super(service);
        this.logger = new common_1.Logger(FaArchiveImporter.name);
    }
    getName() {
        return FaArchiveImporter.name;
    }
    getDisplayName() {
        return 'fa_archive dump';
    }
    identify(tree) {
        let hasArchiveFile = false;
        let hasGalleryDir = false;
        let hasScrapsDir = false;
        for (const { type, name } of tree.entries) {
            if (name === 'archive.chunk' && type === 'file') {
                hasArchiveFile = true;
            }
            else if (name === 'gallery' && type === 'directory') {
                hasGalleryDir = true;
            }
            else if (name === 'scraps' && type === 'directory') {
                hasScrapsDir = true;
            }
        }
        return hasArchiveFile && hasGalleryDir && hasScrapsDir;
    }
    async extract(tree) {
        const imports = [];
        for (const { name, type, entries } of tree.entries) {
            if ((name === 'gallery' || name === 'scraps') && type === 'directory') {
                imports.push(...this.collectImports(name, entries));
            }
        }
        const count = imports.length;
        this.tryExtractImports(imports).then(successes => {
            this.logger.debug(`${successes}/${count} imported`, 'Imported Finished');
            this.showCompletedNotification(successes, count);
        });
        return count;
    }
    collectImports(location, entries) {
        const imports = new Map();
        function importById(s) {
            const id = Number.parseInt(s, 10);
            if (imports.has(id)) {
                return imports.get(id);
            }
            else {
                const imp = { location, id };
                imports.set(id, imp);
                return imp;
            }
        }
        for (const entry of entries) {
            if (entry.type === 'file') {
                const { name } = entry;
                const match = /^(?<id>[0-9]+)(?<type>[dft])\.(?<ext>.+)$/.exec(name);
                if (match) {
                    const { id, type, ext } = match.groups;
                    if (type === 'd' && ext === 'json') {
                        importById(id).jsonEntry = entry;
                    }
                    else if (type === 'f' && looksLikeSubmission(name)) {
                        importById(id).fileEntry = entry;
                    }
                    else if (type === 't' && looksLikeThumbnail(name)) {
                        importById(id).thumbnailEntry = entry;
                    }
                }
            }
        }
        return [...imports.values()].filter(({ jsonEntry, fileEntry }) => jsonEntry && fileEntry);
    }
    async tryExtractImports(imports) {
        let successes = 0;
        let current = 0;
        let lastProgress = null;
        for (const imp of _.sortBy(imports, ['id'])) {
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
    async extractImport({ location, jsonEntry, fileEntry, thumbnailEntry, }) {
        const text = await fs.readFile(jsonEntry.path, 'utf-8');
        const metadata = JSON.parse(text);
        const submission = await this.createSubmission(fileEntry, await this.getDefaultPartData(jsonEntry, metadata, location === 'scraps'), metadata.type === 'image' ? undefined : thumbnailEntry);
        this.logger.debug(submission._id, 'Imported Submission');
    }
    async getDefaultPartData({ path }, { title, date, description, tags, rating }, scraps) {
        const data = {};
        data.title = `${scraps ? 'Scrap: ' : ''}${title || (0, path_1.parse)(path).name}`;
        data.scraps = scraps;
        const descriptionParts = [];
        if (description) {
            descriptionParts.push(this.scrubHtmlDescription(description));
        }
        if (date) {
            descriptionParts.push(`<p>Originally posted on ${date.substring(0, 10)}.</p>`);
        }
        if (descriptionParts) {
            data.description = { overwriteDefault: false, value: descriptionParts.join('<p></p>') };
        }
        if (tags) {
            data.tags = { extendDefault: true, value: tags };
        }
        if (rating === 'General') {
            data.rating = postybirb_commons_2.SubmissionRating.GENERAL;
        }
        else if (rating === 'Mature') {
            data.rating = postybirb_commons_2.SubmissionRating.MATURE;
        }
        else if (rating === 'Adult') {
            data.rating = postybirb_commons_2.SubmissionRating.ADULT;
        }
        return data;
    }
    scrubHtmlElement(elem) {
        const name = elem.name.toLowerCase();
        const attribs = elem.attribs;
        const classes = (attribs['class'] || '').toLowerCase().trim().split(/\s+/);
        if (name === 'span' && classes.includes('parsed_nav_links')) {
            return null;
        }
        else if (name === 'a' && classes.includes('auto_link_shortened')) {
            const { href } = attribs;
            return new domhandler_1.Element('a', { href }, [new domhandler_1.Text(href)]);
        }
        else if (name === 'a' &&
            (classes.includes('iconusername') || classes.includes('linkusername'))) {
            const href = attribs.href.replace('/user/', '');
            return new domhandler_1.Text(`{fa:${href}}`);
        }
        else {
            return elem;
        }
    }
}
exports.FaArchiveImporter = FaArchiveImporter;
