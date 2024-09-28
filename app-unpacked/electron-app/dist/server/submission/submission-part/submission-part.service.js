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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SubmissionPartService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionPartService = void 0;
const common_1 = require("@nestjs/common");
const submission_part_repository_1 = require("./submission-part.repository");
const website_provider_service_1 = require("../../websites/website-provider.service");
const postybirb_commons_1 = require("postybirb-commons");
const website_base_1 = require("../../websites/website.base");
const submission_part_entity_1 = __importDefault(require("./models/submission-part.entity"));
let SubmissionPartService = SubmissionPartService_1 = class SubmissionPartService {
    constructor(repository, websiteProvider) {
        this.repository = repository;
        this.websiteProvider = websiteProvider;
        this.logger = new common_1.Logger(SubmissionPartService_1.name);
    }
    async createOrUpdateSubmissionPart(part, submissionType) {
        const copy = part.copy();
        let websiteOptions = new postybirb_commons_1.DefaultOptionsEntity();
        if (!copy.isDefault) {
            const website = this.websiteProvider.getWebsiteModule(copy.website);
            websiteOptions = new (website.getDefaultOptions(submissionType))();
        }
        const existing = await this.repository.findOne(copy._id);
        if (existing) {
            this.logger.log(`${copy.submissionId}: ${copy.accountId}`, 'Update Submission Part');
            Object.assign(websiteOptions, Object.assign({}, copy.data));
            await websiteOptions.validate();
            copy.data = websiteOptions.asPlain();
            await this.repository.update(copy);
        }
        else {
            this.logger.log(copy.submissionId, 'Create Submission Part');
            Object.assign(websiteOptions, copy.data);
            await websiteOptions.validate();
            copy.data = websiteOptions.asPlain();
            await this.repository.save(copy);
        }
        return copy;
    }
    async createDefaultPart(submission, title) {
        const defaultPart = new postybirb_commons_1.DefaultOptionsEntity({
            title: title || submission.title,
        }).asPlain();
        return await this.repository.save(new submission_part_entity_1.default({
            submissionId: submission._id,
            website: 'default',
            accountId: 'default',
            data: defaultPart,
            isDefault: true,
            postStatus: 'UNPOSTED',
        }));
    }
    getPartsForSubmission(submissionId, incompleteOnly) {
        if (incompleteOnly) {
            return this.repository
                .find({ submissionId })
                .then(parts => parts.filter(part => part.postStatus !== 'SUCCESS'));
        }
        return this.repository.find({ submissionId });
    }
    async getSubmissionPart(submissionId, accountId) {
        return (await this.repository.find({ accountId, submissionId }))[0];
    }
    removeSubmissionPart(id) {
        this.logger.log(id, 'Remove Submission Part');
        return this.repository.remove(id);
    }
    removeBySubmissionId(submissionId) {
        this.logger.log(submissionId, 'Remove Submission Parts From Submission');
        return this.repository.removeBy({ submissionId });
    }
    removeAllSubmissionPartsForAccount(accountId) {
        this.logger.log(accountId, 'Remove All Parts For Account');
        return this.repository.removeBy({ accountId });
    }
};
SubmissionPartService = SubmissionPartService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(submission_part_repository_1.SubmissionPartRepositoryToken)),
    __metadata("design:paramtypes", [Object, website_provider_service_1.WebsiteProvider])
], SubmissionPartService);
exports.SubmissionPartService = SubmissionPartService;
