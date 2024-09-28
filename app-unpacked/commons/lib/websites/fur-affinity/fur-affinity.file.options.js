"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FurAffinityFileOptionsEntity = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const default_value_decorator_1 = require("../../models/decorators/default-value.decorator");
const default_file_options_entity_1 = require("../../models/default-file-options.entity");
class FurAffinityFileOptionsEntity extends default_file_options_entity_1.DefaultFileOptionsEntity {
    constructor(entity) {
        super(entity);
    }
}
exports.FurAffinityFileOptionsEntity = FurAffinityFileOptionsEntity;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsString)(),
    (0, default_value_decorator_1.DefaultValue)('1')
], FurAffinityFileOptionsEntity.prototype, "category", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], FurAffinityFileOptionsEntity.prototype, "disableComments", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsArray)(),
    (0, default_value_decorator_1.DefaultValue)([])
], FurAffinityFileOptionsEntity.prototype, "folders", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsString)(),
    (0, default_value_decorator_1.DefaultValue)('0')
], FurAffinityFileOptionsEntity.prototype, "gender", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(true)
], FurAffinityFileOptionsEntity.prototype, "reupload", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], FurAffinityFileOptionsEntity.prototype, "scraps", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsString)(),
    (0, default_value_decorator_1.DefaultValue)('1')
], FurAffinityFileOptionsEntity.prototype, "species", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsString)(),
    (0, default_value_decorator_1.DefaultValue)('1')
], FurAffinityFileOptionsEntity.prototype, "theme", void 0);
