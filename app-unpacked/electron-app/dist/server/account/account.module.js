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
exports.AccountModule = void 0;
const common_1 = require("@nestjs/common");
const submission_module_1 = require("../submission/submission.module");
const websites_module_1 = require("../websites/websites.module");
const account_controller_1 = require("./account.controller");
const account_service_1 = require("./account.service");
const account_repository_1 = require("./account.repository");
const database_factory_1 = require("../database/database.factory");
const user_account_entity_1 = __importDefault(require("./models/user-account.entity"));
const submission_part_module_1 = require("../submission/submission-part/submission-part.module");
const submission_template_module_1 = require("../submission/submission-template/submission-template.module");
let AccountModule = class AccountModule {
};
AccountModule = __decorate([
    (0, common_1.Module)({
        imports: [
            (0, common_1.forwardRef)(() => submission_module_1.SubmissionModule),
            submission_part_module_1.SubmissionPartModule,
            submission_template_module_1.SubmissionTemplateModule,
            websites_module_1.WebsitesModule,
        ],
        controllers: [account_controller_1.AccountController],
        providers: [
            account_service_1.AccountService,
            database_factory_1.DatabaseFactory.forProvider(account_repository_1.AccountRepositoryToken, {
                databaseName: 'accounts',
                entity: user_account_entity_1.default,
            }),
        ],
        exports: [account_service_1.AccountService],
    })
], AccountModule);
exports.AccountModule = AccountModule;
