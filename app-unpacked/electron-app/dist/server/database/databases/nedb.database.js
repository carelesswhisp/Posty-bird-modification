"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const nedb_1 = __importDefault(require("nedb"));
const util = __importStar(require("util"));
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const database_abstract_1 = require("../database.abstract");
class NedbDatabase extends database_abstract_1.Database {
    constructor(databaseOptions, clazz, classDescriminatorFn) {
        super(clazz, classDescriminatorFn);
        this.databaseOptions = databaseOptions;
        this.clazz = clazz;
        this.classDescriminatorFn = classDescriminatorFn;
        this.db = new nedb_1.default(databaseOptions);
        this._find = util.promisify(this.db.find.bind(this.db));
        this._findOne = util.promisify(this.db.findOne.bind(this.db));
        this._remove = util.promisify(this.db.remove.bind(this.db));
        this._insert = util.promisify(this.db.insert.bind(this.db));
        this._update = util.promisify(this.db.update.bind(this.db));
    }
    async find(search) {
        const docs = await this._find(search || {});
        return docs.map(doc => this.constructEntity(doc));
    }
    async findOne(id) {
        const doc = await this._findOne({ _id: id });
        return this.constructEntity(doc);
    }
    async remove(id) {
        try {
            return await this._remove({ _id: id }, { multi: false });
        }
        catch (err) {
            throw new common_1.BadRequestException(err);
        }
        finally {
            this.db.persistence.compactDatafile();
        }
    }
    async removeAll() {
        try {
            return await this._remove({}, { multi: true });
        }
        catch (err) {
            throw new common_1.BadRequestException(err);
        }
        finally {
            this.db.persistence.compactDatafile();
        }
    }
    async removeBy(search) {
        try {
            return await this._remove(search, { multi: true });
        }
        catch (err) {
            throw new common_1.BadRequestException(err);
        }
        finally {
            this.db.persistence.compactDatafile();
        }
    }
    async save(entity) {
        try {
            await (0, class_validator_1.validateOrReject)(entity);
            const obj = (0, class_transformer_1.classToPlain)(entity);
            obj.created = Date.now();
            const savedEntity = await this._insert(obj);
            return this.constructEntity(savedEntity);
        }
        catch (err) {
            throw new common_1.BadRequestException(err);
        }
        finally {
            this.db.persistence.compactDatafile();
        }
    }
    async update(entity) {
        try {
            await (0, class_validator_1.validateOrReject)(entity);
            const obj = (0, class_transformer_1.classToPlain)(entity);
            delete obj._id;
            const updatedCount = await this._update({ _id: entity._id }, {
                $set: Object.assign(Object.assign({}, obj), { lastUpdated: Date.now() }),
            }, { upsert: false, multi: false });
            return updatedCount;
        }
        catch (err) {
            throw new common_1.BadRequestException(err);
        }
        finally {
            this.db.persistence.compactDatafile();
        }
    }
    count(query) {
        return new Promise(resolve => {
            this.db.count(query || {}, (err, count) => resolve(count));
        });
    }
}
exports.default = NedbDatabase;
