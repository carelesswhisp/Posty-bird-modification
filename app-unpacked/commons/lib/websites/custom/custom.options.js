"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Custom = void 0;
const default_file_options_entity_1 = require("../../models/default-file-options.entity");
const default_options_entity_1 = require("../../models/default-options.entity");
class Custom {
}
exports.Custom = Custom;
Custom.FileOptions = default_file_options_entity_1.DefaultFileOptionsEntity;
Custom.NotificationOptions = default_options_entity_1.DefaultOptionsEntity;
