"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissKeyModule = void 0;
const common_1 = require("@nestjs/common");
const misskey_service_1 = require("./misskey.service");
const file_manager_module_1 = require("../../file-manager/file-manager.module");
const misskey_controller_1 = require("./misskey.controller");
let MissKeyModule = class MissKeyModule {
};
MissKeyModule = __decorate([
    (0, common_1.Module)({
        controllers: [misskey_controller_1.MissKeyController],
        providers: [misskey_service_1.MissKey],
        exports: [misskey_service_1.MissKey],
        imports: [file_manager_module_1.FileManagerModule],
    })
], MissKeyModule);
exports.MissKeyModule = MissKeyModule;
