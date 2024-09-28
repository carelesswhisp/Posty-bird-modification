"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Twitter = void 0;
const default_options_entity_1 = require("../../models/default-options.entity");
const twitter_file_options_1 = require("./twitter.file.options");
class Twitter {
}
exports.Twitter = Twitter;
Twitter.FileOptions = twitter_file_options_1.TwitterFileOptionsEntity;
Twitter.NotificationOptions = default_options_entity_1.DefaultOptionsEntity;
