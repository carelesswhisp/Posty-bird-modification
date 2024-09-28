"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Manebooru = void 0;
const default_options_entity_1 = require("../../models/default-options.entity");
const manebooru_file_options_1 = require("./manebooru.file.options");
class Manebooru {
}
exports.Manebooru = Manebooru;
Manebooru.FileOptions = manebooru_file_options_1.ManebooruFileOptionsEntity;
Manebooru.NotificationOptions = default_options_entity_1.DefaultOptionsEntity;
