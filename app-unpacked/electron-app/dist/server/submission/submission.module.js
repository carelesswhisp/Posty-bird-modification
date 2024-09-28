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
exports.SubmissionModule = void 0;
const common_1 = require("@nestjs/common");
const file_manager_module_1 = require("../file-manager/file-manager.module");
const websites_module_1 = require("../websites/websites.module");
const file_manipulation_module_1 = require("../file-manipulation/file-manipulation.module");
const account_module_1 = require("../account/account.module");
const file_submission_service_1 = require("./file-submission/file-submission.service");
const submission_controller_1 = require("./submission.controller");
const submission_repository_1 = require("./submission.repository");
const submission_service_1 = require("./submission.service");
const validator_module_1 = require("./validator/validator.module");
const submission_part_module_1 = require("./submission-part/submission-part.module");
const post_module_1 = require("./post/post.module");
const submission_template_module_1 = require("./submission-template/submission-template.module");
const database_factory_1 = require("../database/database.factory");
const parser_module_1 = require("./parser/parser.module");
const submission_entity_1 = __importDefault(require("./models/submission.entity"));
const file_submission_entity_1 = __importDefault(require("./file-submission/models/file-submission.entity"));
const submission_importer_module_1 = require("./submission-importer/submission-importer.module");
let SubmissionModule = class SubmissionModule {
};
SubmissionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            file_manager_module_1.FileManagerModule,
            websites_module_1.WebsitesModule,
            (0, common_1.forwardRef)(() => account_module_1.AccountModule),
            (0, common_1.forwardRef)(() => post_module_1.PostModule),
            file_manipulation_module_1.FileManipulationModule,
            validator_module_1.ValidatorModule,
            submission_part_module_1.SubmissionPartModule,
            submission_template_module_1.SubmissionTemplateModule,
            parser_module_1.ParserModule,
            submission_importer_module_1.SubmissionImporterModule,
        ],
        controllers: [submission_controller_1.SubmissionController],
        providers: [
            file_submission_service_1.FileSubmissionService,
            submission_service_1.SubmissionService,
            database_factory_1.DatabaseFactory.forProvider(submission_repository_1.SubmissionRepositoryToken, {
                databaseName: 'submissions',
                entity: submission_entity_1.default,
                descriminator: (entity) => {
                    return entity.primary ? file_submission_entity_1.default : submission_entity_1.default;
                },
            }),
        ],
        exports: [submission_service_1.SubmissionService],
    })
], SubmissionModule);
exports.SubmissionModule = SubmissionModule;
