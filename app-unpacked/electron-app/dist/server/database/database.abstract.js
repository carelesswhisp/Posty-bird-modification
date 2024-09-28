"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
class Database {
    constructor(clazz, classDescriminatorFn) {
        this.clazz = clazz;
        this.classDescriminatorFn = classDescriminatorFn;
    }
    constructEntity(entity) {
        if (!entity) {
            return null;
        }
        let newFn = this.clazz;
        if (this.classDescriminatorFn) {
            newFn = this.classDescriminatorFn(entity);
        }
        return new newFn(entity);
    }
}
exports.Database = Database;
