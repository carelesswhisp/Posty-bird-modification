"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissKey = void 0;
const misskey_file_options_1 = require("./misskey.file.options");
const misskey_notification_options_1 = require("./misskey.notification.options");
class MissKey {
}
exports.MissKey = MissKey;
MissKey.FileOptions = misskey_file_options_1.MissKeyFileOptionsEntity;
MissKey.NotificationOptions = misskey_notification_options_1.MissKeyNotificationOptionsEntity;
