"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensure = exports.DATABASE_DIRECTORY = exports.TEMP_FILE_DIRECTORY = exports.THUMBNAIL_FILE_DIRECTORY = exports.SUBMISSION_FILE_DIRECTORY = exports.BASE_DIRECTORY = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
exports.BASE_DIRECTORY = process.env.TEST
    ? path_1.default.join(__dirname, 'test-dir')
    : global.BASE_DIRECTORY;
exports.SUBMISSION_FILE_DIRECTORY = path_1.default.join(exports.BASE_DIRECTORY, 'submission', 'files');
exports.THUMBNAIL_FILE_DIRECTORY = path_1.default.join(exports.BASE_DIRECTORY, 'submission', 'thumbnails');
exports.TEMP_FILE_DIRECTORY = path_1.default.join(exports.BASE_DIRECTORY, 'temp');
exports.DATABASE_DIRECTORY = path_1.default.join(exports.BASE_DIRECTORY, 'data');
function ensure() {
    fs_extra_1.default.ensureDirSync(exports.DATABASE_DIRECTORY);
    fs_extra_1.default.ensureDirSync(exports.SUBMISSION_FILE_DIRECTORY);
    fs_extra_1.default.ensureDirSync(exports.THUMBNAIL_FILE_DIRECTORY);
    fs_extra_1.default.ensureDirSync(exports.TEMP_FILE_DIRECTORY);
    fs_extra_1.default.emptyDirSync(exports.TEMP_FILE_DIRECTORY);
}
exports.ensure = ensure;
