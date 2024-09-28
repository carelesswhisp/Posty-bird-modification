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
exports.TagGroupModule = void 0;
const common_1 = require("@nestjs/common");
const tag_group_controller_1 = require("./tag-group.controller");
const tag_group_service_1 = require("./tag-group.service");
const tag_group_repository_1 = require("./tag-group.repository");
const database_factory_1 = require("../database/database.factory");
const tag_group_entity_1 = __importDefault(require("./models/tag-group.entity"));
let TagGroupModule = class TagGroupModule {
};
TagGroupModule = __decorate([
    (0, common_1.Module)({
        controllers: [tag_group_controller_1.TagGroupController],
        providers: [
            tag_group_service_1.TagGroupService,
            database_factory_1.DatabaseFactory.forProvider(tag_group_repository_1.TagGroupRepositoryToken, {
                entity: tag_group_entity_1.default,
                databaseName: 'tag-group',
            }),
        ],
    })
], TagGroupModule);
exports.TagGroupModule = TagGroupModule;
