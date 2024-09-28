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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var TwitterAPIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwitterAPIService = void 0;
const common_1 = require("@nestjs/common");
const _ = __importStar(require("lodash"));
const request = __importStar(require("request"));
const twitter_lite_1 = __importDefault(require("twitter-lite"));
const twitter_sensitive_media_warnings_enum_1 = require("./enums/twitter-sensitive-media-warnings.enum");
const api_response_model_1 = require("./models/api-response.model");
let TwitterAPIService = TwitterAPIService_1 = class TwitterAPIService {
    constructor() {
        this.logger = new common_1.Logger(TwitterAPIService_1.name);
        this.MAX_FILE_CHUNK = 5 * 1024 * 1024;
    }
    getClient(apiKeys, token, version) {
        const config = {
            consumer_key: apiKeys.key,
            consumer_secret: apiKeys.secret,
            version: version || '1.1',
            extension: version === '2' ? false : true,
        };
        if (token) {
            config.access_token_key = token.oauth_token;
            config.access_token_secret = token.oauth_token_secret;
        }
        return new twitter_lite_1.default(config);
    }
    async startAuthorization(data) {
        try {
            const auth = await this.getClient(data).getRequestToken('oob');
            return new api_response_model_1.ApiResponse({
                data: {
                    url: `https://api.twitter.com/oauth/authenticate?oauth_token=${auth.oauth_token}`,
                    oauth_token: auth.oauth_token,
                },
            });
        }
        catch (err) {
            this.logger.error(err, err.stack, 'Twitter Auth Start Failure');
            return new api_response_model_1.ApiResponse({ error: err });
        }
    }
    async completeAuthorization(data) {
        try {
            const auth = await this.getClient({ key: data.key, secret: data.secret }).getAccessToken({
                oauth_token: data.oauth_token,
                oauth_verifier: data.verifier,
            });
            return new api_response_model_1.ApiResponse({ data: auth });
        }
        catch (err) {
            this.logger.error(err, err.stack, 'Twitter Auth Complete Failure');
            return new api_response_model_1.ApiResponse({ error: err });
        }
    }
    async post(apiKeys, data) {
        var _a, _b;
        const client = this.getClient(apiKeys, {
            oauth_token: data.token,
            oauth_token_secret: data.secret,
        });
        const tweets = [];
        const tweet = {
            text: data.description || '',
        };
        tweet.text = ((tweet === null || tweet === void 0 ? void 0 : tweet.text) || '');
        let mediaIds = [];
        if (data.files.length) {
            try {
                mediaIds = await Promise.all(data.getFilesforPost().map(file => this.uploadMedia(apiKeys, client, file)));
                const twitterSMW = (_b = twitter_sensitive_media_warnings_enum_1.ESensitiveMediaWarnings_Utils.getSMWFromContentBlur((_a = data === null || data === void 0 ? void 0 : data.options) === null || _a === void 0 ? void 0 : _a.contentBlur)) !== null && _b !== void 0 ? _b : undefined;
                if (twitterSMW)
                    await Promise.all(mediaIds.map(mediaIdIter => {
                        const mediaMdBody = { media_id: mediaIdIter };
                        mediaMdBody.sensitive_media_warning = [twitterSMW];
                        return client.post('media/metadata/create', mediaMdBody);
                    }));
            }
            catch (err) {
                this.logger.error(err, err.stack, 'Failed to upload files to Twitter');
                return new api_response_model_1.ApiResponse({
                    error: Array.isArray(err) ? err.map(e => e.message).join('\n') : err,
                });
            }
            const ids = _.chunk(mediaIds, 4);
            ids.forEach((idGroup, i) => {
                const t = Object.assign(Object.assign({}, tweet), { media: { media_ids: idGroup } });
                if (ids.length > 1) {
                    if (i === 0) {
                        const numberedStatus = `${i + 1}/${ids.length} ${t.text}`;
                        if (numberedStatus.length <= 280) {
                            t.text = numberedStatus;
                        }
                    }
                    if (i > 0) {
                        t.text = `${i + 1}/${ids.length}`;
                    }
                }
                tweets.push(t);
            });
        }
        else {
            tweets.push(tweet);
        }
        try {
            let url;
            let replyId;
            for (const t of tweets) {
                if (replyId) {
                    t.reply = {
                        in_reply_to_tweet_id: replyId,
                    };
                }
                const tokens = client['token'];
                const oauth = {
                    consumer_key: apiKeys.key,
                    consumer_secret: apiKeys.secret,
                    token: tokens.key,
                    token_secret: tokens.secret,
                };
                const post = await this.postTweet(t, oauth);
                const me = await this.getAuthenticatedUser(oauth);
                if (!url) {
                    url = `https://twitter.com/${me.data.username}/status/${post.data.id}`;
                }
                replyId = post.id_str;
            }
            return new api_response_model_1.ApiResponse({
                data: {
                    url,
                },
            });
        }
        catch (err) {
            this.logger.error(err, '', 'Failed to post');
            return new api_response_model_1.ApiResponse({
                error: Array.isArray(err) ? err.map(e => e.message).join('\n') : err,
            });
        }
    }
    getAuthenticatedUser(oauth) {
        const url = 'https://api.twitter.com/2/users/me';
        return new Promise((resolve, reject) => {
            request.get(url, {
                json: true,
                oauth,
            }, (err, res, body) => {
                if (body && body.errors) {
                    reject(body.errors);
                }
                else {
                    resolve(body);
                }
            });
        });
    }
    postTweet(form, oauth) {
        const url = 'https://api.twitter.com/2/tweets';
        return new Promise((resolve, reject) => {
            request.post(url, {
                json: true,
                body: form,
                oauth,
            }, (err, res, body) => {
                if (body && body.errors) {
                    reject(body.errors);
                }
                else {
                    resolve(body);
                }
            });
        });
    }
    async uploadMedia(apiKeys, client, file) {
        const init = {
            command: 'INIT',
            media_type: file.options.contentType,
            total_bytes: file.value.length,
            media_category: 'tweet_image',
        };
        if (file.options.contentType === 'image/gif') {
            init.media_category = 'tweet_gif';
        }
        else if (!file.options.contentType.includes('image')) {
            init.media_category = 'tweet_video';
        }
        const url = 'https://upload.twitter.com/1.1/media/upload.json';
        const tokens = client['token'];
        const oauth = {
            consumer_key: apiKeys.key,
            consumer_secret: apiKeys.secret,
            token: tokens.key,
            token_secret: tokens.secret,
        };
        const mediaData = await new Promise((resolve, reject) => {
            request.post(url, {
                json: true,
                form: init,
                oauth,
            }, (err, res, body) => {
                if (body && body.errors) {
                    reject(body.errors);
                }
                else {
                    resolve(body);
                }
            });
        });
        const { media_id_string } = mediaData;
        const chunks = _.chunk(file.value, this.MAX_FILE_CHUNK);
        await Promise.all(chunks.map((chunk, i) => this.uploadChunk(oauth, media_id_string, Buffer.from(chunk), i)));
        await new Promise((resolve, reject) => {
            request.post(url, {
                form: {
                    command: 'FINALIZE',
                    media_id: media_id_string,
                },
                json: true,
                oauth,
            }, (err, res, body) => {
                if (body && body.errors) {
                    reject(body.errors);
                }
                else {
                    resolve(body);
                }
            });
        });
        return media_id_string;
    }
    uploadChunk(oauth, id, chunk, index) {
        return new Promise((resolve, reject) => {
            request.post('https://upload.twitter.com/1.1/media/upload.json', {
                formData: {
                    command: 'APPEND',
                    media_id: id,
                    media_data: chunk.toString('base64'),
                    segment_index: index,
                },
                json: true,
                oauth,
            }, (err, res, body) => {
                if (body && body.errors) {
                    reject(body.errors);
                }
                else {
                    resolve(body);
                }
            });
        });
    }
};
TwitterAPIService = TwitterAPIService_1 = __decorate([
    (0, common_1.Injectable)()
], TwitterAPIService);
exports.TwitterAPIService = TwitterAPIService;
