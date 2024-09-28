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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionTemplateController = void 0;
const common_1 = require("@nestjs/common");
const submission_template_service_1 = require("./submission-template.service");
const create_template_model_1 = require("./models/create-template.model");
const update_template_model_1 = require("./models/update-template.model");
let SubmissionTemplateController = class SubmissionTemplateController {
    constructor(service) {
        this.service = service;
    }
    async getAll() {
        return this.service.getAll();
    }
    async getById(id) {
        return this.service.get(id);
    }
    async create(createDto) {
        return this.service.create(createDto);
    }
    async remove(id) {
        return this.service.remove(id);
    }
    async update(updateDto) {
        return this.service.update(updateDto);
    }
    async updateAlias(update) {
        return this.service.updateAlias(update.id, update.alias);
    }
};
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubmissionTemplateController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubmissionTemplateController.prototype, "getById", null);
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_template_model_1.CreateSubmissionTemplateModel]),
    __metadata("design:returntype", Promise)
], SubmissionTemplateController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubmissionTemplateController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)('update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_template_model_1.UpdateSubmissionTemplateModel]),
    __metadata("design:returntype", Promise)
], SubmissionTemplateController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)('rename'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubmissionTemplateController.prototype, "updateAlias", null);
SubmissionTemplateController = __decorate([
    (0, common_1.Controller)('submission-template'),
    __metadata("design:paramtypes", [submission_template_service_1.SubmissionTemplateService])
], SubmissionTemplateController);
exports.SubmissionTemplateController = SubmissionTemplateController;
