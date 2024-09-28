"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseFactory = void 0;
const persisted_database_1 = __importDefault(require("./databases/persisted.database"));
const memory_database_1 = __importDefault(require("./databases/memory.database"));
class DatabaseFactory {
    constructor() { }
    static forProvider(provide, options) {
        return {
            provide,
            useValue: options.databaseName
                ? DatabaseFactory.persisted(options)
                : DatabaseFactory.memory(options),
        };
    }
    static memory(options) {
        return new memory_database_1.default(options.entity, options.descriminator);
    }
    static persisted(options) {
        return new persisted_database_1.default(options.databaseName, options.entity, options.descriminator);
    }
}
exports.DatabaseFactory = DatabaseFactory;
