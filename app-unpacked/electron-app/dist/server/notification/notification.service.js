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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const notification_repository_1 = require("./notification.repository");
const events_gateway_1 = require("../events/events.gateway");
const postybirb_notification_entity_1 = __importDefault(require("./models/postybirb-notification.entity"));
const postybirb_commons_1 = require("postybirb-commons");
const electron_1 = require("electron");
const settings_service_1 = require("../settings/settings.service");
let NotificationService = class NotificationService {
    constructor(repository, eventEmitter, settings) {
        this.repository = repository;
        this.eventEmitter = eventEmitter;
        this.settings = settings;
    }
    async get(id) {
        const notification = await this.repository.findOne(id);
        if (!notification) {
            throw new common_1.NotFoundException(`Notification ${id} does not exist`);
        }
        return notification;
    }
    getAll() {
        return this.repository.find();
    }
    async create(notification, icon) {
        const entity = new postybirb_notification_entity_1.default(notification);
        await this.repository.save(entity);
        this.eventEmitter.emitOnComplete(postybirb_commons_1.Events.NotificationEvent.UPDATE, this.getAll());
        this.emitSystemNotification(entity, icon);
    }
    emitSystemNotification(notification, icon) {
        if (electron_1.Notification.isSupported() && !global.SERVER_ONLY_MODE && !process.env.TEST) {
            const { title, body } = notification;
            const systemNotification = new electron_1.Notification({
                title,
                body,
                icon,
                silent: this.settings.getValue('silentNotification'),
            });
            systemNotification.on('click', () => global.showApp());
            systemNotification.show();
        }
    }
    async markAsViewed(ids) {
        const notifications = await Promise.all(ids.map(id => this.repository.findOne(id)));
        await Promise.all(notifications
            .filter(notification => notification)
            .map(notification => {
            notification.viewed = true;
            return this.repository.update(notification);
        }));
        this.eventEmitter.emitOnComplete(postybirb_commons_1.Events.NotificationEvent.UPDATE, this.getAll());
    }
    async remove(id) {
        await this.repository.remove(id);
        this.eventEmitter.emitOnComplete(postybirb_commons_1.Events.NotificationEvent.UPDATE, this.getAll());
    }
    async removeAll() {
        await this.repository.removeAll();
        this.eventEmitter.emit(postybirb_commons_1.Events.NotificationEvent.UPDATE, []);
    }
};
NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(notification_repository_1.NotificationRepositoryToken)),
    __metadata("design:paramtypes", [Object, events_gateway_1.EventsGateway,
        settings_service_1.SettingsService])
], NotificationService);
exports.NotificationService = NotificationService;
