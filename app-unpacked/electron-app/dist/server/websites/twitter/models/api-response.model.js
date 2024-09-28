"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    constructor(partial) {
        Object.assign(this, partial);
        this.success = !partial.error;
    }
}
exports.ApiResponse = ApiResponse;
