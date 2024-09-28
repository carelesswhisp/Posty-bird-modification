"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscribeStarAdultModule = void 0;
const common_1 = require("@nestjs/common");
const subscribe_star_adult_service_1 = require("./subscribe-star-adult.service");
const subscribe_star_adult_controller_1 = require("./subscribe-star-adult.controller");
let SubscribeStarAdultModule = class SubscribeStarAdultModule {
};
SubscribeStarAdultModule = __decorate([
    (0, common_1.Module)({
        providers: [subscribe_star_adult_service_1.SubscribeStarAdult],
        exports: [subscribe_star_adult_service_1.SubscribeStarAdult],
        controllers: [subscribe_star_adult_controller_1.SubscribeStarAdultController],
    })
], SubscribeStarAdultModule);
exports.SubscribeStarAdultModule = SubscribeStarAdultModule;
