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
exports.TwitterController = void 0;
const common_1 = require("@nestjs/common");
const submission_post_model_1 = require("./models/submission-post.model");
const twitter_authorization_model_1 = require("./models/twitter-authorization.model");
const twitter_api_service_1 = require("./twitter-api.service");
let TwitterController = class TwitterController {
    constructor(service) {
        this.service = service;
    }
    startAuthorization(data) {
        return this.service.startAuthorization(data);
    }
    completeAuthorization(data) {
        return this.service.completeAuthorization(data);
    }
    post(apiKeys, data) {
        return this.service.post(apiKeys, data);
    }
};
__decorate([
    (0, common_1.Get)('v2/authorize'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TwitterController.prototype, "startAuthorization", null);
__decorate([
    (0, common_1.Post)('v2/authorize'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [twitter_authorization_model_1.TwitterAuthorization]),
    __metadata("design:returntype", void 0)
], TwitterController.prototype, "completeAuthorization", null);
__decorate([
    (0, common_1.Post)('v2/post'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, submission_post_model_1.SubmissionPost]),
    __metadata("design:returntype", void 0)
], TwitterController.prototype, "post", null);
TwitterController = __decorate([
    (0, common_1.Controller)('twitter'),
    __metadata("design:paramtypes", [twitter_api_service_1.TwitterAPIService])
], TwitterController);
exports.TwitterController = TwitterController;
