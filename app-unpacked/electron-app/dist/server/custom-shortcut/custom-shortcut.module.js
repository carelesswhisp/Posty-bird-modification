"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomShortcutModule = void 0;
const common_1 = require("@nestjs/common");
const custom_shortcut_controller_1 = require("./custom-shortcut.controller");
const custom_shortcut_service_1 = require("./custom-shortcut.service");
const custom_shortcut_repository_1 = require("./custom-shortcut.repository");
const custom_shortcut_entity_1 = __importDefault(require("./models/custom-shortcut.entity"));
const database_factory_1 = require("../database/database.factory");
let CustomShortcutModule = class CustomShortcutModule {
};
CustomShortcutModule = __decorate([
    (0, common_1.Module)({
        controllers: [custom_shortcut_controller_1.CustomShortcutController],
        providers: [
            custom_shortcut_service_1.CustomShortcutService,
            database_factory_1.DatabaseFactory.forProvider(custom_shortcut_repository_1.CustomShortcutRepositoryToken, {
                entity: custom_shortcut_entity_1.default,
                databaseName: 'custom-shortcut',
            }),
        ],
        exports: [custom_shortcut_service_1.CustomShortcutService],
    })
], CustomShortcutModule);
exports.CustomShortcutModule = CustomShortcutModule;
