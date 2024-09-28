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
exports.CustomShortcutController = void 0;
const common_1 = require("@nestjs/common");
const custom_shortcut_service_1 = require("./custom-shortcut.service");
const custom_shortcut_entity_1 = __importDefault(require("./models/custom-shortcut.entity"));
let CustomShortcutController = class CustomShortcutController {
    constructor(service) {
        this.service = service;
    }
    async getAll() {
        return this.service.getAll();
    }
    async create(customShortcutDto) {
        return this.service.create(customShortcutDto);
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
], CustomShortcutController.prototype, "getAll", null);
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [custom_shortcut_entity_1.default]),
    __metadata("design:returntype", Promise)
], CustomShortcutController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [custom_shortcut_entity_1.default]),
    __metadata("design:returntype", Promise)
], CustomShortcutController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomShortcutController.prototype, "remove", null);
CustomShortcutController = __decorate([
    (0, common_1.Controller)('custom-shortcut'),
    __metadata("design:paramtypes", [custom_shortcut_service_1.CustomShortcutService])
], CustomShortcutController);
exports.CustomShortcutController = CustomShortcutController;
