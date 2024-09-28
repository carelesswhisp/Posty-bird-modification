"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatreonModule = void 0;
const common_1 = require("@nestjs/common");
const patreon_service_1 = require("./patreon.service");
const patreon_controller_1 = require("./patreon.controller");
let PatreonModule = class PatreonModule {
};
PatreonModule = __decorate([
    (0, common_1.Module)({
        providers: [patreon_service_1.Patreon],
        controllers: [patreon_controller_1.PatreonController],
        exports: [patreon_service_1.Patreon],
    })
], PatreonModule);
exports.PatreonModule = PatreonModule;
