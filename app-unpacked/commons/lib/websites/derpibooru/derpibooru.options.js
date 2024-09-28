"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Derpibooru = void 0;
const default_options_entity_1 = require("../../models/default-options.entity");
const derpibooru_file_options_1 = require("./derpibooru.file.options");
class Derpibooru {
}
exports.Derpibooru = Derpibooru;
Derpibooru.FileOptions = derpibooru_file_options_1.DerpibooruFileOptionsEntity;
Derpibooru.NotificationOptions = default_options_entity_1.DefaultOptionsEntity;
