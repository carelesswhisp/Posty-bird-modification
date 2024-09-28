"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HentaiFoundry = void 0;
const default_options_entity_1 = require("../../models/default-options.entity");
const hentai_foundry_file_options_1 = require("./hentai-foundry.file.options");
class HentaiFoundry {
}
exports.HentaiFoundry = HentaiFoundry;
HentaiFoundry.FileOptions = hentai_foundry_file_options_1.HentaiFoundryFileOptionsEntity;
HentaiFoundry.NotificationOptions = default_options_entity_1.DefaultOptionsEntity;
