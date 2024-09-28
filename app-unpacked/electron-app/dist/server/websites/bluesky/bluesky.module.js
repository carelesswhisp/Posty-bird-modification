"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueskyModule = void 0;
const common_1 = require("@nestjs/common");
const bluesky_service_1 = require("./bluesky.service");
const bluesky_controller_1 = require("./bluesky.controller");
let BlueskyModule = class BlueskyModule {
};
BlueskyModule = __decorate([
    (0, common_1.Module)({
        providers: [bluesky_service_1.Bluesky],
        controllers: [bluesky_controller_1.BlueskyController],
        exports: [bluesky_service_1.Bluesky],
    })
], BlueskyModule);
exports.BlueskyModule = BlueskyModule;
