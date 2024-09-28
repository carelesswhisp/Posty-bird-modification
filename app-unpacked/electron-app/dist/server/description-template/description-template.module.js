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
exports.DescriptionTemplateModule = void 0;
const common_1 = require("@nestjs/common");
const description_template_controller_1 = require("./description-template.controller");
const description_template_service_1 = require("./description-template.service");
const description_template_repository_1 = require("./description-template.repository");
const database_factory_1 = require("../database/database.factory");
const description_template_entity_1 = __importDefault(require("./models/description-template.entity"));
let DescriptionTemplateModule = class DescriptionTemplateModule {
};
DescriptionTemplateModule = __decorate([
    (0, common_1.Module)({
        controllers: [description_template_controller_1.DescriptionTemplateController],
        providers: [
            description_template_service_1.DescriptionTemplateService,
            database_factory_1.DatabaseFactory.forProvider(description_template_repository_1.DescriptionTemplateRepositoryToken, {
                entity: description_template_entity_1.default,
                databaseName: 'description-template',
            }),
        ],
    })
], DescriptionTemplateModule);
exports.DescriptionTemplateModule = DescriptionTemplateModule;
