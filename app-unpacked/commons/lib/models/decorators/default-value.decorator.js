"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultValue = void 0;
function DefaultValue(defaultValue) {
    return (target, propertyKey) => {
        let value = defaultValue;
        Object.defineProperty(target, propertyKey, {
            get() {
                return value;
            },
            set(setValue) {
                value = setValue;
            },
        });
    };
}
exports.DefaultValue = DefaultValue;
