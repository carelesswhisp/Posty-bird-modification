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
var CustomShortcutService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomShortcutService = void 0;
const common_1 = require("@nestjs/common");
const custom_shortcut_repository_1 = require("./custom-shortcut.repository");
const events_gateway_1 = require("../events/events.gateway");
const postybirb_commons_1 = require("postybirb-commons");
let CustomShortcutService = CustomShortcutService_1 = class CustomShortcutService {
    constructor(repository, eventEmitter) {
        this.repository = repository;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(CustomShortcutService_1.name);
    }
    async get(id) {
        const entity = await this.repository.findOne(id);
        if (!entity) {
            throw new common_1.NotFoundException(`Custom Shortcut ${id} could not be found`);
        }
        return entity;
    }
    getAll() {
        return this.repository.find();
    }
    async create(customShortcutDto) {
        this.logger.log(customShortcutDto, 'Create Custom Shortcut');
        if (!(await this.isUniqueShortcut(customShortcutDto.shortcut))) {
            throw new common_1.BadRequestException('Shortcut must be unique');
        }
        const dt = await this.repository.save(customShortcutDto);
        this.eventEmitter.emit(postybirb_commons_1.Events.CustomShortcutEvent.CREATED, dt);
        return dt;
    }
    remove(id) {
        this.logger.log(id, 'Delete Custom Shortcut');
        this.eventEmitter.emit(postybirb_commons_1.Events.CustomShortcutEvent.REMOVED, id);
        return this.repository.remove(id);
    }
    async update(update) {
        this.logger.log(update._id, 'Update Custom Shortcut');
        const exists = await this.get(update._id);
        exists.content = update.content;
        exists.shortcut = update.shortcut;
        exists.isDynamic = update.isDynamic;
        await this.repository.update(exists);
        this.eventEmitter.emit(postybirb_commons_1.Events.CustomShortcutEvent.UPDATED, exists);
    }
    async isUniqueShortcut(shortcut) {
        const alreadyInUse = await this.repository.find({ shortcut });
        return !!alreadyInUse;
    }
};
CustomShortcutService = CustomShortcutService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(custom_shortcut_repository_1.CustomShortcutRepositoryToken)),
    __metadata("design:paramtypes", [Object, events_gateway_1.EventsGateway])
], CustomShortcutService);
exports.CustomShortcutService = CustomShortcutService;
