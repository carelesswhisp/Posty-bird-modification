"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtconomyFileOptionsEntity = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const default_value_decorator_1 = require("../../models/decorators/default-value.decorator");
const default_file_options_entity_1 = require("../../models/default-file-options.entity");
class ArtconomyFileOptionsEntity extends default_file_options_entity_1.DefaultFileOptionsEntity {
    constructor(entity) {
        super(entity);
    }
}
exports.ArtconomyFileOptionsEntity = ArtconomyFileOptionsEntity;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], ArtconomyFileOptionsEntity.prototype, "commentsDisabled", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(true)
], ArtconomyFileOptionsEntity.prototype, "isArtist", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    (0, default_value_decorator_1.DefaultValue)(false)
], ArtconomyFileOptionsEntity.prototype, "private", void 0);
