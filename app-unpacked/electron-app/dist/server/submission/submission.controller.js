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
exports.SubmissionController = void 0;
const common_1 = require("@nestjs/common");
const submission_service_1 = require("./submission.service");
const submission_importer_service_1 = require("./submission-importer/submission-importer.service");
const postybirb_commons_1 = require("postybirb-commons");
const platform_express_1 = require("@nestjs/platform-express");
const submission_schedule_model_1 = __importDefault(require("./models/submission-schedule.model"));
const submission_log_entity_1 = __importDefault(require("./log/models/submission-log.entity"));
const submission_create_model_1 = __importDefault(require("./models/submission-create.model"));
const submission_import_model_1 = __importDefault(require("./models/submission-import.model"));
let SubmissionController = class SubmissionController {
    constructor(service, importerService) {
        this.service = service;
        this.importerService = importerService;
    }
    isTrue(value) {
        return value === 'true' || value === '';
    }
    async getSubmissions(packaged, submissionType) {
        return this.isTrue(packaged)
            ? this.service.getAllAndValidate(submissionType)
            : this.service.getAll(submissionType);
    }
    async get(id, packaged) {
        return this.isTrue(packaged) ? this.service.getAndValidate(id) : this.service.get(id);
    }
    async remove(id) {
        return this.service.deleteSubmission(id);
    }
    async create(create, file) {
        create.file = file;
        return this.service.create(create);
    }
    async recreateFromLog(log) {
        return this.service.recreate(log);
    }
    async importDirectory({ path }) {
        return this.importerService.importDirectory(path);
    }
    async update(submissionPackage) {
        return this.service.updateSubmission(submissionPackage);
    }
    async overwriteSubmissionParts(submissionOverwrite) {
        return this.service.overwriteSubmissionParts(submissionOverwrite);
    }
    async changeOrder(body) {
        return this.service.changeOrder(body.id, body.to, body.from);
    }
    async setPostAt(body, id) {
        return this.service.setPostAt(id, body.postAt);
    }
    async dryValidate(body) {
        return this.service.dryValidate(body.id, body.parts || []);
    }
    async duplicate(id) {
        return this.service.duplicate(id);
    }
    async scheduleSubmission(data, id) {
        return this.service.scheduleSubmission(id, data.isScheduled, data.postAt);
    }
    async splitAdditional(id) {
        return this.service.splitAdditionalIntoSubmissions(id);
    }
    async getFallbackText(id) {
        return this.service.getFallbackText(id);
    }
    async removeThumbnail(id) {
        return this.service.removeFileSubmissionThumbnail(id);
    }
    async removeAdditionalFile(params) {
        return this.service.removeFileSubmissionAdditionalFile(params.id, params.location);
    }
    async changePrimary(file, params, body) {
        return this.service.changeFileSubmissionPrimaryFile(file, params.id, body.path);
    }
    async changeFallback(file, id) {
        return this.service.setFallbackFile(file, id);
    }
    async changeThumbnail(file, params, body) {
        return this.service.changeFileSubmissionThumbnailFile(file, params.id, body.path);
    }
    async addAdditionalFile(file, params, body) {
        return this.service.addFileSubmissionAdditionalFile(file, params.id, body.path);
    }
    async updateAdditionalFileData(record, id) {
        return this.service.updateFileSubmissionAdditionalFile(id, record);
    }
};
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('packaged')),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "getSubmissions", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('packaged')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "get", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('create'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submission_create_model_1.default, Object]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('recreate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submission_log_entity_1.default]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "recreateFromLog", null);
__decorate([
    (0, common_1.Post)('import'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submission_import_model_1.default]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "importDirectory", null);
__decorate([
    (0, common_1.Patch)('update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('overwrite'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "overwriteSubmissionParts", null);
__decorate([
    (0, common_1.Post)('changeOrder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "changeOrder", null);
__decorate([
    (0, common_1.Patch)('set/postAt/:id'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submission_schedule_model_1.default, String]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "setPostAt", null);
__decorate([
    (0, common_1.Post)('dryValidate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "dryValidate", null);
__decorate([
    (0, common_1.Post)('duplicate/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "duplicate", null);
__decorate([
    (0, common_1.Post)('schedule/:id'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "scheduleSubmission", null);
__decorate([
    (0, common_1.Post)('splitAdditional/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "splitAdditional", null);
__decorate([
    (0, common_1.Get)('fallback/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "getFallbackText", null);
__decorate([
    (0, common_1.Delete)('remove/thumbnail/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "removeThumbnail", null);
__decorate([
    (0, common_1.Delete)('remove/additional/:id/:location'),
    __param(0, (0, common_1.Param)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "removeAdditionalFile", null);
__decorate([
    (0, common_1.Post)('change/primary/:id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "changePrimary", null);
__decorate([
    (0, common_1.Post)('change/fallback/:id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "changeFallback", null);
__decorate([
    (0, common_1.Post)('change/thumbnail/:id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "changeThumbnail", null);
__decorate([
    (0, common_1.Post)('add/additional/:id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Param)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "addAdditionalFile", null);
__decorate([
    (0, common_1.Patch)('update/additional/:id'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SubmissionController.prototype, "updateAdditionalFileData", null);
SubmissionController = __decorate([
    (0, common_1.Controller)('submission'),
    __metadata("design:paramtypes", [submission_service_1.SubmissionService,
        submission_importer_service_1.SubmissionImporterService])
], SubmissionController);
exports.SubmissionController = SubmissionController;
