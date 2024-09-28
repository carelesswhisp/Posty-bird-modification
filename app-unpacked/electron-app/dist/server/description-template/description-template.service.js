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
var DescriptionTemplateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DescriptionTemplateService = void 0;
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const description_template_repository_1 = require("./description-template.repository");
const events_gateway_1 = require("../events/events.gateway");
let DescriptionTemplateService = DescriptionTemplateService_1 = class DescriptionTemplateService {
    constructor(repository, eventEmitter) {
        this.repository = repository;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(DescriptionTemplateService_1.name);
    }
    async get(id) {
        const entity = await this.repository.findOne(id);
        if (!entity) {
            throw new common_1.NotFoundException(`Description Template ${id} could not be found`);
        }
        return entity;
    }
    getAll() {
        return this.repository.find();
    }
    async create(descriptionTemplateDto) {
        this.logger.log(descriptionTemplateDto, 'Create Description Template');
        const dt = await this.repository.save(descriptionTemplateDto);
        this.eventEmitter.emit(postybirb_commons_1.Events.DescriptionTemplateEvent.CREATED, dt);
        return dt;
    }
    remove(id) {
        this.logger.log(id, 'Delete Description Template');
        this.eventEmitter.emit(postybirb_commons_1.Events.DescriptionTemplateEvent.REMOVED, id);
        return this.repository.remove(id);
    }
    async update(update) {
        this.logger.log(update._id, 'Update Description Template');
        const exists = await this.repository.findOne(update._id);
        if (!exists) {
            throw new common_1.NotFoundException(`Description template ${update._id} does not exist.`);
        }
        exists.content = update.content;
        exists.description = update.description;
        exists.title = update.title;
        await this.repository.update(exists);
        this.eventEmitter.emit(postybirb_commons_1.Events.DescriptionTemplateEvent.UPDATED, exists);
    }
};
DescriptionTemplateService = DescriptionTemplateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(description_template_repository_1.DescriptionTemplateRepositoryToken)),
    __metadata("design:paramtypes", [Object, events_gateway_1.EventsGateway])
], DescriptionTemplateService);
exports.DescriptionTemplateService = DescriptionTemplateService;
