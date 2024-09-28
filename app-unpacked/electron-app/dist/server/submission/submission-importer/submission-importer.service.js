"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SubmissionImporterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionImporterService = void 0;
const fs = __importStar(require("fs-extra"));
const fa_archive_importer_1 = require("./importers/fa-archive-importer");
const file_list_importer_1 = require("./importers/file-list-importer");
const common_1 = require("@nestjs/common");
const submission_service_1 = require("../submission.service");
const ui_notification_service_1 = require("../../notification/ui-notification/ui-notification.service");
const path_1 = require("path");
const activity_pub_importer_1 = require("./importers/activity-pub-importer");
let SubmissionImporterService = SubmissionImporterService_1 = class SubmissionImporterService {
    constructor(submissionService, uiNotificationService) {
        this.submissionService = submissionService;
        this.uiNotificationService = uiNotificationService;
        this.logger = new common_1.Logger(SubmissionImporterService_1.name);
        this.importers = Object.freeze([
            new fa_archive_importer_1.FaArchiveImporter(this),
            new activity_pub_importer_1.ActivityPubImporter(this),
            new file_list_importer_1.FileListImporter(this),
        ]);
    }
    async importDirectory(path) {
        this.logger.debug(path, 'Import Directory');
        const tree = {
            path,
            type: 'directory',
            name: (0, path_1.basename)(path),
            entries: await this.readTree(path),
        };
        const importer = this.searchImporter(tree);
        if (importer) {
            const importType = importer.getDisplayName();
            const submissionCount = await importer.extract(tree);
            return { importType, submissionCount };
        }
        else {
            return { importType: null, submissionCount: 0 };
        }
    }
    async readTree(parent) {
        const files = await fs.readdir(parent);
        return await Promise.all(files.map(async (name) => {
            const path = (0, path_1.join)(parent, name);
            const stat = await fs.lstat(path);
            if (stat.isFile()) {
                return { type: 'file', entries: [], name, path };
            }
            else if (stat.isDirectory()) {
                return { type: 'directory', entries: await this.readTree(path), name, path };
            }
            else {
                return { type: 'unknown', entries: [], name, path };
            }
        }));
    }
    searchImporter(tree) {
        for (const importer of this.importers) {
            const name = importer.getName();
            try {
                if (importer.identify(tree)) {
                    this.logger.debug('Identified', name);
                    return importer;
                }
                else {
                    this.logger.debug('Not identified', name);
                }
            }
            catch (err) {
                this.logger.error(`${err}`, name);
            }
        }
        return null;
    }
};
SubmissionImporterService = SubmissionImporterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [submission_service_1.SubmissionService,
        ui_notification_service_1.UiNotificationService])
], SubmissionImporterService);
exports.SubmissionImporterService = SubmissionImporterService;
