"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pixiv = void 0;
const default_options_entity_1 = require("../../models/default-options.entity");
const pixiv_file_options_1 = require("./pixiv.file.options");
class Pixiv {
}
exports.Pixiv = Pixiv;
Pixiv.FileOptions = pixiv_file_options_1.PixivFileOptionsEntity;
Pixiv.NotificationOptions = default_options_entity_1.DefaultOptionsEntity;
