"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileManipulationModule = void 0;
const common_1 = require("@nestjs/common");
const file_manipulation_service_1 = require("./file-manipulation.service");
const settings_module_1 = require("../settings/settings.module");
const image_manipulation_pool_service_1 = require("./pools/image-manipulation-pool.service");
let FileManipulationModule = class FileManipulationModule {
};
FileManipulationModule = __decorate([
    (0, common_1.Module)({
        imports: [settings_module_1.SettingsModule],
        providers: [file_manipulation_service_1.FileManipulationService, image_manipulation_pool_service_1.ImageManipulationPoolService],
        exports: [file_manipulation_service_1.FileManipulationService, image_manipulation_pool_service_1.ImageManipulationPoolService],
    })
], FileManipulationModule);
exports.FileManipulationModule = FileManipulationModule;
