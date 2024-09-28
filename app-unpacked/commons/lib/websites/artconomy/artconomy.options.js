"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Artconomy = void 0;
const default_options_entity_1 = require("../../models/default-options.entity");
const artconomy_file_options_1 = require("./artconomy.file.options");
class Artconomy {
}
exports.Artconomy = Artconomy;
Artconomy.FileOptions = artconomy_file_options_1.ArtconomyFileOptionsEntity;
Artconomy.NotificationOptions = default_options_entity_1.DefaultOptionsEntity;
