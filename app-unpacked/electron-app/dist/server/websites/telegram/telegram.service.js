"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Telegram = void 0;
const MTProtoClass = require('@mtproto/core');
const common_1 = require("@nestjs/common");
const postybirb_commons_1 = require("postybirb-commons");
const user_account_entity_1 = __importDefault(require("../../account/models/user-account.entity"));
const image_manipulator_1 = __importDefault(require("../../file-manipulation/manipulators/image.manipulator"));
const cancellation_token_1 = require("../../submission/post/cancellation/cancellation-token");
const file_post_data_interface_1 = require("../../submission/post/interfaces/file-post-data.interface");
const post_data_interface_1 = require("../../submission/post/interfaces/post-data.interface");
const validation_parts_interface_1 = require("../../submission/validator/interfaces/validation-parts.interface");
const filesize_util_1 = __importDefault(require("../../utils/filesize.util"));
const form_content_util_1 = __importDefault(require("../../utils/form-content.util"));
const wait_util_1 = __importDefault(require("../../utils/wait.util"));
const website_validator_util_1 = __importDefault(require("../../utils/website-validator.util"));
const generic_account_props_enum_1 = require("../generic/generic-account-props.enum");
const website_base_1 = require("../website.base");
const telegram_storage_1 = require("./telegram.storage");
const _ = require("lodash");
const telegram_description_parser_1 = require("./telegram-description.parser");
let Telegram = class Telegram extends website_base_1.Website {
    constructor() {
        super(...arguments);
        this.acceptsFiles = [];
        this.MAX_CHARS = undefined;
        this.instances = {};
        this.authData = {};
        this.acceptsAdditionalFiles = true;
        this.waitBetweenPostsInterval = 30000;
        this.DEFAULT_WAIT = 3000;
        this.MAX_MB = 30;
        this.usernameMap = {};
    }
    async callApi(appId, protocol, data) {
        var _a;
        if (this.lastCall) {
            const now = Date.now();
            if (now - this.lastCall <= this.DEFAULT_WAIT) {
                await wait_util_1.default.wait(Math.max(this.DEFAULT_WAIT - (now - this.lastCall), 1000));
            }
        }
        this.logger.debug(`Calling: ${protocol}`);
        let res;
        let resErr;
        try {
            this.lastCall = Date.now();
            res = await this.instances[appId].call(protocol, data);
        }
        catch (err) {
            this.logger.error(err);
            if ((_a = err === null || err === void 0 ? void 0 : err.error_message) === null || _a === void 0 ? void 0 : _a.startsWith('FLOOD_WAIT')) {
                const wait = Number(err.error_message.split('_').pop());
                if (wait > 60) {
                    this.logger.error('Telegram wait period exceeded limit.');
                    this.logger.error(err, undefined, `TelegramAPIWaited:${protocol}`);
                    resErr = err;
                }
                else {
                    try {
                        await wait_util_1.default.wait(1000 * (wait + 1));
                        res = (await this.instances[appId].call(protocol, data));
                    }
                    catch (waitErr) {
                        this.logger.error(waitErr, undefined, `TelegramAPIWaited:${protocol}`);
                        resErr = waitErr;
                    }
                }
            }
            else {
                resErr = err;
            }
        }
        this.lastCall = Date.now();
        return resErr ? Promise.reject(resErr) : res;
    }
    async authenticate(data) {
        var _a, _b;
        try {
            const signIn = await this.callApi(data.appId, 'auth.signIn', {
                phone_number: this.authData[data.appId].phone_number,
                phone_code: data.code,
                phone_code_hash: this.authData[data.appId].phone_code_hash,
            });
            this.usernameMap[data.appId] = (_a = signIn === null || signIn === void 0 ? void 0 : signIn.user) === null || _a === void 0 ? void 0 : _a.username;
            return { result: true };
        }
        catch (err) {
            this.logger.error(err);
            if (err.error_message.includes('SESSION_PASSWORD_NEEDED')) {
                if (!data.password)
                    return {
                        result: false,
                        message: '2FA enabled, password required',
                        passwordRequired: true,
                    };
                const { srp_id, current_algo: { g, p, salt1, salt2 }, srp_B, } = await this.callApi(data.appId, 'account.getPassword', {});
                const { A, M1 } = await this.instances[data.appId].crypto.getSRPParams({
                    g,
                    p,
                    salt1,
                    salt2,
                    gB: srp_B,
                    password: data.password,
                });
                const signIn = await this.callApi(data.appId, 'auth.checkPassword', {
                    password: {
                        _: 'inputCheckPasswordSRP',
                        srp_id,
                        A,
                        M1,
                    },
                });
                this.usernameMap[data.appId] = (_b = signIn === null || signIn === void 0 ? void 0 : signIn.user) === null || _b === void 0 ? void 0 : _b.username;
                return { result: true };
            }
            return { result: false, message: err.error_message };
        }
    }
    async startAuthentication(data) {
        this.logger.log('Starting Authentication');
        try {
            await this.createInstance(data);
            await this.callApi(data.appId, 'auth.logOut', undefined);
            const authData = await this.callApi(data.appId, 'auth.sendCode', {
                phone_number: data.phoneNumber,
                settings: {
                    _: 'codeSettings',
                },
            });
            this.authData[data.appId] = {
                phone_code_hash: authData.phone_code_hash,
                phone_number: data.phoneNumber,
            };
        }
        catch (err) {
            this.logger.error(err);
            if (err.error_message.includes('PHONE_MIGRATE')) {
                await wait_util_1.default.wait(1000);
                await this.instances[data.appId].setDefaultDc(Number(err.error_message.split('_').pop()));
                const authData = await this.callApi(data.appId, 'auth.sendCode', {
                    phone_number: data.phoneNumber,
                    settings: {
                        _: 'codeSettings',
                    },
                });
                this.authData[data.appId] = {
                    phone_code_hash: authData.phone_code_hash,
                    phone_number: data.phoneNumber,
                };
            }
            else {
                throw err;
            }
        }
    }
    async checkLoginStatus(data) {
        const status = { loggedIn: false, username: null };
        const { appId } = data.data;
        if (!this.instances[appId]) {
            await this.createInstance(data.data);
        }
        await this.loadChannels(data._id, appId);
        status.loggedIn = true;
        status.username = data.data.username || this.usernameMap[appId] || '<Your Telegram Account>';
        if (this.usernameMap[appId]) {
            status.data = Object.assign(Object.assign({}, data.data), { username: this.usernameMap[appId] });
        }
        return status;
    }
    async createInstance(data) {
        const { appId, appHash, phoneNumber } = data;
        if (appId && appHash && phoneNumber) {
            if (!this.instances[appId]) {
                this.instances[appId] = new MTProtoClass({
                    api_id: Number(appId),
                    api_hash: appHash,
                    storageOptions: {
                        instance: new telegram_storage_1.TelegramStorage(appId),
                    },
                });
            }
        }
        else {
            throw new Error('Incomplete Telegram account data');
        }
    }
    async loadChannels(profileId, appId) {
        const { chats } = await this.callApi(appId, 'messages.getDialogs', {
            offset_peer: {
                _: 'inputPeerEmpty',
            },
            limit: 400,
        });
        const channels = chats
            .filter(c => {
            var _a, _b;
            if (c.left || c.deactivated || !['channel', 'chat'].includes(c._))
                return false;
            if (c.creator ||
                ((_a = c.admin_rights) === null || _a === void 0 ? void 0 : _a.post_messages) ||
                ((_b = c.default_banned_rights) === null || _b === void 0 ? void 0 : _b.send_media) === false)
                return true;
        })
            .map(c => ({
            label: c.title,
            value: `${c.id}-${c.access_hash}`,
        }));
        this.storeAccountInformation(profileId, generic_account_props_enum_1.GenericAccountProp.FOLDERS, channels);
    }
    transformAccountData(data) {
        return data;
    }
    parseDescription(text, type) {
        return text;
    }
    getScalingOptions(file) {
        return { maxSize: filesize_util_1.default.MBtoBytes(this.MAX_MB) };
    }
    async upload(appId, file, spoiler) {
        const parts = _.chunk(file.file.value, filesize_util_1.default.MBtoBytes(0.5));
        const file_id = Date.now();
        const type = file.file.options.contentType === 'image/png' ||
            file.file.options.contentType === 'image/jpg' ||
            file.file.options.contentType === 'image/jpeg'
            ? 'photo'
            : 'document';
        const bigFile = file.file.value.length >= filesize_util_1.default.MBtoBytes(10) && type === 'document';
        let media = {
            _: `inputMediaUploaded${type === 'document' ? 'Document' : 'Photo'}`,
            spoiler,
        };
        if (type === 'document') {
            media.attributes = [];
            media.mime_type = file.file.options.contentType;
            if (media.mime_type === 'image/gif') {
                media.nosound_video = true;
            }
        }
        const total_parts = bigFile ? { file_total_parts: parts.length } : {};
        for (let i = 0; i < parts.length; i++) {
            await this.callApi(appId, `upload.save${bigFile ? 'Big' : ''}FilePart`, Object.assign(Object.assign({}, total_parts), { file_id, file_part: i, bytes: parts[i] }));
        }
        media.file = {
            _: `inputFile${bigFile ? 'Big' : ''}`,
            id: file_id,
            parts: parts.length,
            name: file.file.options.filename,
        };
        return media;
    }
    async postFileSubmission(cancellationToken, data, accountData) {
        var _a;
        const appId = accountData.appId;
        const files = [data.primary, ...data.additional];
        const medias = [];
        for (const file of files) {
            this.checkCancelled(cancellationToken);
            medias.push(await this.upload(appId, file, data.options.spoiler));
        }
        let response;
        const { description, entities } = telegram_description_parser_1.TelegramDescription.fromHTML(data.description.trim().slice(0, 4096));
        let mediaDescription = '';
        let mediaEntities = [];
        let messageDescription = '';
        if (description.length < 1024) {
            mediaDescription = description;
            mediaEntities = entities;
        }
        else {
            messageDescription = description;
        }
        for (const channel of data.options.channels) {
            this.checkCancelled(cancellationToken);
            const [channel_id, access_hash] = channel.split('-');
            const peer = {
                _: 'inputPeerChannel',
                channel_id,
                access_hash,
            };
            if (files.length === 1) {
                response = await this.callApi(appId, `messages.sendMedia`, {
                    random_id: Date.now(),
                    media: medias[0],
                    message: mediaDescription,
                    entities: mediaEntities,
                    silent: data.options.silent,
                    peer,
                });
            }
            else {
                let singleMedias = [];
                for (let i = 0; i < medias.length; i++) {
                    const media = medias[i];
                    const type = media._.includes('Document') ? 'document' : 'photo';
                    const messageMedia = await this.callApi(appId, `messages.uploadMedia`, {
                        media,
                        peer,
                    });
                    const file = (_a = messageMedia.photo) !== null && _a !== void 0 ? _a : messageMedia.document;
                    singleMedias.push({
                        _: 'inputSingleMedia',
                        random_id: Date.now(),
                        media: Object.assign(Object.assign({}, media), { _: type === 'photo' ? 'inputMediaPhoto' : 'inputMediaDocument', id: {
                                _: type === 'photo' ? 'inputPhoto' : 'inputDocument',
                                id: file.id,
                                access_hash: file.access_hash,
                                file_reference: file.file_reference,
                            } }),
                        message: i === 0 ? mediaDescription : void 0,
                        entities: i === 0 ? mediaEntities : void 0,
                    });
                }
                const mediasPerBatch = 10;
                const batches = 1 + (singleMedias.length - 1) / mediasPerBatch;
                for (let i = 0; i < batches; i++) {
                    response = await this.callApi(appId, 'messages.sendMultiMedia', {
                        multi_media: singleMedias.slice(i * mediasPerBatch, (i + 1) * mediasPerBatch),
                        silent: data.options.silent,
                        peer,
                    });
                }
            }
            if (messageDescription) {
                await this.callApi(accountData.appId, 'messages.sendMessage', {
                    random_id: Date.now(),
                    message: messageDescription,
                    silent: data.options.silent,
                    entities,
                    peer,
                });
            }
            await wait_util_1.default.wait(1000);
        }
        return this.createPostResponse({ source: this.getSourceFromResponse(response) });
    }
    async postNotificationSubmission(cancellationToken, data, accountData) {
        let response;
        const { description, entities } = telegram_description_parser_1.TelegramDescription.fromHTML(data.description.trim().slice(0, 4096));
        for (const channel of data.options.channels) {
            this.checkCancelled(cancellationToken);
            const [channel_id, access_hash] = channel.split('-');
            const peer = {
                _: 'inputPeerChannel',
                channel_id,
                access_hash,
            };
            response = await this.callApi(accountData.appId, 'messages.sendMessage', {
                random_id: Date.now(),
                message: description,
                entities: entities,
                silent: data.options.silent,
                peer,
            });
            await wait_util_1.default.wait(2000);
        }
        return this.createPostResponse({ source: this.getSourceFromResponse(response) });
    }
    getSourceFromResponse(response) {
        const update = response.updates.find(e => e._ === 'updateNewChannelMessage');
        if (!update || !update.peer_id || !update.id)
            return '';
        return `https://t.me/c/${update.peer_id.channel_id}/${update.id}`;
    }
    validateFileSubmission(submission, submissionPart, defaultPart) {
        var _a;
        const problems = [];
        const warnings = [];
        const isAutoscaling = submissionPart.data.autoScale;
        if ((_a = submissionPart.data.channels) === null || _a === void 0 ? void 0 : _a.length) {
            const folders = _.get(this.accountInformation.get(submissionPart.accountId), generic_account_props_enum_1.GenericAccountProp.FOLDERS, []);
            submissionPart.data.channels.forEach(f => {
                if (!website_validator_util_1.default.folderIdExists(f, folders)) {
                    problems.push(this.channelNotFound(f));
                }
            });
        }
        else {
            problems.push('No channel(s) selected.');
        }
        const { description } = telegram_description_parser_1.TelegramDescription.fromHTML(form_content_util_1.default.getDescription(defaultPart.data.description, submissionPart.data.description));
        if (description.length > 4096) {
            warnings.push('Max description length allowed is 4,096 characters.');
        }
        const files = [
            submission.primary,
            ...(submission.additional || []).filter(f => !f.ignoredAccounts.includes(submissionPart.accountId)),
        ];
        files.forEach(file => {
            const { type, size, name, mimetype } = file;
            if (filesize_util_1.default.MBtoBytes(this.MAX_MB) < size) {
                if (isAutoscaling &&
                    type === postybirb_commons_1.FileSubmissionType.IMAGE &&
                    image_manipulator_1.default.isMimeType(mimetype)) {
                    warnings.push(`${name} will be scaled down to ${this.MAX_MB}MB`);
                }
                else {
                    problems.push(`Telegram limits ${mimetype} to ${this.MAX_MB}MB`);
                }
            }
            if (filesize_util_1.default.MBtoBytes(10) < size && type !== postybirb_commons_1.FileSubmissionType.IMAGE) {
                warnings.push(`${name} will show in channel as Unknown Track but still will be available to download.`);
            }
        });
        return { problems, warnings };
    }
    validateNotificationSubmission(submission, submissionPart, defaultPart) {
        var _a;
        const problems = [];
        const warnings = [];
        if ((_a = submissionPart.data.channels) === null || _a === void 0 ? void 0 : _a.length) {
            const folders = _.get(this.accountInformation.get(submissionPart.accountId), generic_account_props_enum_1.GenericAccountProp.FOLDERS, []);
            submissionPart.data.channels.forEach(f => {
                if (!website_validator_util_1.default.folderIdExists(f, folders)) {
                    problems.push(this.channelNotFound(f));
                }
            });
        }
        else {
            problems.push('No channel(s) selected.');
        }
        const { description } = telegram_description_parser_1.TelegramDescription.fromHTML(form_content_util_1.default.getDescription(defaultPart.data.description, submissionPart.data.description));
        if (description.length > 4096) {
            warnings.push('Max description length allowed is 4,096 characters.');
        }
        return { problems, warnings };
    }
    channelNotFound(f) {
        return `Channel (${f}) not found. To fix this, simply post something in the channel. PostyBirb requests latest 400 chats and then filters them to include only those where you can send media. If you have a lot of active chats, PostyBirb will be not able to view inactive channels.`;
    }
};
Telegram = __decorate([
    (0, common_1.Injectable)()
], Telegram);
exports.Telegram = Telegram;
