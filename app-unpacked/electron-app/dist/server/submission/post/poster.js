"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Poster = void 0;
const events_1 = require("events");
const lodash_1 = __importDefault(require("lodash"));
const settings_service_1 = require("../../settings/settings.service");
const website_base_1 = require("../../websites/website.base");
const cancellation_token_1 = require("./cancellation/cancellation-token");
const cancellation_exception_1 = require("./cancellation/cancellation.exception");
class Poster extends events_1.EventEmitter {
    constructor(accountService, parser, settingsService, website, submission, part, defaultPart, waitForExternalStart, sources, timeUntilPost) {
        super();
        this.accountService = accountService;
        this.parser = parser;
        this.settingsService = settingsService;
        this.website = website;
        this.submission = submission;
        this.part = part;
        this.defaultPart = defaultPart;
        this.waitForExternalStart = waitForExternalStart;
        this.sources = sources;
        this.isPosting = false;
        this.isReady = false;
        this.isDone = false;
        this.status = 'UNPOSTED';
        this.retries = 0;
        this.postAtTimeout = setTimeout(this.post.bind(this), timeUntilPost);
        this.postAt = Date.now() + timeUntilPost;
        this.retries = settingsService.getValue('postRetries') || 0;
        this.cancellationToken = new cancellation_token_1.CancellationToken(this.handleCancel.bind(this));
        this.response = { website: part.website };
    }
    post() {
        this.isReady = true;
        this.emit('ready', {
            submission: this.submission,
            part: this.part,
        });
        if (!this.waitForExternalStart) {
            this.performPost();
        }
    }
    async performPost() {
        if (this.isCancelled()) {
            return;
        }
        try {
            if (this.website.refreshBeforePost) {
                const loginStatus = await this.accountService.checkLogin(this.part.accountId);
                if (!loginStatus.loggedIn) {
                    throw new Error('Not logged in');
                }
            }
            if (this.isCancelled()) {
                return;
            }
            const data = await this.parser.parse(this.website, this.submission, this.defaultPart, this.part);
            data.sources = this.sources;
            if (this.isCancelled()) {
                return;
            }
            this.isPosting = true;
            this.emit('posting', {
                submission: this.submission,
                part: this.part,
            });
            const res = await this.attemptPost(data);
            this.status = 'SUCCESS';
            this.done(res);
        }
        catch (err) {
            const error = err;
            const errorMsg = {
                website: this.part.website,
                time: new Date().toLocaleString(),
            };
            if (error instanceof Error) {
                errorMsg.stack = error.stack;
                errorMsg.error = error.message;
            }
            else {
                Object.assign(errorMsg, error);
            }
            if (error instanceof cancellation_exception_1.CancellationException) {
                this.status = 'CANCELLED';
            }
            else {
                this.status = 'FAILED';
            }
            this.done(errorMsg);
        }
    }
    attemptPost(data) {
        return new Promise(async (resolve, reject) => {
            let totalTries = this.retries + 1;
            let error = null;
            const timeoutTimer = setTimeout(() => {
                if (!this.isDone) {
                    this.cancel();
                    totalTries = 0;
                    reject(new Error(`PostyBirb timed out when posting. Please check ${this.website.constructor.name} to see if it actually completed.`));
                }
            }, 20 * 60000);
            while (totalTries > 0 && !this.isCancelled()) {
                try {
                    totalTries--;
                    const accountData = (await this.accountService.get(this.part.accountId)).data;
                    const res = await (this.isFilePost(data)
                        ? this.website.postFileSubmission(this.cancellationToken, data, accountData)
                        : this.website.postNotificationSubmission(this.cancellationToken, data, accountData));
                    clearTimeout(timeoutTimer);
                    resolve(res);
                    return;
                }
                catch (err) {
                    error = err;
                    if (this.isCancelled()) {
                        totalTries = 0;
                    }
                }
            }
            clearTimeout(timeoutTimer);
            reject(error);
        });
    }
    fakePost() {
        return new Promise(resolve => {
            const random = lodash_1.default.random(0, 100);
            if (random > 90) {
                setTimeout(function () {
                    resolve({ website: this.part.website });
                }.bind(this), lodash_1.default.random(8000));
            }
            else {
                throw new Error('Fake Failure');
            }
        });
    }
    done(response) {
        if (!this.isDone) {
            this.isDone = true;
            this.isPosting = false;
            this.response = response;
            this.emit('done', {
                submission: this.submission,
                part: this.part,
                source: response.source,
                status: this.status,
            });
        }
    }
    isFilePost(data) {
        return !!data['primary'];
    }
    handleCancel() {
        if (this.isPosting) {
            return;
        }
        this.status = 'CANCELLED';
        this.isDone = true;
        clearTimeout(this.postAtTimeout);
        this.emit('cancelled', {
            submission: this.submission,
            part: this.part,
        });
    }
    addSource(source) {
        if (!this.sources.includes(source)) {
            this.sources.push(source);
        }
    }
    cancel() {
        if (!(this.cancellationToken.isCancelled() || this.isDone)) {
            this.cancellationToken.cancel();
        }
    }
    isCancelled() {
        return this.cancellationToken.isCancelled();
    }
    doPost() {
        this.waitForExternalStart = false;
        if (this.isReady) {
            this.performPost();
        }
    }
    getMessage() {
        let reason = '';
        if (this.status === 'CANCELLED') {
            reason = 'was cancelled.';
        }
        else if (this.status === 'SUCCESS') {
            reason = 'was successful.';
        }
        else if (this.status === 'FAILED') {
            reason = this.response.message || this.response.error || 'Unknown error occurred.';
        }
        return `${this.part.website}: ${reason}`;
    }
    getSource() {
        return this.response.source;
    }
    getFullResponse() {
        return this.response;
    }
}
exports.Poster = Poster;
