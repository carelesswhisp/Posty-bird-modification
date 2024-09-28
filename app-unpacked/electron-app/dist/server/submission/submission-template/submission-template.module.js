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
exports.SubmissionTemplateModule = void 0;
const common_1 = require("@nestjs/common");
const submission_template_controller_1 = require("./submission-template.controller");
const submission_template_service_1 = require("./submission-template.service");
const database_factory_1 = require("../../database/database.factory");
const submission_template_entity_1 = __importDefault(require("./models/submission-template.entity"));
const submission_template_repository_1 = require("./submission-template.repository");
let SubmissionTemplateModule = class SubmissionTemplateModule {
};
SubmissionTemplateModule = __decorate([
    (0, common_1.Module)({
        controllers: [submission_template_controller_1.SubmissionTemplateController],
        providers: [
            submission_template_service_1.SubmissionTemplateService,
            database_factory_1.DatabaseFactory.forProvider(submission_template_repository_1.SubmissionTemplateRepositoryToken, {
                databaseName: 'submission-templates',
                entity: submission_template_entity_1.default,
            }),
        ],
        exports: [submission_template_service_1.SubmissionTemplateService],
    })
], SubmissionTemplateModule);
exports.SubmissionTemplateModule = SubmissionTemplateModule;
