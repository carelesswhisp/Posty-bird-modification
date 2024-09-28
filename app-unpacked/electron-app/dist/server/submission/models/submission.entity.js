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
const entity_model_1 = __importDefault(require("../../database/models/entity.model"));
const postybirb_commons_1 = require("postybirb-commons");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const submission_schedule_model_1 = __importDefault(require("./submission-schedule.model"));
class SubmissionEntity extends entity_model_1.default {
    constructor(partial) {
        super(partial);
    }
}
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SubmissionEntity.prototype, "isPosting", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SubmissionEntity.prototype, "isQueued", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_transformer_1.Type)(() => submission_schedule_model_1.default),
    __metadata("design:type", submission_schedule_model_1.default)
], SubmissionEntity.prototype, "schedule", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], SubmissionEntity.prototype, "sources", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubmissionEntity.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(postybirb_commons_1.SubmissionType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubmissionEntity.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubmissionEntity.prototype, "order", void 0);
exports.default = SubmissionEntity;
