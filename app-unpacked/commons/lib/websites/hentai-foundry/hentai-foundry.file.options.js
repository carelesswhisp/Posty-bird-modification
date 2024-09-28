"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HentaiFoundryFileOptionsEntity = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const default_value_decorator_1 = require("../../models/decorators/default-value.decorator");
const default_file_options_entity_1 = require("../../models/default-file-options.entity");
class HentaiFoundryFileOptionsEntity extends default_file_options_entity_1.DefaultFileOptionsEntity {
    constructor(entity) {
        super(entity);
    }
}
exports.HentaiFoundryFileOptionsEntity = HentaiFoundryFileOptionsEntity;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], HentaiFoundryFileOptionsEntity.prototype, "scraps", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], HentaiFoundryFileOptionsEntity.prototype, "disableComments", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], HentaiFoundryFileOptionsEntity.prototype, "category", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsString)(),
    (0, default_value_decorator_1.DefaultValue)('0')
], HentaiFoundryFileOptionsEntity.prototype, "nudityRating", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsString)(),
    (0, default_value_decorator_1.DefaultValue)('0')
], HentaiFoundryFileOptionsEntity.prototype, "violenceRating", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsString)(),
    (0, default_value_decorator_1.DefaultValue)('0')
], HentaiFoundryFileOptionsEntity.prototype, "profanityRating", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsString)(),
    (0, default_value_decorator_1.DefaultValue)('0')
], HentaiFoundryFileOptionsEntity.prototype, "racismRating", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsString)(),
    (0, default_value_decorator_1.DefaultValue)('0')
], HentaiFoundryFileOptionsEntity.prototype, "sexRating", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsString)(),
    (0, default_value_decorator_1.DefaultValue)('0')
], HentaiFoundryFileOptionsEntity.prototype, "spoilersRating", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], HentaiFoundryFileOptionsEntity.prototype, "yaoi", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], HentaiFoundryFileOptionsEntity.prototype, "yuri", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], HentaiFoundryFileOptionsEntity.prototype, "teen", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], HentaiFoundryFileOptionsEntity.prototype, "guro", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], HentaiFoundryFileOptionsEntity.prototype, "furry", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], HentaiFoundryFileOptionsEntity.prototype, "beast", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], HentaiFoundryFileOptionsEntity.prototype, "male", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], HentaiFoundryFileOptionsEntity.prototype, "female", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], HentaiFoundryFileOptionsEntity.prototype, "futa", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], HentaiFoundryFileOptionsEntity.prototype, "other", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], HentaiFoundryFileOptionsEntity.prototype, "scat", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], HentaiFoundryFileOptionsEntity.prototype, "incest", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], HentaiFoundryFileOptionsEntity.prototype, "rape", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsString)(),
    (0, default_value_decorator_1.DefaultValue)('0')
], HentaiFoundryFileOptionsEntity.prototype, "media", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], HentaiFoundryFileOptionsEntity.prototype, "timeTaken", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsString)(),
    (0, default_value_decorator_1.DefaultValue)('0')
], HentaiFoundryFileOptionsEntity.prototype, "license", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)()
], HentaiFoundryFileOptionsEntity.prototype, "reference", void 0);
