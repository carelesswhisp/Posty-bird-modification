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
var UpdateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateService = void 0;
const common_1 = require("@nestjs/common");
const events_gateway_1 = require("../events/events.gateway");
const electron_updater_1 = require("electron-updater");
const electron_1 = require("electron");
const post_service_1 = require("../submission/post/post.service");
const schedule_1 = require("@nestjs/schedule");
const custom_logger_1 = require("../custom.logger");
const postybirb_commons_1 = require("postybirb-commons");
let UpdateService = UpdateService_1 = class UpdateService {
    constructor(eventEmitter, postService) {
        this.eventEmitter = eventEmitter;
        this.postService = postService;
        this.logger = new common_1.Logger(UpdateService_1.name);
        this.DEBUG_MODE = global.DEBUG_MODE;
        this.isUpdating = false;
        this.updateAvailable = {
            available: false,
            error: '',
            isUpdating: false,
            percent: 0,
            releaseNotes: '',
            version: '',
        };
        electron_updater_1.autoUpdater.logger = custom_logger_1.CustomLogger.logger;
        electron_updater_1.autoUpdater.autoDownload = false;
        electron_updater_1.autoUpdater.fullChangelog = true;
        electron_updater_1.autoUpdater.on('checking-for-update', () => this.logger.log('Checking for update...'));
        electron_updater_1.autoUpdater.on('update-available', info => {
            this.updateAvailable.available = true;
            if (Array.isArray(info.releaseNotes)) {
                this.updateAvailable.releaseNotes = info.releaseNotes
                    .map(note => `<h2>${note.version}</h2>${note.note}`)
                    .join('\n');
            }
            this.updateAvailable.version = info.version;
            this.eventEmitter.emit(postybirb_commons_1.Events.UpdateEvent.AVAILABLE, this.updateAvailable);
        });
        electron_updater_1.autoUpdater.on('download-progress', ({ percent }) => {
            this.updateAvailable.percent = percent;
            this.eventEmitter.emit(postybirb_commons_1.Events.UpdateEvent.AVAILABLE, this.updateAvailable);
        });
        electron_updater_1.autoUpdater.on('error', err => {
            this.isUpdating = false;
            this.updateAvailable.isUpdating = false;
            this.updateAvailable.error = err.toString();
            this.updateAvailable.percent = 0;
            this.logger.error(err);
            this.eventEmitter.emit(postybirb_commons_1.Events.UpdateEvent.AVAILABLE, this.updateAvailable);
            this.eventEmitter.emit(postybirb_commons_1.Events.UpdateEvent.ERROR, err);
        });
        electron_updater_1.autoUpdater.on('update-downloaded', () => {
            this.updateAvailable.percent = 100;
            this.updateAvailable.isUpdating = false;
            this.eventEmitter.emit(postybirb_commons_1.Events.UpdateEvent.AVAILABLE, this.updateAvailable);
            if (!this.postService.isCurrentlyPostingToAny()) {
                electron_1.BrowserWindow.getAllWindows().forEach(w => {
                    w.destroy();
                });
                setTimeout(() => electron_updater_1.autoUpdater.quitAndInstall(false, true), 1000);
            }
            else {
                this.eventEmitter.emit(postybirb_commons_1.Events.UpdateEvent.BLOCKED, true);
            }
        });
        setTimeout(() => this.checkForUpdate(), 5000);
    }
    updateInfo() {
        return this.updateAvailable || {};
    }
    async update() {
        if (!this.updateAvailable || this.DEBUG_MODE) {
            throw new common_1.BadRequestException('No update available');
        }
        if (this.isUpdating) {
            throw new common_1.BadRequestException('Already updating');
        }
        this.logger.log('Updating PostyBirb...');
        this.isUpdating = true;
        this.updateAvailable.isUpdating = true;
        this.updateAvailable.error = '';
        this.eventEmitter.emit(postybirb_commons_1.Events.UpdateEvent.AVAILABLE, this.updateAvailable);
        electron_updater_1.autoUpdater.downloadUpdate();
    }
    checkForUpdate() {
        if (this.updateAvailable.available || this.DEBUG_MODE || this.isUpdating) {
            return;
        }
        electron_updater_1.autoUpdater.checkForUpdates();
    }
};
__decorate([
    (0, schedule_1.Interval)(3600000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UpdateService.prototype, "checkForUpdate", null);
UpdateService = UpdateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [events_gateway_1.EventsGateway,
        post_service_1.PostService])
], UpdateService);
exports.UpdateService = UpdateService;
