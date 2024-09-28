"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PostService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostService = void 0;
const common_1 = require("@nestjs/common");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const submission_service_1 = require("../submission.service");
const postybirb_commons_1 = require("postybirb-commons");
const website_provider_service_1 = require("../../websites/website-provider.service");
const settings_service_1 = require("../../settings/settings.service");
const submission_part_service_1 = require("../submission-part/submission-part.service");
const account_service_1 = require("../../account/account.service");
const website_base_1 = require("../../websites/website.base");
const poster_1 = require("./poster");
const log_service_1 = require("../log/log.service");
const events_gateway_1 = require("../../events/events.gateway");
const postybirb_commons_2 = require("postybirb-commons");
const submission_part_entity_1 = __importDefault(require("../submission-part/models/submission-part.entity"));
const file_submission_entity_1 = __importDefault(require("../file-submission/models/file-submission.entity"));
const electron_1 = require("electron");
const notification_service_1 = require("../../notification/notification.service");
const notification_type_enum_1 = require("../../notification/enums/notification-type.enum");
const ui_notification_service_1 = require("../../notification/ui-notification/ui-notification.service");
const parser_service_1 = require("../parser/parser.service");
const power_save_1 = require("../../../app/power-save");
let PostService = PostService_1 = class PostService {
    constructor(submissionService, accountService, parserService, websites, settings, partService, logService, eventEmitter, notificationService, uiNotificationService) {
        this.submissionService = submissionService;
        this.accountService = accountService;
        this.parserService = parserService;
        this.websites = websites;
        this.settings = settings;
        this.partService = partService;
        this.logService = logService;
        this.eventEmitter = eventEmitter;
        this.notificationService = notificationService;
        this.uiNotificationService = uiNotificationService;
        this.logger = new common_1.Logger(PostService_1.name);
        this.posting = {
            [postybirb_commons_1.SubmissionType.FILE]: null,
            [postybirb_commons_1.SubmissionType.NOTIFICATION]: null,
        };
        this.postingParts = {
            [postybirb_commons_1.SubmissionType.FILE]: [],
            [postybirb_commons_1.SubmissionType.NOTIFICATION]: [],
        };
        this.submissionQueue = {
            [postybirb_commons_1.SubmissionType.FILE]: [],
            [postybirb_commons_1.SubmissionType.NOTIFICATION]: [],
        };
        this.accountPostTimeMap = {};
        this.notifyPostingStateChanged = lodash_1.default.debounce(() => this.submissionService.postingStateChanged(), 100);
    }
    queue(submission) {
        this.logger.log(submission, 'Queueing');
        if (!this.isPosting(submission.type)) {
            this.post(submission).catch(() => {
                if (this.settings.getValue('emptyQueueOnFailedPost')) {
                    if (!this.hasQueued(submission.type)) {
                        return;
                    }
                    this.emptyQueue(submission.type);
                    this.notificationService.create({
                        type: notification_type_enum_1.NotificationType.WARNING,
                        body: `${lodash_1.default.capitalize(submission.type)} queue was emptied due to a failure or because there were problems with ${submission.title}.\n\nYou can change this behavior in your settings.`,
                        title: `${lodash_1.default.capitalize(submission.type)} Queue Cleared`,
                    });
                    this.uiNotificationService.createUINotification(notification_type_enum_1.NotificationType.WARNING, 10, `${lodash_1.default.capitalize(submission.type)} queue was emptied due to a failure or because there were problems with ${submission.title}.\n\nYou can change this behavior in your settings.`, `${lodash_1.default.capitalize(submission.type)} Queue Cleared`);
                }
            });
        }
        else {
            this.insert(submission);
        }
        (0, power_save_1.preventSleep)();
    }
    cancel(submission) {
        if (this.isCurrentlyPosting(submission)) {
            this.getPosters(submission.type).forEach(poster => poster.cancel());
        }
        else if (this.isCurrentlyQueued(submission)) {
            this.submissionQueue[submission.type].splice(this.submissionQueue[submission.type].findIndex(s => s._id === submission._id), 1);
        }
        else {
            return;
        }
        this.notifyPostingStateChanged();
    }
    isCurrentlyPosting(submission) {
        return !!(this.posting[submission.type] && this.posting[submission.type]._id === submission._id);
    }
    isCurrentlyPostingToAny() {
        return !!Object.values(this.posting).filter(post => !!post).length;
    }
    isCurrentlyQueued(submission) {
        return !!this.submissionQueue[submission.type].find(s => s._id === submission._id);
    }
    hasQueued(type) {
        return !!this.submissionQueue[type].length;
    }
    hasAnyQueued() {
        return !!Object.values(this.submissionQueue).filter(q => q.length).length;
    }
    getPostingStatus() {
        const posting = [];
        Object.values(this.posting).forEach(submission => {
            if (submission) {
                posting.push({
                    submission,
                    statuses: this.getPosters(submission.type).map(poster => ({
                        postAt: poster.postAt,
                        status: poster.status,
                        waitingForCondition: poster.waitForExternalStart,
                        website: poster.part.website,
                        accountId: poster.part.accountId,
                        source: poster.getSource(),
                        error: poster.getFullResponse().error,
                        isPosting: poster.isPosting,
                    })),
                });
            }
        });
        return {
            queued: lodash_1.default.flatten(Object.values(this.submissionQueue)),
            posting,
        };
    }
    insert(submission) {
        if (!this.isCurrentlyQueued(submission) && !this.isCurrentlyPosting(submission)) {
            this.logger.log(submission._id, `Inserting Into Queue ${submission.type}`);
            this.submissionQueue[submission.type].push(submission);
            this.notifyPostingStateChanged();
            this.notifyPostingStatusChanged();
        }
    }
    isPosting(type) {
        return !!this.posting[type];
    }
    async post(submission) {
        this.logger.log(submission._id, 'Posting');
        this.posting[submission.type] = submission;
        const validationPackage = await this.submissionService.validate(submission);
        const isValid = !lodash_1.default.flatMap(validationPackage.problems, p => p.problems).length;
        if (isValid) {
            if (submission.schedule.isScheduled) {
                this.submissionService.scheduleSubmission(submission._id, false);
            }
            this.notifyPostingStateChanged();
            this.notifyPostingStatusChanged();
            const parts = await this.partService.getPartsForSubmission(submission._id, false);
            const [defaultPart] = parts.filter(p => p.isDefault);
            const postingSubmission = submission.copy();
            if (this.isFileSubmission(postingSubmission)) {
                await this.preloadFiles(postingSubmission);
            }
            const existingSources = parts.filter(p => p.postedTo);
            this.postingParts[postingSubmission.type] = parts
                .filter(p => !p.isDefault)
                .filter(p => p.postStatus !== 'SUCCESS')
                .map(p => this.createPoster(postingSubmission, p, defaultPart, existingSources.filter(op => p.website !== op.website).map(op => op.postedTo)));
            this.getPosters(postingSubmission.type).forEach(poster => {
                poster.once('ready', () => this.notifyPostingStatusChanged());
                poster.once('posting', () => this.notifyPostingStatusChanged());
                poster.once('cancelled', data => this.checkForCompletion(submission));
                poster.once('done', data => {
                    if (data.source) {
                        this.addSource(submission.type, data.source);
                    }
                    if (data.status === 'SUCCESS') {
                        this.accountPostTimeMap[`${data.part.accountId}-${data.part.website}`] = Date.now();
                    }
                    this.partService
                        .createOrUpdateSubmissionPart(new submission_part_entity_1.default(Object.assign(Object.assign({}, data.part), { postStatus: data.status, postedTo: data.source })), submission.type)
                        .finally(() => {
                        this.notifyPostingStateChanged();
                        this.notifyPostingStatusChanged();
                        this.checkForCompletion(submission);
                    });
                });
            });
            this.checkForCompletion(submission);
            this.notifyPostingStatusChanged();
        }
        else {
            this.posting[submission.type] = null;
            throw new common_1.BadRequestException('Submission has problems');
        }
    }
    addSource(type, source) {
        this.postingParts[type].forEach(poster => {
            poster.addSource(source);
        });
    }
    checkForCompletion(submission) {
        const posters = this.getPosters(submission.type);
        const incomplete = posters.filter(poster => !poster.isDone);
        if (incomplete.length) {
            const waitingForExternal = incomplete.filter(poster => poster.waitForExternalStart);
            if (waitingForExternal.length === incomplete.length) {
                waitingForExternal.forEach(poster => poster.doPost());
            }
        }
        else {
            this.logService
                .addLog(submission, posters
                .filter(poster => poster.status !== 'CANCELLED')
                .map(poster => ({
                part: Object.assign(Object.assign({}, poster.part.asPlain()), { postStatus: poster.status, postedTo: poster.getSource() }),
                response: poster.getFullResponse(),
            })))
                .finally(() => {
                const canDelete = posters.length === posters.filter(p => p.status === 'SUCCESS').length;
                if (canDelete) {
                    const body = `Posted (${lodash_1.default.capitalize(submission.type)}) ${submission.title}`;
                    this.notificationService.create({
                        type: notification_type_enum_1.NotificationType.SUCCESS,
                        body,
                        title: 'Post Success',
                    }, submission instanceof file_submission_entity_1.default
                        ? electron_1.nativeImage.createFromPath(submission.primary.preview)
                        : undefined);
                    this.submissionService.deleteSubmission(submission._id, true);
                }
                else {
                    const body = posters
                        .filter(p => p.status === 'FAILED')
                        .map(p => p.getMessage())
                        .join('\n');
                    if (body) {
                        this.notificationService.create({
                            type: notification_type_enum_1.NotificationType.ERROR,
                            body,
                            title: `Post Failure: (${lodash_1.default.capitalize(submission.type)}) ${submission.title}`,
                        }, submission instanceof file_submission_entity_1.default
                            ? electron_1.nativeImage.createFromPath(submission.primary.preview)
                            : undefined);
                    }
                    this.uiNotificationService.createUINotification(notification_type_enum_1.NotificationType.ERROR, 20, posters.map(p => p.getMessage()).join('\n'), `Post Failure: ${submission.title}`);
                }
            });
            if (this.settings.getValue('emptyQueueOnFailedPost')) {
                const shouldEmptyQueue = !!posters.filter(p => p.status === 'FAILED').length;
                if (shouldEmptyQueue) {
                    this.clearQueueIfRequired(submission);
                }
            }
            this.clearAndPostNext(submission.type);
        }
    }
    async clearAndPostNext(type) {
        const next = this.submissionQueue[type][0];
        this.postingParts[type] = [];
        this.posting[type] = null;
        if (next) {
            this.submissionQueue[type].shift();
            try {
                this.notifyPostingStatusChanged();
                await this.post(next);
            }
            catch (err) {
                this.clearQueueIfRequired(next);
                this.clearAndPostNext(type);
            }
        }
        else {
            this.notifyPostingStateChanged();
            this.notifyPostingStatusChanged();
        }
    }
    createPoster(submission, part, defaultPart, sources) {
        const website = this.websites.getWebsiteModule(part.website);
        const waitForExternalStart = website.acceptsSourceUrls && sources.length === 0;
        return new poster_1.Poster(this.accountService, this.parserService, this.settings, website, submission, part, defaultPart, waitForExternalStart, sources, this.getWaitTime(part.accountId, website));
    }
    clearQueueIfRequired(submission) {
        if (this.settings.getValue('emptyQueueOnFailedPost')) {
            if (!this.hasQueued(submission.type)) {
                return;
            }
            this.emptyQueue(submission.type);
            this.notificationService.create({
                type: notification_type_enum_1.NotificationType.WARNING,
                body: `${lodash_1.default.capitalize(submission.type)} queue was emptied due to a failure to post.\n\nYou can change this behavior in your settings.`,
                title: `${lodash_1.default.capitalize(submission.type)} Queue Cleared`,
            }, submission instanceof file_submission_entity_1.default
                ? electron_1.nativeImage.createFromPath(submission.primary.preview)
                : undefined);
            this.uiNotificationService.createUINotification(notification_type_enum_1.NotificationType.WARNING, 0, `${lodash_1.default.capitalize(submission.type)} queue was emptied due to a failure to post.\n\nYou can change this behavior in your settings.`, `${lodash_1.default.capitalize(submission.type)} Queue Cleared`);
        }
    }
    emptyQueue(type) {
        this.logger.debug(`Emptying Queue ${type}`);
        this.submissionQueue[type] = [];
        this.notifyPostingStatusChanged();
        this.notifyPostingStateChanged();
    }
    getPosters(type) {
        return this.postingParts[type] || [];
    }
    getWaitTime(accountId, website) {
        const lastPosted = lodash_1.default.get(this.accountPostTimeMap, `${accountId}-${website.constructor.name}`, 0);
        const timeToWait = website.waitBetweenPostsInterval || 0;
        const timeDifference = Date.now() - lastPosted;
        if (timeDifference >= timeToWait) {
            return 5000;
        }
        else {
            return Math.max(Math.abs(timeDifference - timeToWait), 5000);
        }
    }
    isFileSubmission(submission) {
        return submission instanceof file_submission_entity_1.default;
    }
    async preloadFiles(submission) {
        const files = lodash_1.default.compact([
            submission.primary,
            submission.thumbnail,
            submission.fallback,
            ...submission.additional,
        ]);
        await Promise.all(files.map(record => {
            return fs_extra_1.default
                .readFile(record.location)
                .then(buffer => (record.buffer = buffer))
                .catch(err => {
                this.logger.error(err, 'Preload File Failure');
            });
        }));
    }
    notifyPostingStatusChanged() {
        this.eventEmitter.emit(postybirb_commons_2.Events.PostEvent.UPDATED, this.getPostingStatus());
    }
};
PostService = PostService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => submission_service_1.SubmissionService))),
    __metadata("design:paramtypes", [submission_service_1.SubmissionService,
        account_service_1.AccountService,
        parser_service_1.ParserService,
        website_provider_service_1.WebsiteProvider,
        settings_service_1.SettingsService,
        submission_part_service_1.SubmissionPartService,
        log_service_1.LogService,
        events_gateway_1.EventsGateway,
        notification_service_1.NotificationService,
        ui_notification_service_1.UiNotificationService])
], PostService);
exports.PostService = PostService;
