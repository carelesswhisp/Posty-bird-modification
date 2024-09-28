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
exports.PostController = void 0;
const lodash_1 = __importDefault(require("lodash"));
const common_1 = require("@nestjs/common");
const post_service_1 = require("./post.service");
const submission_service_1 = require("../submission.service");
let PostController = class PostController {
    constructor(service, submissionService) {
        this.service = service;
        this.submissionService = submissionService;
    }
    async getStatus() {
        return this.service.getPostingStatus();
    }
    async queue(id) {
        const validatedSubmission = await this.submissionService.getAndValidate(id);
        if (!!lodash_1.default.flatMap(validatedSubmission.problems, p => p.problems).length) {
            throw new common_1.BadRequestException('Cannot queue submission with problems');
        }
        if (validatedSubmission.submission.schedule.isScheduled) {
            validatedSubmission.submission.schedule.isScheduled = false;
            await this.submissionService.scheduleSubmission(validatedSubmission.submission, false);
        }
        return this.service.queue(validatedSubmission.submission);
    }
    async cancel(id) {
        return this.service.cancel((await this.submissionService.get(id)));
    }
    async cancelAll(type) {
        return this.service.emptyQueue(type);
    }
};
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PostController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('queue/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostController.prototype, "queue", null);
__decorate([
    (0, common_1.Post)('cancel/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)('clearQueue/:type'),
    __param(0, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PostController.prototype, "cancelAll", null);
PostController = __decorate([
    (0, common_1.Controller)('post'),
    __metadata("design:paramtypes", [post_service_1.PostService,
        submission_service_1.SubmissionService])
], PostController);
exports.PostController = PostController;
