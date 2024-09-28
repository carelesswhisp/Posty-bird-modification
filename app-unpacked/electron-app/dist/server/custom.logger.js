"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomLogger = void 0;
const electron_1 = require("electron");
const common_1 = require("@nestjs/common");
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
require("winston-daily-rotate-file");
class CustomLogger extends common_1.Logger {
    error(message, trace, context) {
        if (message instanceof Error) {
            super.error(message.message, message.stack, context);
            CustomLogger.logger.error(`[${context || this.context}] ${message.message} ${trace || message.stack}`);
        }
        else {
            super.error(message, trace, context);
            if (typeof message === 'object') {
                CustomLogger.logger.error(`[${context || this.context}] ${JSON.stringify(message)} ${trace}`);
            }
            else {
                CustomLogger.logger.error(`[${context || this.context}] ${message} ${trace}`);
            }
        }
    }
    log(message, context) {
        super.log(message, context);
        if (typeof message !== 'string') {
            CustomLogger.logger.info(`[${context || this.context}] ${typeof message === 'object' ? JSON.stringify(message, null, 1) : message}`);
        }
        else if (!message.match(/(Mapped|Module)/) &&
            !(context || this.context).match(/(Resolver|Factory|Routes)/)) {
            CustomLogger.logger.info(`[${context || this.context}] ${message}`);
        }
    }
    warn(message, context) {
        super.warn(message, context);
        CustomLogger.logger.warn(`[${context || this.context}] ${message}`);
    }
    debug(message, context) {
        if (global.DEBUG_MODE) {
            super.debug(message, context);
            CustomLogger.logger.debug(`[${context || this.context}] ${message}`);
        }
    }
    verbose(message, context) {
        if (global.DEBUG_MODE) {
            super.verbose(message, context);
            CustomLogger.logger.verbose(`[${context || this.context}] ${message}`);
        }
    }
}
exports.CustomLogger = CustomLogger;
CustomLogger.logger = winston_1.default.createLogger({
    transports: [
        new winston_1.default.transports.DailyRotateFile({
            filename: 'app-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: 15,
            dirname: path_1.default.join(electron_1.app.getPath('userData'), 'logs'),
            auditFile: path_1.default.join(electron_1.app.getPath('userData'), 'logs', 'log-audit.json'),
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
        }),
    ],
    exitOnError: false,
});
