"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviantArt = void 0;
const default_options_entity_1 = require("../../models/default-options.entity");
const deviant_art_file_options_1 = require("./deviant-art.file.options");
class DeviantArt {
}
exports.DeviantArt = DeviantArt;
DeviantArt.FileOptions = deviant_art_file_options_1.DeviantArtFileOptionsEntity;
DeviantArt.NotificationOptions = default_options_entity_1.DefaultOptionsEntity;
