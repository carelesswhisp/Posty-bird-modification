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
var TagGroupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagGroupService = void 0;
const common_1 = require("@nestjs/common");
const tag_group_repository_1 = require("./tag-group.repository");
const events_gateway_1 = require("../events/events.gateway");
const postybirb_commons_1 = require("postybirb-commons");
let TagGroupService = TagGroupService_1 = class TagGroupService {
    constructor(repository, eventEmitter) {
        this.repository = repository;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(TagGroupService_1.name);
    }
    async get(id) {
        const entity = await this.repository.findOne(id);
        if (!entity) {
            throw new common_1.NotFoundException(`Tag Group ${id} could not be found`);
        }
        return entity;
    }
    getAll() {
        return this.repository.find();
    }
    async create(tagGroup) {
        this.logger.log(tagGroup, 'Create Tag Group');
        const newTagGroup = await this.repository.save(tagGroup);
        this.eventEmitter.emit(postybirb_commons_1.Events.TagGroupEvent.CREATED, newTagGroup);
        return newTagGroup;
    }
    async update(tagGroup) {
        this.logger.log(tagGroup._id, 'Update Tag Group');
        await this.repository.update(tagGroup);
        this.eventEmitter.emit(postybirb_commons_1.Events.TagGroupEvent.UPDATED, tagGroup);
    }
    async remove(id) {
        this.logger.log(id, 'Delete Tag Group');
        await this.repository.remove(id);
        this.eventEmitter.emit(postybirb_commons_1.Events.TagGroupEvent.REMOVED, id);
    }
};
TagGroupService = TagGroupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(tag_group_repository_1.TagGroupRepositoryToken)),
    __metadata("design:paramtypes", [Object, events_gateway_1.EventsGateway])
], TagGroupService);
exports.TagGroupService = TagGroupService;
