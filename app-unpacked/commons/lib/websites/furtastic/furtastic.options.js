"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Furtastic = void 0;
const default_options_entity_1 = require("../../models/default-options.entity");
const furtastic_file_options_1 = require("./furtastic.file.options");
class Furtastic {
}
exports.Furtastic = Furtastic;
Furtastic.FileOptions = furtastic_file_options_1.FurtasticFileOptionsEntity;
Furtastic.NotificationOptions = default_options_entity_1.DefaultOptionsEntity;
