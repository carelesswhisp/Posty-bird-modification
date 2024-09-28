"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionPartModule = void 0;
const common_1 = require("@nestjs/common");
const submission_part_service_1 = require("./submission-part.service");
const database_factory_1 = require("../../database/database.factory");
const submission_part_entity_1 = __importDefault(require("./models/submission-part.entity"));
const submission_part_repository_1 = require("./submission-part.repository");
const websites_module_1 = require("../../websites/websites.module");
let SubmissionPartModule = class SubmissionPartModule {
};
SubmissionPartModule = __decorate([
    (0, common_1.Module)({
        imports: [websites_module_1.WebsitesModule],
        providers: [
            submission_part_service_1.SubmissionPartService,
            database_factory_1.DatabaseFactory.forProvider(submission_part_repository_1.SubmissionPartRepositoryToken, {
                databaseName: 'submission-part',
                entity: submission_part_entity_1.default,
            }),
        ],
        exports: [submission_part_service_1.SubmissionPartService],
    })
], SubmissionPartModule);
exports.SubmissionPartModule = SubmissionPartModule;
