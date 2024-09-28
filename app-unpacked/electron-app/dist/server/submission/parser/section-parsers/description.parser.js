"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DescriptionParser = void 0;
const custom_shortcut_service_1 = require("../../../custom-shortcut/custom-shortcut.service");
const html_parser_1 = require("../../../description-parsing/html/html.parser");
const ad_parser_1 = require("../../../description-parsing/miscellaneous/ad.parser");
const username_parser_1 = require("../../../description-parsing/miscellaneous/username.parser");
const settings_service_1 = require("../../../settings/settings.service");
const form_content_util_1 = __importDefault(require("../../../utils/form-content.util"));
const website_base_1 = require("../../../websites/website.base");
const websites_service_1 = require("../../../websites/websites.service");
class DescriptionParser {
    constructor(customShortcuts, websitesService, settings, parserService) {
        this.customShortcuts = customShortcuts;
        this.websitesService = websitesService;
        this.settings = settings;
        this.parserService = parserService;
        this.websiteDescriptionShortcuts = websitesService.getUsernameShortcuts();
        this.websiteDescriptionShortcuts = Object.assign(Object.assign({}, this.websiteDescriptionShortcuts), { twitter: [
                {
                    key: 'tw',
                    url: 'https://twitter.com/$1',
                },
            ] });
    }
    async parse(website, defaultPart, websitePart, type) {
        var _a, _b, _c, _d;
        let description = form_content_util_1.default.getDescription(defaultPart.data.description, websitePart.data.description).trim();
        if (description.length) {
            let tags = await this.parserService.parseTags(website, defaultPart, websitePart);
            description = this.insertDefaultShortcuts(description, [
                {
                    name: 'default',
                    content: (_b = (_a = defaultPart.data.description.value) !== null && _a !== void 0 ? _a : websitePart.data.description.value) !== null && _b !== void 0 ? _b : '',
                },
                {
                    name: 'title',
                    content: (_d = (_c = defaultPart.data.title) !== null && _c !== void 0 ? _c : websitePart.data.title) !== null && _d !== void 0 ? _d : '',
                },
                {
                    name: 'tags',
                    content: website.generateTagsString(tags, description, websitePart),
                },
                {
                    name: 'cw',
                    content: form_content_util_1.default.getSpoilerText(defaultPart.data, websitePart.data),
                },
            ]);
            const shortcutInfo = this.parseShortcuts(description);
            description = this.replaceShortcuts(description, shortcutInfo, website.constructor.name.toLowerCase());
            description = await this.parseCustomDescriptionShortcuts(description);
            description = html_parser_1.HTMLFormatParser.parse(description);
            description = website.preparseDescription(description, type);
            Object.values(this.websiteDescriptionShortcuts).forEach(websiteShortcuts => websiteShortcuts.forEach(shortcut => (description = username_parser_1.UsernameParser.parse(description, shortcut.key, shortcut.url))));
            description = website.parseDescription(description, type);
        }
        if (website.enableAdvertisement && this.settings.getValue('advertise')) {
            description = ad_parser_1.AdInsertParser.parse(description, website.defaultDescriptionParser);
        }
        description = website.postParseDescription(description, type);
        return description.trim();
    }
    async parseCustomDescriptionShortcuts(description) {
        const customShortcuts = await this.customShortcuts.getAll();
        customShortcuts.forEach(scEntity => {
            scEntity.content = scEntity.content.replace(/(^<p.*?>|<\/p>$)/g, '');
            if (scEntity.isDynamic) {
                const dynamicMatches = description.match(new RegExp(`{${scEntity.shortcut}:(.+?)}`, 'gms')) || [];
                dynamicMatches.forEach(match => {
                    let content = scEntity.content;
                    const matchedContent = match
                        .replace(/(\{|\})/g, '')
                        .split(':')
                        .pop() || '';
                    content = content.replace(/\{\$\}/gm, matchedContent);
                    description = description.replace(match, content);
                });
            }
            else {
                description = description.replace(new RegExp(`{${scEntity.shortcut}}`, 'gm'), scEntity.content);
            }
        });
        return description;
    }
    parseShortcuts(description) {
        const matches = description.match(/\{([^\{]*?)\}/gms) || [];
        return matches.map(m => {
            const matchInfo = m.match(/\{(\[([^\[\]]*)\])?(\w+):?(.*?)\}/s);
            if (!matchInfo) {
                throw new Error(`Invalid shortcut: ${m}`);
            }
            const [originalText, modifiersText, mods, key, additionalText] = matchInfo;
            const modifiers = {};
            if (mods) {
                mods
                    .split(';')
                    .map(mod => mod.split('='))
                    .forEach(([key, value]) => (modifiers[key] = value));
            }
            return {
                originalText,
                modifiersText,
                modifiers,
                key,
                additionalText,
            };
        });
    }
    escapeRegexString(str) {
        return str
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}');
    }
    replaceShortcuts(description, shortcuts, allowed) {
        shortcuts
            .filter(sc => sc.modifiers.only)
            .forEach(sc => {
            if (sc.modifiers.only.toLowerCase().split(',').includes(allowed)) {
                description = description.replace(sc.originalText, `{${sc.key}${sc.additionalText ? ':' : ''}${sc.additionalText}}`);
            }
            else {
                const regex = new RegExp(`(\\s){0,1}${this.escapeRegexString(sc.originalText)}(\\s){0,1}`);
                const [match, beforeSpace, afterSpace] = description.match(regex);
                if (beforeSpace && afterSpace) {
                    description = description.replace(regex, ' ');
                }
                else if (beforeSpace) {
                    description = description.replace(sc.originalText, '');
                }
                else if (afterSpace) {
                    description = description.replace(sc.originalText, '');
                }
                else {
                    description = description.replace(sc.originalText, '');
                }
            }
        });
        return description;
    }
    insertDefaultShortcuts(description, shortcuts) {
        for (const { name, content } of shortcuts) {
            description = description.replace(new RegExp(`{${name}}`, 'gm'), content);
        }
        return description;
    }
}
exports.DescriptionParser = DescriptionParser;
