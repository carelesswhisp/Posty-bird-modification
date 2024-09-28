"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const websites_module_1 = require("./websites/websites.module");
const tag_group_module_1 = require("./tag-group/tag-group.module");
const events_module_1 = require("./events/events.module");
const settings_module_1 = require("./settings/settings.module");
const description_template_module_1 = require("./description-template/description-template.module");
const update_module_1 = require("./update/update.module");
const submission_module_1 = require("./submission/submission.module");
const account_module_1 = require("./account/account.module");
const remote_module_1 = require("./remote/remote.module");
const notification_module_1 = require("./notification/notification.module");
const file_manipulation_module_1 = require("./file-manipulation/file-manipulation.module");
const custom_shortcut_module_1 = require("./custom-shortcut/custom-shortcut.module");
const tag_converter_module_1 = require("./tag-converter/tag-converter.module");
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            websites_module_1.WebsitesModule,
            tag_group_module_1.TagGroupModule,
            events_module_1.EventsModule,
            settings_module_1.SettingsModule,
            description_template_module_1.DescriptionTemplateModule,
            update_module_1.UpdateModule,
            submission_module_1.SubmissionModule,
            account_module_1.AccountModule,
            remote_module_1.RemoteModule,
            notification_module_1.NotificationModule,
            file_manipulation_module_1.FileManipulationModule,
            custom_shortcut_module_1.CustomShortcutModule,
            tag_converter_module_1.TagConverterModule,
        ],
    })
], AppModule);
exports.AppModule = AppModule;
