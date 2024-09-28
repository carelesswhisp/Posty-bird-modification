"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultOptionsEntity = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class DefaultOptionsEntity {
    constructor(entity) {
        this.sources = [];
        this.tags = {
            value: [],
            extendDefault: true,
        };
        this.description = {
            value: '',
            overwriteDefault: false,
        };
        Object.assign(this, entity);
    }
    assignIfEmpty(prop, value, defaultValue) {
        if (this[prop] === undefined) {
            if (value !== undefined) {
                this[prop] = value;
            }
            else {
                this[prop] = defaultValue;
            }
        }
    }
    validateSync() {
        return (0, class_validator_1.validateSync)(this);
    }
    validate() {
        return (0, class_validator_1.validate)(this);
    }
    asPlain() {
        return (0, class_transformer_1.classToPlain)(this);
    }
}
exports.DefaultOptionsEntity = DefaultOptionsEntity;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200)
], DefaultOptionsEntity.prototype, "title", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsNotEmpty)()
], DefaultOptionsEntity.prototype, "tags", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsNotEmpty)()
], DefaultOptionsEntity.prototype, "description", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsOptional)()
], DefaultOptionsEntity.prototype, "rating", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsOptional)()
], DefaultOptionsEntity.prototype, "spoilerText", void 0);
__decorate([
    (0, class_validator_1.IsArray)()
], DefaultOptionsEntity.prototype, "sources", void 0);
