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
var FileSubmissionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSubmissionService = void 0;
const common_1 = require("@nestjs/common");
const file_manager_service_1 = require("../../file-manager/file-manager.service");
const file_submission_type_helper_1 = require("./helpers/file-submission-type.helper");
const postybirb_commons_1 = require("postybirb-commons");
const file_submission_entity_1 = __importDefault(require("./models/file-submission.entity"));
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const image_manipulation_pool_service_1 = require("../../file-manipulation/pools/image-manipulation-pool.service");
const path_1 = __importDefault(require("path"));
let FileSubmissionService = FileSubmissionService_1 = class FileSubmissionService {
    constructor(fileRepository, imageManipulationPool) {
        this.fileRepository = fileRepository;
        this.imageManipulationPool = imageManipulationPool;
        this.logger = new common_1.Logger(FileSubmissionService_1.name);
    }
    async createSubmission(submission, data) {
        const { file } = data;
        if (!file) {
            throw new common_1.BadRequestException('FileSubmission requires a file');
        }
        const title = path_1.default.parse(file.originalname).name;
        const locations = await this.fileRepository.insertFile(submission._id, file, data.path);
        const completedSubmission = new file_submission_entity_1.default(Object.assign(Object.assign({}, submission), { title, primary: {
                location: locations.submissionLocation,
                mimetype: file.mimetype,
                name: file.originalname,
                originalPath: data.path,
                preview: locations.thumbnailLocation,
                size: file.buffer.length,
                type: (0, file_submission_type_helper_1.getSubmissionType)(file.mimetype, file.originalname),
            } }));
        if (file.mimetype.includes('image/jpeg') || file.mimetype.includes('image/png')) {
            const im = await this.imageManipulationPool.getImageManipulator(file.buffer, file.mimetype);
            completedSubmission.primary.height = im.getHeight();
            completedSubmission.primary.width = im.getWidth();
            im.destroy();
        }
        return completedSubmission;
    }
    async cleanupSubmission(submission) {
        await this.fileRepository.removeSubmissionFiles(submission);
    }
    async changePrimaryFile(submission, file, path) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        await this.fileRepository.removeSubmissionFile(submission.primary);
        const locations = await this.fileRepository.insertFile(submission._id, file, path);
        submission.primary = {
            location: locations.submissionLocation,
            mimetype: file.mimetype,
            name: file.originalname,
            originalPath: path,
            preview: locations.thumbnailLocation,
            size: file.buffer.length,
            type: (0, file_submission_type_helper_1.getSubmissionType)(file.mimetype, file.originalname),
        };
        if (file.mimetype.includes('image/jpeg') || file.mimetype.includes('image/png')) {
            const im = await this.imageManipulationPool.getImageManipulator(file.buffer, file.mimetype);
            submission.primary.height = im.getHeight();
            submission.primary.width = im.getWidth();
            im.destroy();
        }
        return submission;
    }
    async changeThumbnailFile(submission, file, path) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        if (!(file.mimetype.includes('image/jpeg') || file.mimetype.includes('image/png'))) {
            throw new common_1.BadRequestException('Thumbnail file must be png or jpeg');
        }
        if (submission.thumbnail) {
            await this.fileRepository.removeSubmissionFile(submission.thumbnail);
        }
        const scaledUpload = this.fileRepository.scaleImage(file, 640);
        const locations = await this.fileRepository.insertFile(submission._id, file, path);
        submission.thumbnail = {
            location: locations.submissionLocation,
            mimetype: scaledUpload.mimetype,
            name: scaledUpload.originalname,
            originalPath: path,
            preview: locations.thumbnailLocation,
            size: scaledUpload.buffer.length,
            type: (0, file_submission_type_helper_1.getSubmissionType)(scaledUpload.mimetype, scaledUpload.originalname),
        };
        if (file.mimetype.includes('image/jpeg') || file.mimetype.includes('image/png')) {
            const im = await this.imageManipulationPool.getImageManipulator(scaledUpload.buffer, scaledUpload.mimetype);
            submission.thumbnail.width = im.getWidth();
            submission.thumbnail.height = im.getHeight();
            im.destroy();
        }
        return submission;
    }
    async changeFallbackFile(submission, file) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        if (submission.fallback) {
            await this.fileRepository.removeSubmissionFile(submission.fallback);
        }
        const location = await this.fileRepository.insertFileDirectly(file, `${submission._id}-fallback.html`);
        submission.fallback = {
            location,
            mimetype: 'text/html',
            name: `${submission._id}-fallback.html`,
            originalPath: '',
            preview: '',
            size: file.buffer.length,
            type: postybirb_commons_1.FileSubmissionType.TEXT,
        };
        return submission;
    }
    async removeFallbackFile(submission) {
        if (submission.fallback) {
            await this.fileRepository.removeSubmissionFile(submission.fallback);
            submission.fallback = undefined;
        }
        return submission;
    }
    async removeThumbnail(submission) {
        if (submission.thumbnail) {
            await this.fileRepository.removeSubmissionFile(submission.thumbnail);
            submission.thumbnail = undefined;
        }
        return submission;
    }
    async addAdditionalFile(submission, file, path) {
        const locations = await this.fileRepository.insertFile(submission._id, file, path);
        let additionalSub = {
            location: locations.submissionLocation,
            mimetype: file.mimetype,
            name: file.originalname,
            originalPath: path,
            preview: locations.thumbnailLocation,
            size: file.buffer.length,
            type: (0, file_submission_type_helper_1.getSubmissionType)(file.mimetype, file.originalname),
            ignoredAccounts: [],
            height: 0,
            width: 0,
            altText: '',
        };
        if (file.mimetype.includes('image/jpeg') || file.mimetype.includes('image/png')) {
            const im = await this.imageManipulationPool.getImageManipulator(file.buffer, file.mimetype);
            additionalSub.height = im.getHeight();
            additionalSub.width = im.getWidth();
            im.destroy();
        }
        submission.additional.push(additionalSub);
        return submission;
    }
    async removeAdditionalFile(submission, location) {
        if (submission.additional && submission.additional.length) {
            const index = submission.additional.findIndex(a => a.location === location);
            if (index !== -1) {
                await this.fileRepository.removeSubmissionFile(submission.additional[index]);
                submission.additional.splice(index, 1);
            }
        }
        return submission;
    }
    async duplicateSubmission(submission) {
        const { _id } = submission;
        const duplicate = submission.copy();
        duplicate.primary = await this.fileRepository.copyFileWithNewId(_id, duplicate.primary);
        if (duplicate.thumbnail) {
            duplicate.thumbnail = await this.fileRepository.copyFileWithNewId(_id, duplicate.thumbnail);
        }
        if (duplicate.fallback) {
            duplicate.fallback = await this.fileRepository.copyFileWithNewId(_id, duplicate.fallback);
        }
        if (duplicate.additional && duplicate.additional.length) {
            for (let i = 0; i < duplicate.additional.length; i++) {
                duplicate.additional[i] = await this.fileRepository.copyFileWithNewId(_id, duplicate.additional[i]);
            }
        }
        return duplicate;
    }
};
FileSubmissionService = FileSubmissionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [file_manager_service_1.FileManagerService,
        image_manipulation_pool_service_1.ImageManipulationPoolService])
], FileSubmissionService);
exports.FileSubmissionService = FileSubmissionService;
