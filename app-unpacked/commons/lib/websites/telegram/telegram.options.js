"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Telegram = void 0;
const telegram_file_options_1 = require("./telegram.file.options");
const telegram_notification_options_1 = require("./telegram.notification.options");
class Telegram {
}
exports.Telegram = Telegram;
Telegram.FileOptions = telegram_file_options_1.TelegramFileOptionsEntity;
Telegram.NotificationOptions = telegram_notification_options_1.TelegramNotificationOptionsEntity;
