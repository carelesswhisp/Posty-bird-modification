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
var SubmissionTemplateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionTemplateService = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const events_gateway_1 = require("../../events/events.gateway");
const submission_part_entity_1 = __importDefault(require("../submission-part/models/submission-part.entity"));
const submission_template_entity_1 = __importDefault(require("./models/submission-template.entity"));
const submission_template_repository_1 = require("./submission-template.repository");
let SubmissionTemplateService = SubmissionTemplateService_1 = class SubmissionTemplateService {
    constructor(repository, eventEmitter) {
        this.repository = repository;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(SubmissionTemplateService_1.name);
    }
    async get(id) {
        const template = await this.repository.findOne(id);
        if (!template) {
            throw new common_1.NotFoundException(`Submission template ${id} does not exist.`);
        }
        return template;
    }
    getAll() {
        return this.repository.find();
    }
    async create(createDto) {
        this.logger.log(createDto, 'Create Submission Template');
        const defaultPart = new postybirb_commons_1.DefaultOptionsEntity({}).asPlain();
        const template = new submission_template_entity_1.default({
            alias: createDto.alias.trim(),
            type: createDto.type,
            parts: {},
        });
        template.parts.default = new submission_part_entity_1.default({
            submissionId: template._id,
            website: 'default',
            accountId: 'default',
            data: defaultPart,
            isDefault: true,
            postStatus: 'UNPOSTED',
        });
        const createdTemplate = await this.repository.save(template);
        this.eventEmitter.emit(postybirb_commons_1.Events.SubmissionTemplateEvent.CREATED, createdTemplate);
        return createdTemplate;
    }
    async remove(id) {
        this.logger.log(id, 'Delete Submission Template');
        await this.repository.remove(id);
        this.eventEmitter.emit(postybirb_commons_1.Events.SubmissionTemplateEvent.REMOVED, id);
    }
    async update(updateDto) {
        this.logger.log(updateDto.id, 'Update Submission Template');
        const templateToUpdate = await this.get(updateDto.id);
        const newParts = {};
        Object.entries(updateDto.parts).forEach(([key, value]) => {
            const { data, accountId, submissionId, website, isDefault } = value;
            newParts[key] = new submission_part_entity_1.default({
                data,
                accountId,
                submissionId,
                website,
                isDefault,
            });
        });
        templateToUpdate.parts = newParts;
        await this.repository.update(templateToUpdate);
        this.eventEmitter.emit(postybirb_commons_1.Events.SubmissionTemplateEvent.UPDATED, templateToUpdate);
        return templateToUpdate;
    }
    async updateAlias(id, alias) {
        const templateToUpdate = await this.get(id);
        this.logger.verbose(`[${id}] ${templateToUpdate.alias} -> ${alias}`, 'Rename Submission Template');
        templateToUpdate.alias = alias.trim();
        await this.repository.update(templateToUpdate);
        this.eventEmitter.emit(postybirb_commons_1.Events.SubmissionTemplateEvent.UPDATED, templateToUpdate);
        return templateToUpdate;
    }
    async removePartsForAccount(accountId) {
        this.logger.log(accountId, 'Delete Submission Template Parts For Account');
        const all = await this.getAll();
        all.forEach(async (template) => {
            if (template.parts[accountId]) {
                if (template.parts[accountId]) {
                    delete template.parts[accountId];
                    await this.repository.update(template);
                    this.eventEmitter.emit(postybirb_commons_1.Events.SubmissionTemplateEvent.UPDATED, template);
                }
            }
        });
    }
};
SubmissionTemplateService = SubmissionTemplateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(submission_template_repository_1.SubmissionTemplateRepositoryToken)),
    __metadata("design:paramtypes", [Object, events_gateway_1.EventsGateway])
], SubmissionTemplateService);
exports.SubmissionTemplateService = SubmissionTemplateService;
