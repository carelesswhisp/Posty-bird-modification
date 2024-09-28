"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModule = void 0;
const common_1 = require("@nestjs/common");
const notification_controller_1 = require("./notification.controller");
const notification_service_1 = require("./notification.service");
const notification_repository_1 = require("./notification.repository");
const ui_notification_service_1 = require("./ui-notification/ui-notification.service");
const database_factory_1 = require("../database/database.factory");
const postybirb_notification_entity_1 = __importDefault(require("./models/postybirb-notification.entity"));
const settings_module_1 = require("../settings/settings.module");
let NotificationModule = class NotificationModule {
};
NotificationModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [settings_module_1.SettingsModule],
        controllers: [notification_controller_1.NotificationController],
        providers: [
            notification_service_1.NotificationService,
            database_factory_1.DatabaseFactory.forProvider(notification_repository_1.NotificationRepositoryToken, {
                databaseName: 'notification',
                entity: postybirb_notification_entity_1.default,
            }),
            ui_notification_service_1.UiNotificationService,
        ],
        exports: [notification_service_1.NotificationService, ui_notification_service_1.UiNotificationService],
    })
], NotificationModule);
exports.NotificationModule = NotificationModule;
