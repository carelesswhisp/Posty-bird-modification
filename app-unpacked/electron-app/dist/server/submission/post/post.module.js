"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModule = void 0;
const common_1 = require("@nestjs/common");
const post_controller_1 = require("./post.controller");
const post_service_1 = require("./post.service");
const account_module_1 = require("../../account/account.module");
const websites_module_1 = require("../../websites/websites.module");
const notification_module_1 = require("../../notification/notification.module");
const settings_module_1 = require("../../settings/settings.module");
const submission_part_module_1 = require("../submission-part/submission-part.module");
const log_module_1 = require("../log/log.module");
const submission_module_1 = require("../submission.module");
const parser_module_1 = require("../parser/parser.module");
let PostModule = class PostModule {
};
PostModule = __decorate([
    (0, common_1.Module)({
        imports: [
            (0, common_1.forwardRef)(() => submission_module_1.SubmissionModule),
            submission_module_1.SubmissionModule,
            settings_module_1.SettingsModule,
            account_module_1.AccountModule,
            websites_module_1.WebsitesModule,
            notification_module_1.NotificationModule,
            submission_part_module_1.SubmissionPartModule,
            log_module_1.LogModule,
            parser_module_1.ParserModule,
        ],
        controllers: [post_controller_1.PostController],
        providers: [post_service_1.PostService],
        exports: [post_service_1.PostService],
    })
], PostModule);
exports.PostModule = PostModule;
