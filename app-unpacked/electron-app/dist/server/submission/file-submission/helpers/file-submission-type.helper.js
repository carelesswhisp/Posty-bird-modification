"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubmissionType = void 0;
const path_1 = __importDefault(require("path"));
const postybirb_commons_1 = require("postybirb-commons");
const IMAGE_TYPES = [
    'png',
    'jpeg',
    'jpg',
    'tiff',
    'gif',
    'svg',
    'webp',
    'ico',
    'bmp',
    'apng',
    'image',
];
const TEXT_TYPES = [
    'text',
    'txt',
    'rtf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'pdf',
    'odt',
    'md',
    'html',
];
const AUDIO_TYPES = ['wav', 'wave', 'x-wav', 'x-pn-wav', 'audio', 'odt', 'mp3'];
const VIDEO_TYPES = ['video', 'avi', 'flv', 'm3u8', 'mov', 'wmv', 'swf', 'webm'];
function getSubmissionType(mime, filename) {
    const ext = path_1.default.parse(filename).ext.replace('.', '').toLowerCase();
    const mimeParts = mime.split('/');
    if (IMAGE_TYPES.includes(ext) ||
        IMAGE_TYPES.includes(mimeParts[0]) ||
        IMAGE_TYPES.includes(mimeParts[1])) {
        return postybirb_commons_1.FileSubmissionType.IMAGE;
    }
    if (VIDEO_TYPES.includes(ext) ||
        VIDEO_TYPES.includes(mimeParts[0]) ||
        VIDEO_TYPES.includes(mimeParts[1])) {
        return postybirb_commons_1.FileSubmissionType.VIDEO;
    }
    if (AUDIO_TYPES.includes(ext) ||
        AUDIO_TYPES.includes(mimeParts[0]) ||
        AUDIO_TYPES.includes(mimeParts[1])) {
        return postybirb_commons_1.FileSubmissionType.AUDIO;
    }
    if (TEXT_TYPES.includes(ext) ||
        TEXT_TYPES.includes(mimeParts[0]) ||
        TEXT_TYPES.includes(mimeParts[1])) {
        return postybirb_commons_1.FileSubmissionType.TEXT;
    }
    return postybirb_commons_1.FileSubmissionType.UNKNOWN;
}
exports.getSubmissionType = getSubmissionType;
