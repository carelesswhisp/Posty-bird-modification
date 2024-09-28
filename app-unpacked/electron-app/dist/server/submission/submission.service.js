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
var SubmissionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionService = void 0;
const common_1 = require("@nestjs/common");
const fs_extra_1 = __importDefault(require("fs-extra"));
const events_gateway_1 = require("../events/events.gateway");
const file_submission_service_1 = require("./file-submission/file-submission.service");
const postybirb_commons_1 = require("postybirb-commons");
const submission_part_service_1 = require("./submission-part/submission-part.service");
const submission_repository_1 = require("./submission.repository");
const postybirb_commons_2 = require("postybirb-commons");
const validator_service_1 = require("./validator/validator.service");
const post_service_1 = require("./post/post.service");
const schedule_1 = require("@nestjs/schedule");
const submission_entity_1 = __importDefault(require("./models/submission.entity"));
const submission_schedule_model_1 = __importDefault(require("./models/submission-schedule.model"));
const submission_part_entity_1 = __importDefault(require("./submission-part/models/submission-part.entity"));
const file_submission_entity_1 = __importDefault(require("./file-submission/models/file-submission.entity"));
const account_service_1 = require("../account/account.service");
const website_provider_service_1 = require("../websites/website-provider.service");
const postybirb_commons_3 = require("postybirb-commons");
const submission_create_model_1 = __importDefault(require("./models/submission-create.model"));
const power_save_1 = require("../../app/power-save");
let SubmissionService = SubmissionService_1 = class SubmissionService {
    constructor(repository, partService, fileSubmissionService, validatorService, eventEmitter, postService, accountService, websiteProvider) {
        this.repository = repository;
        this.partService = partService;
        this.fileSubmissionService = fileSubmissionService;
        this.validatorService = validatorService;
        this.eventEmitter = eventEmitter;
        this.postService = postService;
        this.accountService = accountService;
        this.websiteProvider = websiteProvider;
        this.logger = new common_1.Logger(SubmissionService_1.name);
        this.checkForQueuedOrScheduled();
    }
    async queueScheduledSubmissions() {
        this.logger.debug('Schedule Post Check', 'Schedule Check');
        const submissions = await this.getAllAndValidate();
        const now = Date.now();
        submissions
            .filter(p => p.submission.schedule.isScheduled)
            .filter(p => p.submission.schedule.postAt <= now)
            .filter(p => !this.postService.isCurrentlyPosting(p.submission))
            .filter(p => !this.postService.isCurrentlyQueued(p.submission))
            .sort((a, b) => {
            if (a.submission.schedule.postAt === b.submission.schedule.postAt) {
                return a.submission.order - b.submission.order;
            }
            return a.submission.schedule.postAt - b.submission.schedule.postAt;
        })
            .forEach(p => {
            this.scheduleSubmission(p.submission._id, false);
            this.postService.queue(p.submission);
        });
    }
    async checkForQueuedOrScheduled() {
        this.logger.debug('Queued/Scheduled Check');
        const submissions = await this.getAllAndValidate();
        const hasScheduled = !!submissions.filter(p => p.submission.schedule.isScheduled).length;
        const hasQueuedOrPosting = this.postService.hasAnyQueued() || this.postService.isCurrentlyPostingToAny();
        if (hasQueuedOrPosting || hasScheduled) {
            (0, power_save_1.preventSleep)();
        }
        else {
            (0, power_save_1.enableSleep)();
        }
    }
    async get(id) {
        if (id instanceof submission_entity_1.default) {
            return id;
        }
        const submission = await this.repository.findOne(id);
        if (!submission) {
            throw new common_1.NotFoundException(`Submission ${id} could not be found`);
        }
        submission.isPosting = this.postService.isCurrentlyPosting(submission);
        submission.isQueued = this.postService.isCurrentlyQueued(submission);
        return submission;
    }
    async getAndValidate(id) {
        return this.validate(await this.get(id));
    }
    async getAll(type) {
        const query = {};
        if (type) {
            query.type = type;
        }
        const submissions = await this.repository.find(query);
        submissions.forEach(submission => {
            submission.isPosting = this.postService.isCurrentlyPosting(submission);
            submission.isQueued = this.postService.isCurrentlyQueued(submission);
        });
        return submissions;
    }
    async getAllAndValidate(type) {
        return (await Promise.all((await this.getAll(type)).map(s => this.validate(s)))).filter(s => Object.keys(s.parts).length);
    }
    postingStateChanged() {
        this.eventEmitter.emitOnComplete(postybirb_commons_1.Events.SubmissionEvent.UPDATED, this.getAllAndValidate());
    }
    async create(createDto) {
        if (!postybirb_commons_2.SubmissionType[createDto.type]) {
            throw new common_1.BadRequestException(`Unknown submission type: ${createDto.type}`);
        }
        const submission = new submission_entity_1.default({
            title: createDto.title,
            schedule: new submission_schedule_model_1.default(),
            type: createDto.type,
            sources: [],
            order: await this.repository.count({ type: createDto.type }),
        });
        let completedSubmission = null;
        try {
            switch (createDto.type) {
                case postybirb_commons_2.SubmissionType.FILE:
                    completedSubmission = await this.fileSubmissionService.createSubmission(submission, createDto);
                    break;
                case postybirb_commons_2.SubmissionType.NOTIFICATION:
                    completedSubmission = submission;
                    break;
            }
        }
        catch (err) {
            throw new common_1.InternalServerErrorException(err.message);
        }
        const { thumbnailFile, thumbnailPath } = createDto;
        if (completedSubmission.primary && thumbnailFile && thumbnailPath) {
            try {
                await this.fileSubmissionService.changeThumbnailFile(completedSubmission, thumbnailFile, thumbnailPath);
            }
            catch (err) {
                this.logger.error(err.message, err.stack, 'Create Thumbnail Failure');
            }
        }
        try {
            const submission = await this.repository.save(completedSubmission);
            await this.partService.createDefaultPart(completedSubmission);
            if (createDto.parts) {
                const parts = JSON.parse(createDto.parts);
                await Promise.all(parts.map(part => {
                    delete part._id;
                    delete part.lastUpdated;
                    delete part.created;
                    part.submissionId = submission._id;
                    const entity = new submission_part_entity_1.default(part);
                    return this.partService.createOrUpdateSubmissionPart(entity, submission.type);
                }));
            }
        }
        catch (err) {
            this.logger.error(err.message, err.stack, 'Create Failure');
            await this.deleteSubmission(completedSubmission);
            throw new common_1.InternalServerErrorException(err);
        }
        this.eventEmitter.emitOnComplete(postybirb_commons_1.Events.SubmissionEvent.CREATED, this.validate(completedSubmission));
        return completedSubmission;
    }
    async recreate(log) {
        const { submission, parts, defaultPart } = log;
        const createData = new submission_create_model_1.default({
            type: submission.type,
            title: submission.title,
        });
        if (createData.type === postybirb_commons_2.SubmissionType.FILE) {
            createData.path = submission.primary.originalPath;
            createData.file = {
                originalname: submission.primary.name,
                mimetype: submission.primary.mimetype,
                encoding: '',
                fieldname: 'file',
                buffer: await fs_extra_1.default
                    .readFile(submission.primary.originalPath)
                    .catch(() => Buffer.from([])),
            };
        }
        const newSubmission = await this.create(createData);
        try {
            const submissionParts = parts
                .map(responsePart => responsePart.part)
                .map(part => {
                part.submissionId = newSubmission._id;
                part.postStatus = 'UNPOSTED';
                part.postedTo = undefined;
                return part;
            })
                .filter(async (part) => {
                try {
                    if (part.isDefault) {
                        return true;
                    }
                    await this.accountService.get(part.accountId);
                    return true;
                }
                catch (e) {
                    return false;
                }
            })
                .map(part => new submission_part_entity_1.default(part));
            const defaultEntity = new submission_part_entity_1.default(defaultPart);
            defaultEntity.submissionId = newSubmission._id;
            await Promise.all([
                ...submissionParts.map(p => this.partService.createOrUpdateSubmissionPart(p, newSubmission.type)),
                this.partService.createOrUpdateSubmissionPart(defaultEntity, newSubmission.type),
            ]);
            if (submission.type === postybirb_commons_2.SubmissionType.FILE) {
                const fileSubmission = submission;
                if (fileSubmission.thumbnail) {
                    try {
                        const buffer = await fs_extra_1.default.readFile(fileSubmission.thumbnail.originalPath);
                        const { mimetype, name, originalPath } = fileSubmission.thumbnail;
                        await this.changeFileSubmissionThumbnailFile({
                            fieldname: 'file',
                            mimetype,
                            originalname: name,
                            encoding: '',
                            buffer,
                        }, newSubmission._id, originalPath);
                    }
                    catch (e) {
                    }
                }
                if (fileSubmission.additional && fileSubmission.additional.length) {
                    for (const additionalFile of fileSubmission.additional) {
                        try {
                            const buffer = await fs_extra_1.default.readFile(additionalFile.originalPath);
                            const { mimetype, name, originalPath } = additionalFile;
                            await this.addFileSubmissionAdditionalFile({
                                fieldname: 'file',
                                mimetype,
                                originalname: name,
                                encoding: '',
                                buffer,
                            }, newSubmission._id, originalPath);
                        }
                        catch (e) {
                        }
                    }
                }
            }
        }
        catch (err) {
            this.logger.error(err, 'Recreate Failure');
            await this.deleteSubmission(newSubmission);
            throw new common_1.InternalServerErrorException(err);
        }
        const s = await this.getAndValidate(newSubmission._id);
        this.eventEmitter.emit(postybirb_commons_1.Events.SubmissionEvent.UPDATED, [s]);
        return s.submission;
    }
    async splitAdditionalIntoSubmissions(id) {
        this.logger.log(id, 'Splitting Additional Files');
        const submission = (await this.get(id));
        if (!(submission.additional && submission.additional.length)) {
            throw new common_1.BadRequestException('Submission is not a File submission or does not have additional files');
        }
        const unsupportedAdditionalWebsites = this.websiteProvider
            .getAllWebsiteModules()
            .filter(w => !w.acceptsAdditionalFiles)
            .map(w => w.constructor.name);
        const parts = await this.partService.getPartsForSubmission(submission._id, true);
        const websitePartsThatNeedSplitting = parts
            .filter(p => !p.isDefault)
            .filter(p => unsupportedAdditionalWebsites.includes(p.website));
        if (!websitePartsThatNeedSplitting.length) {
            return;
        }
        websitePartsThatNeedSplitting.push(parts.find(p => p.isDefault));
        let order = submission.order;
        for (const additional of submission.additional) {
            order += 0.01;
            const copy = submission.copy();
            delete copy._id;
            let newSubmission = new file_submission_entity_1.default(copy);
            newSubmission.additional = [];
            newSubmission.primary = additional;
            newSubmission.order = order;
            try {
                newSubmission = await this.fileSubmissionService.duplicateSubmission(newSubmission);
                const createdSubmission = await this.repository.save(newSubmission);
                await Promise.all(websitePartsThatNeedSplitting.map(p => {
                    p.submissionId = newSubmission._id;
                    p.postStatus = 'UNPOSTED';
                    return this.partService.createOrUpdateSubmissionPart(p, newSubmission.type);
                }));
                this.eventEmitter
                    .emitOnComplete(postybirb_commons_1.Events.SubmissionEvent.CREATED, this.validate(createdSubmission))
                    .then(() => {
                    this.orderSubmissions(submission.type);
                });
            }
            catch (err) {
                this.logger.error(err, 'Additional Split Failure');
                await this.deleteSubmission(newSubmission);
                throw new common_1.InternalServerErrorException(err);
            }
        }
    }
    async duplicate(originalId) {
        this.logger.log(originalId, 'Duplicate Submission');
        const original = await this.get(originalId);
        original._id = undefined;
        let duplicate = new submission_entity_1.default(original);
        duplicate.order += 0.01;
        switch (duplicate.type) {
            case postybirb_commons_2.SubmissionType.FILE:
                duplicate = await this.fileSubmissionService.duplicateSubmission(duplicate);
                break;
            case postybirb_commons_2.SubmissionType.NOTIFICATION:
                break;
        }
        try {
            const createdSubmission = await this.repository.save(duplicate);
            const parts = await this.partService.getPartsForSubmission(originalId, true);
            await Promise.all(parts.map(p => {
                p.submissionId = duplicate._id;
                p.postStatus = 'UNPOSTED';
                return this.partService.createOrUpdateSubmissionPart(p, duplicate.type);
            }));
            this.eventEmitter
                .emitOnComplete(postybirb_commons_1.Events.SubmissionEvent.CREATED, this.validate(createdSubmission))
                .then(() => {
                this.orderSubmissions(duplicate.type);
            });
            return createdSubmission;
        }
        catch (err) {
            this.logger.error(err, 'Duplicate Failure');
            await this.deleteSubmission(duplicate._id);
            throw new common_1.InternalServerErrorException(err);
        }
    }
    async changeOrder(id, to, from) {
        const movingSubmission = await this.get(id);
        const submissions = (await this.getAll(movingSubmission.type)).sort((a, b) => a.order - b.order);
        const fromSubmission = submissions.find(s => s._id === id);
        fromSubmission.order = from < to ? to + 0.1 : to - 0.1;
        await Promise.all(submissions
            .sort((a, b) => a.order - b.order)
            .map((record, index) => {
            record.order = index;
            return this.repository.update(record);
        }));
        this.orderSubmissions(movingSubmission.type);
    }
    async orderSubmissions(type) {
        const submissions = await this.getAll(type);
        const ordered = submissions
            .sort((a, b) => a.order - b.order)
            .map((record, index) => {
            record.order = index;
            return record;
        });
        await Promise.all(ordered.map(record => this.repository.update(record)));
        const orderRecord = {};
        Object.values(ordered).forEach(submission => {
            orderRecord[submission._id] = submission.order;
        });
        this.eventEmitter.emit(postybirb_commons_1.Events.SubmissionEvent.REORDER, orderRecord);
    }
    async validate(submission) {
        submission = await this.get(submission);
        let hasProblems = false;
        const parts = await this.partService.getPartsForSubmission(submission._id, true);
        const problems = parts.length
            ? this.validatorService.validateParts(submission, parts)
            : {};
        for (const p of Object.values(problems)) {
            if (p.problems.length) {
                hasProblems = true;
                break;
            }
        }
        const mappedParts = {};
        parts.forEach(part => (mappedParts[part.accountId] = part.asPlain()));
        return {
            submission,
            parts: mappedParts,
            problems,
            hasProblems,
        };
    }
    async verifyAll() {
        this.eventEmitter.emitOnComplete(postybirb_commons_1.Events.SubmissionEvent.UPDATED, this.getAllAndValidate());
    }
    async dryValidate(id, parts) {
        if (parts.length) {
            return this.validatorService.validateParts(await this.get(id), parts);
        }
        return {};
    }
    async deleteSubmission(id, skipCancel) {
        const submission = await this.get(id);
        id = submission._id;
        this.logger.log(id, 'Delete Submission');
        if (!skipCancel) {
            this.postService.cancel(submission);
        }
        switch (submission.type) {
            case postybirb_commons_2.SubmissionType.FILE:
                await this.fileSubmissionService.cleanupSubmission(submission);
                break;
            case postybirb_commons_2.SubmissionType.NOTIFICATION:
                break;
        }
        await this.repository.remove(id);
        await this.partService.removeBySubmissionId(id);
        this.eventEmitter.emit(postybirb_commons_1.Events.SubmissionEvent.REMOVED, id);
    }
    async updateSubmission(update) {
        this.logger.log(update.id, 'Update Submission');
        const { id, parts, postAt, removedParts } = update;
        const submissionToUpdate = await this.get(id);
        if (submissionToUpdate.isPosting) {
            throw new common_1.BadRequestException('Cannot update a submission that is posting');
        }
        submissionToUpdate.schedule.postAt = postAt;
        if (!postAt) {
            submissionToUpdate.schedule.isScheduled = false;
        }
        if (submissionToUpdate.type === postybirb_commons_2.SubmissionType.FILE && update.altTexts) {
            const fileSubmission = submissionToUpdate;
            for (const fileRecord of [fileSubmission.primary, ...(fileSubmission.additional || [])]) {
                const altText = update.altTexts[fileRecord.location];
                if (altText !== undefined && altText != fileRecord.altText) {
                    fileRecord.altText = altText;
                }
            }
        }
        await this.repository.update(submissionToUpdate);
        await Promise.all(removedParts.map(partId => this.partService.removeSubmissionPart(partId)));
        await Promise.all(parts.map(p => this.setPart(submissionToUpdate, p)));
        const packaged = await this.validate(submissionToUpdate);
        this.eventEmitter.emit(postybirb_commons_1.Events.SubmissionEvent.UPDATED, [packaged]);
        return packaged;
    }
    async overwriteSubmissionParts(submissionOverwrite) {
        const submission = await this.get(submissionOverwrite.id);
        if (submission.isPosting) {
            throw new common_1.BadRequestException('Cannot update a submission that is posting');
        }
        const allParts = await this.partService.getPartsForSubmission(submission._id, false);
        const keepIds = submissionOverwrite.parts.map(p => p.accountId);
        const removeParts = allParts.filter(p => !keepIds.includes(p.accountId) && !p.isDefault);
        await Promise.all(submissionOverwrite.parts.map(part => this.setPart(submission, part)));
        await Promise.all(removeParts.map(p => this.partService.removeSubmissionPart(p._id)));
        const packaged = await this.validate(submission);
        this.eventEmitter.emit(postybirb_commons_1.Events.SubmissionEvent.UPDATED, [packaged]);
    }
    async scheduleSubmission(id, isScheduled, postAt) {
        this.logger.debug(`${id}: ${isScheduled}`, 'Schedule Submission');
        const submissionToSchedule = await this.getAndValidate(id);
        const submission = submissionToSchedule.submission;
        if (isScheduled && submissionToSchedule.hasProblems) {
            throw new common_1.BadRequestException('Cannot schedule an incomplete submission');
        }
        if (postAt) {
            submission.schedule.postAt = postAt;
        }
        if (isScheduled && !submission.schedule.postAt) {
            throw new common_1.BadRequestException('Submission cannot be scheduled because it does not have a postAt value');
        }
        submission.schedule.isScheduled = isScheduled;
        await this.repository.update(submission);
        this.eventEmitter.emitOnComplete(postybirb_commons_1.Events.SubmissionEvent.UPDATED, Promise.all([this.validate(submission)]));
    }
    async setPart(submission, submissionPart) {
        const existingPart = await this.partService.getSubmissionPart(submission._id, submissionPart.accountId);
        let part;
        if (existingPart) {
            part = new submission_part_entity_1.default(Object.assign(Object.assign({}, existingPart), { data: submissionPart.data, postedTo: undefined, postStatus: 'UNPOSTED' }));
        }
        else {
            part = new submission_part_entity_1.default({
                data: submissionPart.data,
                accountId: submissionPart.accountId,
                submissionId: submission._id,
                website: submissionPart.website,
                isDefault: submissionPart.isDefault,
                postedTo: submissionPart.postedTo,
                postStatus: submissionPart.postStatus,
            });
        }
        return await this.partService.createOrUpdateSubmissionPart(part, submission.type);
    }
    async setPostAt(id, postAt) {
        const submission = await this.get(id);
        this.logger.debug(`${submission._id}: ${new Date(postAt).toLocaleString()}`, 'Update Submission Post At');
        if (submission.isPosting) {
            throw new common_1.BadRequestException('Cannot update a submission that is posting');
        }
        submission.schedule.postAt = postAt;
        await this.repository.update(submission);
        this.eventEmitter.emitOnComplete(postybirb_commons_1.Events.SubmissionEvent.UPDATED, Promise.all([this.validate(submission)]));
    }
    async getFallbackText(id) {
        const submission = (await this.get(id));
        let text = '';
        if (submission.fallback) {
            try {
                const buf = await fs_extra_1.default.readFile(submission.fallback.location);
                text = buf.toString();
            }
            catch (err) {
            }
        }
        return text;
    }
    async setFallbackFile(file, id) {
        this.logger.debug(id, 'Change Submission Fallback File');
        const submission = (await this.get(id));
        if (submission.isPosting) {
            throw new common_1.BadRequestException('Cannot update a submission that is posting');
        }
        await this.fileSubmissionService.changeFallbackFile(submission, file);
        await this.repository.update(submission);
        const validated = await this.validate(submission);
        this.eventEmitter.emit(postybirb_commons_1.Events.SubmissionEvent.UPDATED, [validated]);
        return validated;
    }
    async removeFileSubmissionThumbnail(id) {
        this.logger.debug(id, 'Remove Submission Thumbnail');
        const submission = (await this.get(id));
        if (submission.isPosting) {
            throw new common_1.BadRequestException('Cannot update a submission that is posting');
        }
        await this.fileSubmissionService.removeThumbnail(submission);
        await this.repository.update(submission);
        const validated = await this.validate(submission);
        this.eventEmitter.emit(postybirb_commons_1.Events.SubmissionEvent.UPDATED, [validated]);
        return validated;
    }
    async removeFileSubmissionAdditionalFile(id, location) {
        this.logger.debug(location, 'Remove Submission Additional File');
        const submission = (await this.get(id));
        if (submission.isPosting) {
            throw new common_1.BadRequestException('Cannot update a submission that is posting');
        }
        await this.fileSubmissionService.removeAdditionalFile(submission, location);
        await this.repository.update(submission);
        const validated = await this.validate(submission);
        this.eventEmitter.emit(postybirb_commons_1.Events.SubmissionEvent.UPDATED, [validated]);
        return validated;
    }
    async changeFileSubmissionThumbnailFile(file, id, path) {
        this.logger.debug(path, 'Change Submission Thumbnail');
        const submission = (await this.get(id));
        if (submission.isPosting) {
            throw new common_1.BadRequestException('Cannot update a submission that is posting');
        }
        await this.fileSubmissionService.changeThumbnailFile(submission, file, path);
        await this.repository.update(submission);
        const validated = await this.validate(submission);
        this.eventEmitter.emit(postybirb_commons_1.Events.SubmissionEvent.UPDATED, [validated]);
        return validated;
    }
    async changeFileSubmissionPrimaryFile(file, id, path) {
        const submission = (await this.get(id));
        if (submission.isPosting) {
            throw new common_1.BadRequestException('Cannot update a submission that is posting');
        }
        await this.fileSubmissionService.changePrimaryFile(submission, file, path);
        if (submission.fallback && submission.primary.type !== postybirb_commons_3.FileSubmissionType.TEXT) {
            this.logger.log(id, 'Removing Fallback File');
            await this.fileSubmissionService.removeFallbackFile(submission);
        }
        await this.repository.update(submission);
        const validated = await this.validate(submission);
        this.eventEmitter.emit(postybirb_commons_1.Events.SubmissionEvent.UPDATED, [validated]);
        return validated;
    }
    async addFileSubmissionAdditionalFile(file, id, path) {
        this.logger.debug(path, 'Add Additional File');
        const submission = (await this.get(id));
        if (submission.isPosting) {
            throw new common_1.BadRequestException('Cannot update a submission that is posting');
        }
        await this.fileSubmissionService.addAdditionalFile(submission, file, path);
        await this.repository.update(submission);
        const validated = await this.validate(submission);
        this.eventEmitter.emit(postybirb_commons_1.Events.SubmissionEvent.UPDATED, [validated]);
        return validated;
    }
    async updateFileSubmissionAdditionalFile(id, record) {
        this.logger.debug(record, 'Updating Additional File');
        const submission = (await this.get(id));
        if (submission.isPosting) {
            throw new common_1.BadRequestException('Cannot update a submission that is posting');
        }
        if (submission.additional) {
            const recordToUpdate = submission.additional.find(r => r.location === record.location);
            if (recordToUpdate) {
                recordToUpdate.ignoredAccounts = record.ignoredAccounts || [];
                this.repository.update(submission);
                this.eventEmitter.emitOnComplete(postybirb_commons_1.Events.SubmissionEvent.UPDATED, Promise.all([this.validate(submission)]));
            }
        }
    }
};
__decorate([
    (0, schedule_1.Interval)(60000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubmissionService.prototype, "queueScheduledSubmissions", null);
__decorate([
    (0, schedule_1.Interval)(60000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SubmissionService.prototype, "checkForQueuedOrScheduled", null);
SubmissionService = SubmissionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(submission_repository_1.SubmissionRepositoryToken)),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => post_service_1.PostService))),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => account_service_1.AccountService))),
    __metadata("design:paramtypes", [Object, submission_part_service_1.SubmissionPartService,
        file_submission_service_1.FileSubmissionService,
        validator_service_1.ValidatorService,
        events_gateway_1.EventsGateway,
        post_service_1.PostService, Object, website_provider_service_1.WebsiteProvider])
], SubmissionService);
exports.SubmissionService = SubmissionService;
