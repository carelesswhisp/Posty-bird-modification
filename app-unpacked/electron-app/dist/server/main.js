"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const http_exception_filter_1 = require("./http-exception.filter");
const ssl_1 = require("./ssl");
const compression_1 = __importDefault(require("compression"));
const auth_guard_1 = require("./auth.guard");
const custom_logger_1 = require("./custom.logger");
const directories_1 = require("./directories");
const logger = new custom_logger_1.CustomLogger();
async function bootstrap() {
    (0, directories_1.ensure)();
    const { key, cert } = ssl_1.SSL.getOrCreate();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        httpsOptions: {
            key,
            cert,
        },
        logger,
    });
    app.useGlobalInterceptors(new common_1.ClassSerializerInterceptor(app.get(core_1.Reflector)));
    app.useGlobalGuards(new auth_guard_1.AuthGuard());
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.use((0, compression_1.default)());
    await app.listen(process.env.PORT);
}
process.on('uncaughtException', err => logger.error(err.message, err.stack, 'Uncaught Exception'));
process.on('unhandledRejection', (err) => logger.error(err.message, err.stack, 'Unhandled Rejection'));
module.exports = bootstrap;
