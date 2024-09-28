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
exports.DescriptionTemplateController = void 0;
const common_1 = require("@nestjs/common");
const description_template_service_1 = require("./description-template.service");
const description_template_entity_1 = __importDefault(require("./models/description-template.entity"));
let DescriptionTemplateController = class DescriptionTemplateController {
    constructor(service) {
        this.service = service;
    }
    async getAll() {
        return this.service.getAll();
    }
    async create(descriptionTemplateDto) {
        return this.service.create(descriptionTemplateDto);
    }
    async update(updateDto) {
        return this.service.update(updateDto);
    }
    async remove(id) {
        return this.service.remove(id);
    }
};
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DescriptionTemplateController.prototype, "getAll", null);
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [description_template_entity_1.default]),
    __metadata("design:returntype", Promise)
], DescriptionTemplateController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [description_template_entity_1.default]),
    __metadata("design:returntype", Promise)
], DescriptionTemplateController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DescriptionTemplateController.prototype, "remove", null);
DescriptionTemplateController = __decorate([
    (0, common_1.Controller)('description-template'),
    __metadata("design:paramtypes", [description_template_service_1.DescriptionTemplateService])
], DescriptionTemplateController);
exports.DescriptionTemplateController = DescriptionTemplateController;
