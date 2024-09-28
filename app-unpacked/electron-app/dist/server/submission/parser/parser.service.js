"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserService = void 0;
const lodash_1 = __importDefault(require("lodash"));
const common_1 = require("@nestjs/common");
const settings_service_1 = require("../../settings/settings.service");
const tag_converter_service_1 = require("../../tag-converter/tag-converter.service");
const custom_shortcut_service_1 = require("../../custom-shortcut/custom-shortcut.service");
const file_manipulation_service_1 = require("../../file-manipulation/file-manipulation.service");
const website_base_1 = require("../../websites/website.base");
const scaling_options_interface_1 = require("../../websites/interfaces/scaling-options.interface");
const form_content_util_1 = __importDefault(require("../../utils/form-content.util"));
const ad_parser_1 = require("../../description-parsing/miscellaneous/ad.parser");
const websites_service_1 = require("../../websites/websites.service");
const username_parser_1 = require("../../description-parsing/miscellaneous/username.parser");
const file_submission_entity_1 = __importDefault(require("../file-submission/models/file-submission.entity"));
const html_parser_1 = require("../../description-parsing/html/html.parser");
const description_parser_1 = require("./section-parsers/description.parser");
let ParserService = class ParserService {
    constructor(settings, tagConverter, customShortcuts, fileManipulator, websitesService) {
        this.settings = settings;
        this.tagConverter = tagConverter;
        this.customShortcuts = customShortcuts;
        this.fileManipulator = fileManipulator;
        this.descriptionParser = new description_parser_1.DescriptionParser(customShortcuts, websitesService, settings, this);
    }
    async parse(website, submission, defaultPart, websitePart) {
        const description = await this.parseDescription(website, defaultPart, websitePart, submission.type);
        const tags = await this.parseTags(website, defaultPart, websitePart);
        const data = {
            description,
            options: websitePart.data || {},
            part: websitePart,
            rating: this.getRating(defaultPart, websitePart),
            sources: [],
            submission,
            tags,
            title: this.getTitle(submission, defaultPart, websitePart),
            spoilerText: this.getSpoilerText(defaultPart, websitePart),
        };
        if (this.isFileSubmission(submission)) {
            await this.parseFileSubmission(data, website, submission, defaultPart, websitePart);
        }
        return data;
    }
    async parseDescription(website, defaultPart, websitePart, type) {
        return this.descriptionParser.parse(website, defaultPart, websitePart, type);
    }
    async parseTags(website, defaultPart, websitePart) {
        let tags = lodash_1.default.uniq(form_content_util_1.default.getTags(defaultPart.data.tags, websitePart.data.tags));
        if (tags.length) {
            const conversionMap = {};
            (await this.tagConverter.getTagConvertersForWebsite(website.constructor.name)).forEach(converter => {
                conversionMap[converter.tag] = converter.getTagForWebsite(website.constructor.name);
            });
            tags = tags.map(tag => conversionMap[tag] || tag).filter(tag => !!tag.trim().length);
        }
        return tags;
    }
    getRating(defaultPart, websitePart) {
        return (websitePart.data.rating || defaultPart.data.rating).toLowerCase();
    }
    getTitle(submission, defaultPart, websitePart) {
        return (websitePart.data.title || defaultPart.data.title || submission.title).substring(0, 160);
    }
    getSpoilerText(defaultPart, websitePart) {
        const overwrite = websitePart.data.spoilerTextOverwrite;
        const defaultSpoilerText = defaultPart.data.spoilerText || '';
        const websiteSpoilerText = `${websitePart.data.spoilerText || ''}`;
        if (overwrite === undefined) {
            return websiteSpoilerText.trim() === '' ? defaultSpoilerText : websiteSpoilerText;
        }
        else if (overwrite) {
            return websiteSpoilerText;
        }
        else {
            return defaultSpoilerText;
        }
    }
    isFileSubmission(submission) {
        return submission instanceof file_submission_entity_1.default;
    }
    async parseFileSubmission(data, website, submission, defaultPart, websitePart) {
        const options = data.options;
        const canScale = options.autoScale;
        data.primary = await this.attemptFileScale(websitePart.accountId, website, submission.primary, canScale);
        if (submission.thumbnail && options.useThumbnail) {
            data.thumbnail = this.fileRecordAsPostFileRecord(submission.thumbnail).file;
        }
        if (submission.fallback) {
            data.fallback = this.fileRecordAsPostFileRecord(submission.fallback).file;
            const { text, type, extension } = website.fallbackFileParser(data.fallback.value.toString('utf8'));
            data.fallback.options.contentType = type;
            data.fallback.options.filename = data.fallback.options.filename.replace('html', extension);
            data.fallback.value = Buffer.from(text, 'utf8');
        }
        if (website.acceptsAdditionalFiles) {
            const additionalFiles = (submission.additional || []).filter(record => !record.ignoredAccounts.includes(websitePart.accountId));
            data.additional = await Promise.all(additionalFiles.map(file => this.attemptFileScale(websitePart.accountId, website, file, canScale)));
        }
        else {
            data.additional = [];
        }
    }
    fileRecordAsPostFileRecord(file) {
        return {
            type: file.type,
            file: {
                value: file.buffer,
                options: {
                    contentType: file.mimetype,
                    filename: this.parseFileName(file.name),
                },
            },
            altText: file.altText || '',
        };
    }
    async attemptFileScale(accountId, website, file, canScale) {
        const record = this.fileRecordAsPostFileRecord(file);
        if (canScale && this.fileManipulator.canScale(file.mimetype)) {
            const scaleOptions = website.getScalingOptions(file, accountId);
            if (scaleOptions) {
                const { buffer, mimetype } = await this.fileManipulator.scale(file.buffer, file.mimetype, scaleOptions, { convertToJPEG: scaleOptions.converToJPEG });
                if (mimetype !== file.mimetype) {
                    record.file.options.filename = this.fixFileExtension(mimetype, file.name);
                }
                record.file.options.contentType = mimetype;
                record.file.value = buffer;
            }
        }
        return record;
    }
    parseFileName(filename) {
        return filename.replace(/#/g, '_');
    }
    fixFileExtension(mimetype, filename) {
        const parts = filename.split('.');
        parts.pop();
        if (mimetype === 'image/jpeg') {
            parts.push('jpg');
        }
        else if (mimetype === 'image/png') {
            parts.push('png');
        }
        return parts.join('.');
    }
};
ParserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [settings_service_1.SettingsService,
        tag_converter_service_1.TagConverterService,
        custom_shortcut_service_1.CustomShortcutService,
        file_manipulation_service_1.FileManipulationService,
        websites_service_1.WebsitesService])
], ParserService);
exports.ParserService = ParserService;
