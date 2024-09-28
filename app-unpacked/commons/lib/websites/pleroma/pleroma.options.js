"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pleroma = void 0;
const pleroma_file_options_1 = require("./pleroma.file.options");
const pleroma_notification_options_1 = require("./pleroma.notification.options");
class Pleroma {
}
exports.Pleroma = Pleroma;
Pleroma.FileOptions = pleroma_file_options_1.PleromaFileOptionsEntity;
Pleroma.NotificationOptions = pleroma_notification_options_1.PleromaNotificationOptionsEntity;
