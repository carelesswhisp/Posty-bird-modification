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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Importer = void 0;
const submission_create_model_1 = __importDefault(require("../../models/submission-create.model"));
const notification_type_enum_1 = require("../../../notification/enums/notification-type.enum");
const postybirb_commons_1 = require("postybirb-commons");
const path_1 = require("path");
const file_type_1 = __importDefault(require("file-type"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const domutils = __importStar(require("domutils"));
const htmlparser2 = __importStar(require("htmlparser2"));
const dom_serializer_1 = __importDefault(require("dom-serializer"));
class Importer {
    constructor(service) {
        this.service = service;
    }
    async createSubmission(entry, defaultPartData, thumbnailEntry) {
        const create = {
            type: postybirb_commons_1.SubmissionType.FILE,
            file: await this.readUploadedFile(entry),
            path: entry.path,
            parts: defaultPartData ? this.buildParts(defaultPartData) : null,
        };
        if (thumbnailEntry) {
            create.thumbnailFile = await this.readUploadedFile(thumbnailEntry);
            create.thumbnailPath = thumbnailEntry.path;
        }
        return this.service.submissionService.create(new submission_create_model_1.default(create));
    }
    buildParts(defaultPartData) {
        return JSON.stringify([
            {
                accountId: 'default',
                website: 'default',
                isDefault: true,
                data: defaultPartData,
            },
        ]);
    }
    async readUploadedFile({ name, path }) {
        const [buffer, mimetype] = await this.readFile(path);
        return {
            fieldname: null,
            originalname: name || (0, path_1.basename)(path),
            encoding: null,
            mimetype,
            buffer,
        };
    }
    async readFile(path) {
        var _a;
        const buffer = await fs_extra_1.default.readFile(path);
        const mimetype = ((_a = (0, file_type_1.default)(buffer)) === null || _a === void 0 ? void 0 : _a.mime) || 'application/octet-stream';
        return [buffer, mimetype];
    }
    showCompletedNotification(successes, total) {
        this.service.uiNotificationService.createUINotification(notification_type_enum_1.NotificationType.INFO, 10, `Imported ${successes}/${total} submission(s) from ${this.getDisplayName()}.`, 'Import finished');
    }
    showImportProgress(current, total, lastProgress) {
        if (lastProgress === null) {
            return Date.now();
        }
        else if (Date.now() < lastProgress + 3000) {
            return lastProgress;
        }
        else {
            this.service.uiNotificationService.createUIMessage(notification_type_enum_1.NotificationType.INFO, 2, `Importing ${current}/${total} from ${this.getDisplayName()}.`);
            return Date.now();
        }
    }
    showImportError(name) {
        this.service.uiNotificationService.createUIMessage(notification_type_enum_1.NotificationType.ERROR, 10, `Error importing ${name} from ${this.getDisplayName()}.`);
    }
    scrubHtmlDescription(description) {
        const doc = htmlparser2.parseDocument(description);
        return (0, dom_serializer_1.default)(this.scrubHtmlNode(doc));
    }
    scrubHtmlNode(node) {
        const scrubbed = htmlparser2.ElementType.isTag(node)
            ? this.scrubHtmlElement(node)
            : node;
        if (!scrubbed) {
            domutils.removeElement(node);
            return null;
        }
        else if (scrubbed !== node) {
            domutils.replaceElement(node, scrubbed);
        }
        if ('children' in scrubbed) {
            for (const child of [...scrubbed.children]) {
                this.scrubHtmlNode(child);
            }
        }
        return scrubbed;
    }
    scrubHtmlElement(element) {
        return element;
    }
}
exports.Importer = Importer;
