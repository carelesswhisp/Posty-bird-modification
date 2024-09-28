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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ImageManipulationPoolService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageManipulationPoolService = void 0;
const common_1 = require("@nestjs/common");
const os_1 = __importDefault(require("os"));
const image_manipulator_1 = __importDefault(require("../manipulators/image.manipulator"));
const ui_notification_service_1 = require("../../notification/ui-notification/ui-notification.service");
const notification_type_enum_1 = require("../../notification/enums/notification-type.enum");
const async_mutex_1 = require("async-mutex");
let ImageManipulationPoolService = ImageManipulationPoolService_1 = class ImageManipulationPoolService {
    constructor(uiNotificationService) {
        this.uiNotificationService = uiNotificationService;
        this.logger = new common_1.Logger(ImageManipulationPoolService_1.name);
        this.queue = [];
        this.inUse = [];
        this.MAX_COUNT = Math.min(os_1.default.cpus().length, 4);
        this.hasAlerted = false;
        this.mutex = new async_mutex_1.Mutex();
    }
    getImageManipulator(data, type) {
        return new Promise(async (resolve) => {
            const release = await this.mutex.acquire();
            try {
                if (data.length > image_manipulator_1.default.DEFERRED_LIMIT) {
                    if (this.inUse.length < this.MAX_COUNT) {
                        const im = await image_manipulator_1.default.build(data, type);
                        this.inUse.push(im);
                        resolve(im.onDestroy(this.onDestroyCallback.bind(this)));
                        this.logger.debug(`Pool Size = ${this.inUse.length} of ${this.MAX_COUNT}`);
                    }
                    else {
                        this.logger.debug('Queueing Image Manipulator');
                        this.queue.push({
                            resolve,
                            arguments: {
                                data,
                                type,
                            },
                        });
                        if (!this.hasAlerted) {
                            this.hasAlerted = true;
                            this.uiNotificationService.createUINotification(notification_type_enum_1.NotificationType.INFO, 0, 'PostyBirb is currently processing many image files. This may affect the time it takes to create or post image based submissions.');
                        }
                    }
                }
                else {
                    resolve(await image_manipulator_1.default.build(data, type));
                }
            }
            finally {
                release();
            }
        });
    }
    onDestroyCallback(im) {
        this.logger.debug('Destroying Image Manipulator');
        const index = this.inUse.indexOf(im);
        if (index !== -1) {
            this.inUse.splice(index, 1);
        }
        this.resolveNext();
    }
    async resolveNext() {
        if (this.queue.length) {
            this.logger.debug('Resolving next Image Manipulator');
            const next = this.queue.shift();
            const im = await image_manipulator_1.default.build(next.arguments.data, next.arguments.type);
            im.onDestroy(this.onDestroyCallback.bind(this));
            this.inUse.push(im);
            next.resolve(im);
        }
    }
};
ImageManipulationPoolService = ImageManipulationPoolService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ui_notification_service_1.UiNotificationService])
], ImageManipulationPoolService);
exports.ImageManipulationPoolService = ImageManipulationPoolService;
