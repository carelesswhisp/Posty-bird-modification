"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserModule = void 0;
const common_1 = require("@nestjs/common");
const parser_controller_1 = require("./parser.controller");
const parser_service_1 = require("./parser.service");
const tag_converter_module_1 = require("../../tag-converter/tag-converter.module");
const custom_shortcut_module_1 = require("../../custom-shortcut/custom-shortcut.module");
const file_manipulation_module_1 = require("../../file-manipulation/file-manipulation.module");
const settings_module_1 = require("../../settings/settings.module");
const websites_module_1 = require("../../websites/websites.module");
let ParserModule = class ParserModule {
};
ParserModule = __decorate([
    (0, common_1.Module)({
        imports: [
            tag_converter_module_1.TagConverterModule,
            custom_shortcut_module_1.CustomShortcutModule,
            file_manipulation_module_1.FileManipulationModule,
            settings_module_1.SettingsModule,
            websites_module_1.WebsitesModule,
        ],
        controllers: [parser_controller_1.ParserController],
        providers: [parser_service_1.ParserService],
        exports: [parser_service_1.ParserService],
    })
], ParserModule);
exports.ParserModule = ParserModule;
