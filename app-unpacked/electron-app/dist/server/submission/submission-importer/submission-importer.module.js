"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionImporterModule = void 0;
const common_1 = require("@nestjs/common");
const submission_importer_service_1 = require("./submission-importer.service");
const submission_module_1 = require("../submission.module");
const notification_module_1 = require("../../notification/notification.module");
let SubmissionImporterModule = class SubmissionImporterModule {
};
SubmissionImporterModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => submission_module_1.SubmissionModule), notification_module_1.NotificationModule],
        providers: [submission_importer_service_1.SubmissionImporterService],
        exports: [submission_importer_service_1.SubmissionImporterService],
    })
], SubmissionImporterModule);
exports.SubmissionImporterModule = SubmissionImporterModule;
