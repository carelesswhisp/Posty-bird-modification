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
var LogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogService = void 0;
const common_1 = require("@nestjs/common");
const electron_1 = require("electron");
const submission_part_service_1 = require("../submission-part/submission-part.service");
const log_repository_1 = require("./log.repository");
const submission_log_entity_1 = __importDefault(require("./models/submission-log.entity"));
const file_submission_entity_1 = __importDefault(require("../file-submission/models/file-submission.entity"));
let LogService = LogService_1 = class LogService {
    constructor(repository, partService) {
        this.repository = repository;
        this.partService = partService;
        this.logger = new common_1.Logger(LogService_1.name);
        this.MAX_LOGS = 30;
    }
    async getLogs(type) {
        let logs = await this.repository.find();
        if (type) {
            logs = logs.filter(log => log.submission.type === type);
        }
        return logs.sort((a, b) => a.created - b.created).reverse();
    }
    async addLog(submission, parts) {
        if (parts.length) {
            this.logger.log(submission._id, 'Creating Log');
            const copy = submission.asPlain();
            if (submission instanceof file_submission_entity_1.default) {
                this.cleanBuffers(copy);
            }
            await this.repository.save(new submission_log_entity_1.default({
                submission: copy,
                parts,
                version: electron_1.app.getVersion(),
                defaultPart: (await this.partService.getPartsForSubmission(submission._id, false)).filter(p => p.isDefault)[0],
            }));
            await this.checkForTruncate();
        }
    }
    async checkForTruncate() {
        const logs = await this.getLogs();
        if (logs.length > this.MAX_LOGS) {
            const sorted = logs.sort((a, b) => a.created - b.created).reverse();
            sorted.splice(0, this.MAX_LOGS);
            await Promise.all(sorted.map(log => this.repository.remove(log._id)));
        }
    }
    cleanBuffers(submission) {
        [submission.primary, submission.fallback, submission.thumbnail, ...submission.additional]
            .filter(s => s)
            .forEach(file => (file.buffer = undefined));
    }
};
LogService = LogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(log_repository_1.SubmissionLogRepositoryToken)),
    __metadata("design:paramtypes", [Object, submission_part_service_1.SubmissionPartService])
], LogService);
exports.LogService = LogService;
