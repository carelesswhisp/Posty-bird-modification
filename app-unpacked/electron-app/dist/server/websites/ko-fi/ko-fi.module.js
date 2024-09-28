"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KoFiModule = void 0;
const common_1 = require("@nestjs/common");
const ko_fi_service_1 = require("./ko-fi.service");
const ko_fi_controller_1 = require("./ko-fi.controller");
let KoFiModule = class KoFiModule {
};
KoFiModule = __decorate([
    (0, common_1.Module)({
        providers: [ko_fi_service_1.KoFi],
        exports: [ko_fi_service_1.KoFi],
        controllers: [ko_fi_controller_1.KoFiController],
    })
], KoFiModule);
exports.KoFiModule = KoFiModule;
