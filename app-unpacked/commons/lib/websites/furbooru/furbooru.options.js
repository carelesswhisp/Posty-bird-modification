"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Furbooru = void 0;
const default_options_entity_1 = require("../../models/default-options.entity");
const furbooru_file_options_1 = require("./furbooru.file.options");
class Furbooru {
}
exports.Furbooru = Furbooru;
Furbooru.FileOptions = furbooru_file_options_1.FurbooruFileOptionsEntity;
Furbooru.NotificationOptions = default_options_entity_1.DefaultOptionsEntity;
