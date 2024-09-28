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
exports.TelegramController = void 0;
const common_1 = require("@nestjs/common");
const generic_controller_1 = require("../generic/generic.controller");
const telegram_service_1 = require("./telegram.service");
let TelegramController = class TelegramController extends generic_controller_1.GenericWebsiteController {
    constructor(service) {
        super(service);
        this.service = service;
    }
    async authenticate(data) {
        return this.service.authenticate(data);
    }
    async startAuthentication(data) {
        return this.service.startAuthentication(data);
    }
};
__decorate([
    (0, common_1.Post)('authenticate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "authenticate", null);
__decorate([
    (0, common_1.Post)('startAuthentication'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TelegramController.prototype, "startAuthentication", null);
TelegramController = __decorate([
    (0, common_1.Controller)('telegram'),
    __metadata("design:paramtypes", [telegram_service_1.Telegram])
], TelegramController);
exports.TelegramController = TelegramController;
