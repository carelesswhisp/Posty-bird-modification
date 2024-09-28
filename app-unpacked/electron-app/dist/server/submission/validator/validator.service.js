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
exports.ValidatorService = void 0;
const common_1 = require("@nestjs/common");
const website_provider_service_1 = require("../../websites/website-provider.service");
const lodash_1 = __importDefault(require("lodash"));
const postybirb_commons_1 = require("postybirb-commons");
const website_base_1 = require("../../websites/website.base");
let ValidatorService = class ValidatorService {
    constructor(websiteProvider) {
        this.websiteProvider = websiteProvider;
    }
    validateParts(submission, parts) {
        const defaultPart = parts.find(p => p.isDefault);
        const websiteProblems = {};
        parts
            .filter(p => !p.isDefault)
            .forEach(p => {
            websiteProblems[p.accountId] = Object.assign(Object.assign({}, this.validatePart(submission, p, defaultPart)), { website: p.website, accountId: p.accountId });
        });
        return Object.assign({ [defaultPart.accountId]: Object.assign(Object.assign({}, this.validateDefaultPart(submission, defaultPart, parts)), { website: defaultPart.website, accountId: defaultPart.accountId }) }, websiteProblems);
    }
    validatePart(submission, part, defaultPart) {
        const website = this.websiteProvider.getWebsiteModule(part.website);
        const parsedPart = this.parsePart(part, defaultPart);
        switch (submission.type) {
            case postybirb_commons_1.SubmissionType.FILE:
                return website.validateFileSubmission(submission, parsedPart, defaultPart);
            case postybirb_commons_1.SubmissionType.NOTIFICATION:
                return website.validateNotificationSubmission(submission, parsedPart, defaultPart);
        }
    }
    validateDefaultPart(submission, defaultPart, allParts) {
        const problems = [];
        if (!defaultPart.data.rating) {
            problems.push('Please provide a rating.');
        }
        if (allParts.length <= 1) {
            problems.push('Please add one or more websites to post to.');
        }
        return { problems, warnings: [] };
    }
    parsePart(part, defaultPart) {
        return lodash_1.default.cloneDeep(part);
    }
};
ValidatorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [website_provider_service_1.WebsiteProvider])
], ValidatorService);
exports.ValidatorService = ValidatorService;
