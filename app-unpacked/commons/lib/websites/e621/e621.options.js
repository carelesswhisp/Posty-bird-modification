"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.e621 = void 0;
const default_options_entity_1 = require("../../models/default-options.entity");
const e621_file_options_1 = require("./e621.file.options");
class e621 {
}
exports.e621 = e621;
e621.FileOptions = e621_file_options_1.e621FileOptionsEntity;
e621.NotificationOptions = default_options_entity_1.DefaultOptionsEntity;
