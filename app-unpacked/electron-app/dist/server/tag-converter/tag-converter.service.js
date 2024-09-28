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
var TagConverterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagConverterService = void 0;
const common_1 = require("@nestjs/common");
const tag_converter_repository_1 = require("./tag-converter.repository");
const events_gateway_1 = require("../events/events.gateway");
const postybirb_commons_1 = require("postybirb-commons");
let TagConverterService = TagConverterService_1 = class TagConverterService {
    constructor(repository, eventEmitter) {
        this.repository = repository;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(TagConverterService_1.name);
    }
    async get(id) {
        const entity = await this.repository.findOne(id);
        if (!entity) {
            throw new common_1.NotFoundException(`Tag Converter ${id} could not be found`);
        }
        return entity;
    }
    getAll() {
        return this.repository.find();
    }
    async getTagConvertersForWebsite(website) {
        const converters = await this.getAll();
        return converters.filter(converter => converter.hasConversion(website));
    }
    async create(customShortcutDto) {
        this.logger.log(customShortcutDto, 'Tag Converter Shortcut');
        if (!(await this.isUnique(customShortcutDto.tag))) {
            throw new common_1.BadRequestException('Tag must be unique');
        }
        customShortcutDto.conversions = customShortcutDto.conversions || {};
        const dt = await this.repository.save(customShortcutDto);
        this.eventEmitter.emit(postybirb_commons_1.Events.TagConverterEvent.CREATED, dt);
        return dt;
    }
    remove(id) {
        this.logger.log(id, 'Delete Custom Shortcut');
        this.eventEmitter.emit(postybirb_commons_1.Events.TagConverterEvent.REMOVED, id);
        return this.repository.remove(id);
    }
    async update(update) {
        this.logger.log(update._id, 'Update Tag Converter');
        const exists = await this.get(update._id);
        exists.tag = update.tag;
        exists.conversions = update.conversions;
        await this.repository.update(exists);
        this.eventEmitter.emit(postybirb_commons_1.Events.TagConverterEvent.UPDATED, exists);
    }
    async isUnique(tag) {
        const alreadyInUse = await this.repository.find({ tag });
        return !!alreadyInUse;
    }
};
TagConverterService = TagConverterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(tag_converter_repository_1.TagConverterRepositoryToken)),
    __metadata("design:paramtypes", [Object, events_gateway_1.EventsGateway])
], TagConverterService);
exports.TagConverterService = TagConverterService;
