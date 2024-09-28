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
Object.defineProperty(exports, "__esModule", { value: true });
const entity_model_1 = __importDefault(require("../../../database/models/entity.model"));
const postybirb_commons_1 = require("postybirb-commons");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const submission_part_entity_1 = __importDefault(require("../../submission-part/models/submission-part.entity"));
class SubmissionTemplateEntity extends entity_model_1.default {
    constructor(partial) {
        super(partial);
    }
}
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmissionTemplateEntity.prototype, "alias", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(postybirb_commons_1.SubmissionType),
    __metadata("design:type", String)
], SubmissionTemplateEntity.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsObject)(),
    (0, class_transformer_1.Type)(() => submission_part_entity_1.default),
    __metadata("design:type", Object)
], SubmissionTemplateEntity.prototype, "parts", void 0);
exports.default = SubmissionTemplateEntity;
