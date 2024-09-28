"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsitesService = void 0;
const common_1 = require("@nestjs/common");
const website_provider_service_1 = require("./website-provider.service");
let WebsitesService = class WebsitesService {
    constructor(providers) {
        this.providers = providers;
    }
    getUsernameShortcuts() {
        const shortcuts = {};
        this.providers.getAllWebsiteModules().forEach(w => {
            if (w.usernameShortcuts.length) {
                shortcuts[w.constructor.name] = w.usernameShortcuts;
            }
        });
        return shortcuts;
    }
};
WebsitesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [website_provider_service_1.WebsiteProvider])
], WebsitesService);
exports.WebsitesService = WebsitesService;
