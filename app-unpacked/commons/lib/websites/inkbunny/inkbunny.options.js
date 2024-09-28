"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inkbunny = void 0;
const default_options_entity_1 = require("../../models/default-options.entity");
const inkbunny_file_options_1 = require("./inkbunny.file.options");
class Inkbunny {
}
exports.Inkbunny = Inkbunny;
Inkbunny.FileOptions = inkbunny_file_options_1.InkbunnyFileOptionsEntity;
Inkbunny.NotificationOptions = default_options_entity_1.DefaultOptionsEntity;
