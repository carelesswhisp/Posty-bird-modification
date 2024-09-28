"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterModule = void 0;
const common_1 = require("@nestjs/common");
const twitter_api_service_1 = require("./twitter-api.service");
const twitter_controller_1 = require("./twitter.controller");
const twitter_service_1 = require("./twitter.service");
let TwitterModule = class TwitterModule {
};
TwitterModule = __decorate([
    (0, common_1.Module)({
        controllers: [twitter_controller_1.TwitterController],
        providers: [twitter_service_1.Twitter, twitter_api_service_1.TwitterAPIService],
        exports: [twitter_service_1.Twitter],
    })
], TwitterModule);
exports.TwitterModule = TwitterModule;
