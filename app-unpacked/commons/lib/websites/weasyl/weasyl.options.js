"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Weasyl = void 0;
const default_options_entity_1 = require("../../models/default-options.entity");
const weasyl_file_options_1 = require("./weasyl.file.options");
class Weasyl {
}
exports.Weasyl = Weasyl;
Weasyl.FileOptions = weasyl_file_options_1.WeasylFileOptionsEntity;
Weasyl.NotificationOptions = default_options_entity_1.DefaultOptionsEntity;
