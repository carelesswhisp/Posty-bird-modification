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
var SettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const electron_1 = require("electron");
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const events_gateway_1 = require("../events/events.gateway");
let SettingsService = SettingsService_1 = class SettingsService {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(SettingsService_1.name);
        this.settings = global.settingsDB;
    }
    getSettings() {
        return this.settings.getState();
    }
    getValue(setting) {
        return this.settings.get(setting).value();
    }
    setValue(setting, value) {
        this.logger.debug(`${setting} -> ${value}`, 'Update Setting');
        if (setting === 'openOnLogin') {
            electron_1.app.setLoginItemSettings({
                openAtLogin: value,
                path: electron_1.app.getPath('exe'),
            });
        }
        this.settings.set(setting, value).write();
        this.eventEmitter.emit(postybirb_commons_1.Events.SettingEvent.UPDATED, this.settings.getState());
    }
};
SettingsService = SettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [events_gateway_1.EventsGateway])
], SettingsService);
exports.SettingsService = SettingsService;
