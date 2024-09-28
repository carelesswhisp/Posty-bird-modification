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
exports.RemoteController = void 0;
const common_1 = require("@nestjs/common");
const remote_service_1 = require("./remote.service");
let RemoteController = class RemoteController {
    constructor(service) {
        this.service = service;
    }
    async updateCookies(body) {
        return this.service.updateCookies(body.accountId, body.cookies);
    }
    serveStaticFile(query, res) {
        if (!query.uri || !query.uri.startsWith(global.BASE_DIRECTORY)) {
            res.sendStatus(404);
            return;
        }
        res.sendFile(query.uri);
    }
    ping() {
        return 'pong';
    }
};
__decorate([
    (0, common_1.Post)('updateCookies'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RemoteController.prototype, "updateCookies", null);
__decorate([
    (0, common_1.Get)('static'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], RemoteController.prototype, "serveStaticFile", null);
__decorate([
    (0, common_1.Get)('ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RemoteController.prototype, "ping", null);
RemoteController = __decorate([
    (0, common_1.Controller)('remote'),
    __metadata("design:paramtypes", [remote_service_1.RemoteService])
], RemoteController);
exports.RemoteController = RemoteController;
