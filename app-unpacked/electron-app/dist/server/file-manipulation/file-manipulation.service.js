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
var FileManipulationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileManipulationService = void 0;
const common_1 = require("@nestjs/common");
const settings_service_1 = require("../settings/settings.service");
const image_manipulator_1 = __importDefault(require("./manipulators/image.manipulator"));
const image_manipulation_pool_service_1 = require("./pools/image-manipulation-pool.service");
const scaling_options_interface_1 = require("../websites/interfaces/scaling-options.interface");
let FileManipulationService = FileManipulationService_1 = class FileManipulationService {
    constructor(settings, imageManipulationPool) {
        this.settings = settings;
        this.imageManipulationPool = imageManipulationPool;
        this.logger = new common_1.Logger(FileManipulationService_1.name);
    }
    async scale(buffer, mimeType, scalingOptions, settings) {
        let targetSize = scalingOptions.maxSize;
        let newBuffer = buffer;
        let newMimeType = mimeType;
        if (image_manipulator_1.default.isMimeType(mimeType)) {
            const im = await this.imageManipulationPool.getImageManipulator(buffer, mimeType);
            this.logger.debug('Acquired Image Manipulator');
            try {
                let skipRescale = false;
                if (scalingOptions.maxHeight || scalingOptions.maxWidth) {
                    let maxSize = 0;
                    if (scalingOptions.maxWidth) {
                        maxSize = scalingOptions.maxWidth;
                    }
                    if (scalingOptions.maxHeight && scalingOptions.maxHeight < maxSize) {
                        maxSize = scalingOptions.maxHeight;
                    }
                    if (maxSize < im.getHeight() || maxSize < im.getWidth()) {
                        const scaled = await im.resize(maxSize).getData();
                        newBuffer = scaled.buffer;
                        if (newBuffer.length > targetSize) {
                            this.logger.debug(`newBuffer still in excess of the target size; will need to rescale by size not px`);
                        }
                        else {
                            skipRescale = true;
                        }
                    }
                }
                if (!skipRescale) {
                    const originalFileSize = buffer.length;
                    if (originalFileSize > targetSize) {
                        if (settings.convertToJPEG) {
                            im.toJPEG();
                        }
                        const pngScaledBuffer = await this.scalePNG(im, originalFileSize, targetSize);
                        if (!pngScaledBuffer) {
                            const jpgScaledBuffer = await this.scaleJPEG(im, originalFileSize, targetSize);
                            if (!jpgScaledBuffer) {
                                this.logger.warn(`Unable to successfully scale image down to ${targetSize} bytes from ${originalFileSize} bytes`);
                                throw new common_1.InternalServerErrorException(`Unable to successfully scale image down to ${targetSize} bytes from ${originalFileSize} bytes`);
                            }
                            else {
                                newMimeType = 'image/jpeg';
                                newBuffer = jpgScaledBuffer;
                            }
                        }
                        else {
                            newMimeType = 'image/png';
                            newBuffer = pngScaledBuffer;
                        }
                    }
                }
            }
            finally {
                im.destroy();
                this.logger.debug('Released Image Manipulator');
            }
        }
        if (buffer.length !== newBuffer.length) {
            this.logger.log(`File scaled from ${(buffer.length / 1048576).toFixed(2)}MB -> ${(newBuffer.length / 1048576).toFixed(2)}MB`);
        }
        if (mimeType !== newMimeType) {
            this.logger.debug(`File MIME changed from ${mimeType} -> ${newMimeType}`);
        }
        return { buffer: newBuffer, mimetype: newMimeType };
    }
    canScale(mimeType) {
        return image_manipulator_1.default.isMimeType(mimeType);
    }
    async scalePNG(im, originalSize, targetSize) {
        if (im.getMimeType() === 'image/jpeg') {
            return null;
        }
        im.toPNG();
        let reductionValue = this.settings.getValue('maxPNGSizeCompression');
        if (im.hasTransparency()) {
            reductionValue = this.settings.getValue('maxPNGSizeCompressionWithAlpha');
        }
        const scaleSize = originalSize / targetSize > 1.5 ? 20 : 10;
        const scaleSteps = this.getSteps(reductionValue, scaleSize).map(step => 1 - step / 100);
        const lastStep = scaleSteps.pop();
        const lastScaled = await im.scale(lastStep).getData();
        if (lastScaled.buffer.length > targetSize) {
            return null;
        }
        for (const scale of scaleSteps) {
            const scaled = await im.scale(scale).getData();
            if (scaled.buffer.length <= targetSize) {
                this.logger.log(`File Compressed successfully at ${scale} scale`, 'PNG COMPRESSION');
                return scaled.buffer;
            }
        }
        this.logger.log(`File Compressed successfully at ${lastStep} scale`, 'PNG COMPRESSION');
        return lastScaled.buffer;
    }
    async scaleJPEG(im, originalSize, targetSize) {
        const maxQualityReduction = this.settings.getValue('maxJPEGQualityCompression');
        const maxSizeReduction = this.settings.getValue('maxJPEGSizeCompression');
        im.toJPEG().setQuality(100);
        const scaleSize = originalSize / targetSize > 2 ? 20 : 10;
        const scaleSteps = this.getSteps(maxSizeReduction, scaleSize).map(step => 1 - step / 100);
        const lastStep = scaleSteps[scaleSteps.length - 1];
        const lastScaled = await im.scale(lastStep).getData();
        if (lastScaled.buffer.length <= targetSize) {
            if (lastScaled.buffer.length === targetSize) {
                this.logger.log(`File Compressed successfully at ${lastStep} scale`, 'JPEG SCALE COMPRESSION');
                return lastScaled.buffer;
            }
            for (const scale of scaleSteps.slice(0, -1)) {
                const scaled = await im.scale(scale).getData();
                if (scaled.buffer.length <= targetSize) {
                    this.logger.log(`File Compressed successfully at ${scale} scale`, 'JPEG SCALE COMPRESSION');
                    return scaled.buffer;
                }
            }
            this.logger.log(`File Compressed successfully at ${lastStep} scale`, 'JPEG SCALE COMPRESSION');
            return lastScaled.buffer;
        }
        const qualitySteps = [
            99,
            ...this.getSteps(maxQualityReduction, 2).map(step => (1 - step / 100) * 100),
        ];
        for (const scale of scaleSteps) {
            for (const quality of qualitySteps) {
                im.toJPEG(quality).scale(scale);
                const scaled = await im.getData();
                if (scaled.buffer.length <= targetSize) {
                    this.logger.log(`File Compressed successfully at ${quality}% quality and ${scale} scale`, 'JPEG SCALE AND QUALITY COMPRESSION');
                    return scaled.buffer;
                }
            }
        }
        return null;
    }
    getSteps(value, stepSize) {
        if (!value) {
            return [];
        }
        const steps = [];
        for (let i = stepSize || 5; i < value; i += stepSize || 5) {
            steps.push(i);
        }
        return [...steps, value];
    }
};
FileManipulationService = FileManipulationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [settings_service_1.SettingsService,
        image_manipulation_pool_service_1.ImageManipulationPoolService])
], FileManipulationService);
exports.FileManipulationService = FileManipulationService;
