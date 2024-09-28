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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateController = void 0;
const common_1 = require("@nestjs/common");
const update_service_1 = require("./update.service");
let UpdateController = class UpdateController {
    constructor(service) {
        this.service = service;
    }
    checkForUpdate() {
        this.service.checkForUpdate();
    }
    async getUpdateInfo() {
        return this.service.updateInfo();
    }
    async update() {
        return this.service.update();
    }
};
__decorate([
    (0, common_1.Get)('check'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UpdateController.prototype, "checkForUpdate", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UpdateController.prototype, "getUpdateInfo", null);
__decorate([
    (0, common_1.Post)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UpdateController.prototype, "update", null);
UpdateController = __decorate([
    (0, common_1.Controller)('update'),
    __metadata("design:paramtypes", [update_service_1.UpdateService])
], UpdateController);
exports.UpdateController = UpdateController;
