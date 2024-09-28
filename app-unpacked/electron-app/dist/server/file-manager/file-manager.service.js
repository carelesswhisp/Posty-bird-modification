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
var FileManagerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileManagerService = void 0;
const common_1 = require("@nestjs/common");
const chardet_1 = require("chardet");
const electron_1 = require("electron");
const fs_extra_1 = __importDefault(require("fs-extra"));
const iconv_lite_1 = require("iconv-lite");
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const shortid_1 = __importDefault(require("shortid"));
const directories_1 = require("../directories");
const image_manipulator_1 = __importDefault(require("../file-manipulation/manipulators/image.manipulator"));
const image_manipulation_pool_service_1 = require("../file-manipulation/pools/image-manipulation-pool.service");
const gif_manipulator_1 = require("../file-manipulation/manipulators/gif.manipulator");
let FileManagerService = FileManagerService_1 = class FileManagerService {
    constructor(imageManipulationPool) {
        this.imageManipulationPool = imageManipulationPool;
        this.logger = new common_1.Logger(FileManagerService_1.name);
    }
    async insertFile(id, file, filePath) {
        this.logger.debug(`${file.originalname} (${file.mimetype})`, `Uploading file ${filePath ? 'From File' : 'From Clipboard'}`);
        file = this.parseFileUpload(file);
        const fileId = `${id}-${shortid_1.default.generate()}`;
        const ext = path_1.default.extname(file.originalname);
        let submissionFilePath = path_1.default.format({
            dir: directories_1.SUBMISSION_FILE_DIRECTORY,
            name: fileId,
            ext,
        });
        let thumbnailFilePath = `${directories_1.THUMBNAIL_FILE_DIRECTORY}/${fileId}${ext}`;
        let thumbnail = null;
        if (file.mimetype.includes('image')) {
            if (file.mimetype === 'image/gif') {
                await fs_extra_1.default.outputFile(submissionFilePath, file.buffer);
                const frame0 = await gif_manipulator_1.GifManipulator.getFrame(file.buffer);
                const im = await this.imageManipulationPool.getImageManipulator(frame0, 'image/jpeg');
                thumbnail = (await im.resize(300).setQuality(99).getData()).buffer;
            }
            else if (image_manipulator_1.default.isMimeType(file.mimetype)) {
                const im = await this.imageManipulationPool.getImageManipulator(file.buffer, file.mimetype);
                try {
                    if (file.mimetype === 'image/tiff') {
                        im.toPNG();
                    }
                    const data = await im.getData();
                    file.mimetype = data.type;
                    file.buffer = data.buffer;
                    submissionFilePath = path_1.default.format({
                        dir: directories_1.SUBMISSION_FILE_DIRECTORY,
                        name: fileId,
                        ext: `.${image_manipulator_1.default.getExtension(data.type)}`,
                    });
                    const thumbnailData = await im.resize(300).setQuality(99).getData();
                    thumbnail = thumbnailData.buffer;
                    thumbnailFilePath = `${directories_1.THUMBNAIL_FILE_DIRECTORY}/${fileId}.${image_manipulator_1.default.getExtension(thumbnailData.type)}`;
                }
                catch (err) {
                    this.logger.error(err.message, err.stack);
                    throw err;
                }
                finally {
                    im.destroy();
                }
            }
            else {
                thumbnail = file.buffer;
            }
        }
        else {
            thumbnailFilePath = path_1.default.format({ dir: directories_1.THUMBNAIL_FILE_DIRECTORY, name: fileId, ext: '.jpg' });
            try {
                thumbnail = (await electron_1.app.getFileIcon(filePath)).toJPEG(100);
            }
            catch (err) {
            }
        }
        await fs_extra_1.default.outputFile(submissionFilePath, file.buffer);
        await fs_extra_1.default.outputFile(thumbnailFilePath, thumbnail ? thumbnail : (await electron_1.app.getFileIcon(submissionFilePath)).toJPEG(100));
        return {
            thumbnailLocation: thumbnailFilePath,
            submissionLocation: submissionFilePath,
        };
    }
    async insertFileDirectly(file, filename) {
        const filepath = path_1.default.format({ dir: directories_1.SUBMISSION_FILE_DIRECTORY, name: filename });
        file = this.parseFileUpload(file);
        await fs_extra_1.default.outputFile(filepath, file.buffer);
        return filepath;
    }
    async removeSubmissionFiles(submission) {
        this.logger.debug(submission._id, 'Removing Files');
        const files = [
            submission.primary,
            submission.thumbnail,
            submission.fallback,
            ...(submission.additional || []),
        ];
        await Promise.all(files.filter(f => !!f).map(f => this.removeSubmissionFile(f)));
    }
    scaleImage(file, scalePx) {
        let image = electron_1.nativeImage.createFromBuffer(file.buffer);
        const { width, height } = image.getSize();
        const ar = image.getAspectRatio();
        if (ar >= 1) {
            if (width > scalePx) {
                image = image.resize({
                    width: scalePx,
                    height: scalePx / ar,
                });
            }
        }
        else {
            if (height > scalePx) {
                image = image.resize({
                    width: scalePx * ar,
                    height: scalePx,
                });
            }
        }
        const copy = lodash_1.default.cloneDeep(file);
        copy.buffer = image.toJPEG(100);
        copy.mimetype = 'image/jpeg';
        return copy;
    }
    async removeSubmissionFile(record) {
        this.logger.debug(record.location, 'Remove Submission File');
        if (record.location) {
            await fs_extra_1.default.remove(record.location);
        }
        if (record.preview) {
            await fs_extra_1.default.remove(record.preview);
        }
    }
    async copyFileWithNewId(id, file) {
        this.logger.debug(`Copying file ${file.location} with name ${id}`, 'Copy File');
        const parts = path_1.default.parse(file.location);
        const newId = `${id}-${shortid_1.default.generate()}`;
        const filePath = path_1.default.format({ dir: parts.dir, name: newId, ext: parts.ext });
        await fs_extra_1.default.copy(file.location, filePath);
        file.location = filePath;
        if (file.preview) {
            const thumbPathParts = path_1.default.parse(file.preview);
            const thumbPath = path_1.default.format({ dir: thumbPathParts.dir, name: newId, ext: '.jpg' });
            await fs_extra_1.default.copy(file.preview, thumbPath);
            file.preview = thumbPath;
        }
        return file;
    }
    parseFileUpload(file) {
        if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
            const encoding = (0, chardet_1.detect)(file.buffer);
            file.buffer = Buffer.from((0, iconv_lite_1.decode)(file.buffer, encoding));
        }
        return file;
    }
};
FileManagerService = FileManagerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [image_manipulation_pool_service_1.ImageManipulationPoolService])
], FileManagerService);
exports.FileManagerService = FileManagerService;
