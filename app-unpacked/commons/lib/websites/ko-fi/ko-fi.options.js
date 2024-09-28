"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KoFi = void 0;
const default_options_entity_1 = require("../../models/default-options.entity");
const ko_fi_file_options_1 = require("./ko-fi.file.options");
class KoFi {
}
exports.KoFi = KoFi;
KoFi.FileOptions = ko_fi_file_options_1.KoFiFileOptionsEntity;
KoFi.NotificationOptions = default_options_entity_1.DefaultOptionsEntity;
