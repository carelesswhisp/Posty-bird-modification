"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Piczel = void 0;
const default_options_entity_1 = require("../../models/default-options.entity");
const piczel_file_options_1 = require("./piczel.file.options");
class Piczel {
}
exports.Piczel = Piczel;
Piczel.FileOptions = piczel_file_options_1.PiczelFileOptionsEntity;
Piczel.NotificationOptions = default_options_entity_1.DefaultOptionsEntity;
