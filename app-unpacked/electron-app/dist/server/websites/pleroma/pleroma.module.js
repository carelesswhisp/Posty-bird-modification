"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PleromaModule = void 0;
const common_1 = require("@nestjs/common");
const pleroma_service_1 = require("./pleroma.service");
const file_manager_module_1 = require("../../file-manager/file-manager.module");
const pleroma_controller_1 = require("./pleroma.controller");
let PleromaModule = class PleromaModule {
};
PleromaModule = __decorate([
    (0, common_1.Module)({
        controllers: [pleroma_controller_1.PleromaController],
        providers: [pleroma_service_1.Pleroma],
        exports: [pleroma_service_1.Pleroma],
        imports: [file_manager_module_1.FileManagerModule],
    })
], PleromaModule);
exports.PleromaModule = PleromaModule;
