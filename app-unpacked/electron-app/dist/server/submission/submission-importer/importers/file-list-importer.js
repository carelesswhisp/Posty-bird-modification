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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileListImporter = void 0;
const importer_1 = require("./importer");
const postybirb_commons_1 = require("postybirb-commons");
const common_1 = require("@nestjs/common");
const file_submission_type_helper_1 = require("../../file-submission/helpers/file-submission-type.helper");
const _ = __importStar(require("lodash"));
function looksLikeSubmissionFile(entry) {
    return (entry.type === 'file' &&
        (0, file_submission_type_helper_1.getSubmissionType)('unknown/unknown', entry.name) !== postybirb_commons_1.FileSubmissionType.UNKNOWN);
}
class FileListImporter extends importer_1.Importer {
    constructor(service) {
        super(service);
        this.logger = new common_1.Logger(FileListImporter.name);
    }
    getName() {
        return FileListImporter.name;
    }
    getDisplayName() {
        return 'files in directory';
    }
    identify(tree) {
        return tree.entries.some(looksLikeSubmissionFile);
    }
    async extract(tree) {
        const entries = _.sortBy(tree.entries, ['name']).filter(looksLikeSubmissionFile);
        const count = entries.length;
        this.tryExtractFiles(entries).then(successes => {
            this.logger.debug(`${successes}/${count} imported`, 'Imported Finished');
            this.showCompletedNotification(successes, count);
        });
        return count;
    }
    async tryExtractFiles(entries) {
        let successes = 0;
        let current = 0;
        let lastProgress = null;
        for (const entry of entries) {
            try {
                const submission = await this.createSubmission(entry);
                this.logger.debug(submission._id, 'Imported Submission');
                ++successes;
            }
            catch (err) {
                this.logger.error(`${entry.path}: ${err}`, null, 'Import Error');
                this.showImportError(entry.name);
            }
            ++current;
            lastProgress = this.showImportProgress(current, entries.length, lastProgress);
        }
        return successes;
    }
}
exports.FileListImporter = FileListImporter;
