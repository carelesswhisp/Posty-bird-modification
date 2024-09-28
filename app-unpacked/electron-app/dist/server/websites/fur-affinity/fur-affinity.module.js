"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FurAffinityModule = void 0;
const common_1 = require("@nestjs/common");
const fur_affinity_service_1 = require("./fur-affinity.service");
const fur_affinity_controller_1 = require("./fur-affinity.controller");
let FurAffinityModule = class FurAffinityModule {
};
FurAffinityModule = __decorate([
    (0, common_1.Module)({
        providers: [fur_affinity_service_1.FurAffinity],
        controllers: [fur_affinity_controller_1.FurAffinityController],
        exports: [fur_affinity_service_1.FurAffinity],
    })
], FurAffinityModule);
exports.FurAffinityModule = FurAffinityModule;
