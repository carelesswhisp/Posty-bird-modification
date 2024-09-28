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
var AccountService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const common_1 = require("@nestjs/common");
const electron_1 = require("electron");
const lodash_1 = __importDefault(require("lodash"));
const events_gateway_1 = require("../events/events.gateway");
const submission_part_service_1 = require("../submission/submission-part/submission-part.service");
const submission_template_service_1 = require("../submission/submission-template/submission-template.service");
const submission_service_1 = require("../submission/submission.service");
const login_response_interface_1 = require("../websites/interfaces/login-response.interface");
const website_provider_service_1 = require("../websites/website-provider.service");
const account_repository_1 = require("./account.repository");
const postybirb_commons_1 = require("postybirb-commons");
let AccountService = AccountService_1 = class AccountService {
    constructor(repository, eventEmitter, websiteProvider, submissionPartService, submissionService, submissionTemplateService) {
        this.repository = repository;
        this.eventEmitter = eventEmitter;
        this.websiteProvider = websiteProvider;
        this.submissionPartService = submissionPartService;
        this.submissionService = submissionService;
        this.submissionTemplateService = submissionTemplateService;
        this.logger = new common_1.Logger(AccountService_1.name);
        this.loginStatuses = [];
        this.loginCheckTimers = [];
        this.loginCheckMap = [];
        this.repository
            .find()
            .then(results => {
            const removedModules = results.filter(result => !websiteProvider.websiteModuleExists(result.website));
            removedModules.forEach(remove => this.removeAccount(remove._id));
            return results.filter(result => websiteProvider.websiteModuleExists(result.website));
        })
            .then(results => {
            results.forEach(result => {
                this.loginStatuses.push({
                    _id: result._id,
                    alias: result.alias,
                    website: result.website,
                    loggedIn: false,
                    username: null,
                    data: {},
                });
            });
        })
            .finally(() => {
            Promise.all(this.loginStatuses.map(s => this.checkLogin(s._id))).finally(() => this.submissionService.postingStateChanged());
        });
        this.websiteProvider.getAllWebsiteModules().forEach(website => {
            const { refreshInterval } = website;
            if (!this.loginCheckTimers[refreshInterval]) {
                this.loginCheckTimers[refreshInterval] = setInterval(async () => {
                    const accountsToRefresh = await this.repository.find({
                        website: { $in: this.loginCheckMap[refreshInterval] },
                    });
                    accountsToRefresh.forEach(account => this.checkLogin(account));
                }, refreshInterval);
            }
            this.loginCheckMap[refreshInterval] = this.loginCheckMap[refreshInterval] || [];
            this.loginCheckMap[refreshInterval].push(website.constructor.name);
        });
    }
    async clearCookiesAndData(id) {
        this.logger.log(id, 'Clearing Account Data');
        const ses = electron_1.session.fromPartition(`persist:${id}`);
        const cookies = await ses.cookies.get({});
        if (cookies.length) {
            await ses.clearStorageData();
        }
        const data = await this.get(id);
        if (data && data.data && Object.keys(data.data)) {
            await this.setData(id, {});
        }
        this.checkLogin(id);
    }
    async createAccount(createAccount) {
        this.logger.log(createAccount, 'Create Account');
        const existing = await this.repository.findOne(createAccount._id);
        if (existing) {
            throw new common_1.BadRequestException(`Account with Id ${createAccount._id} already exists.`);
        }
        const account = await this.repository.save(createAccount);
        this.loginStatuses.push({
            _id: account._id,
            alias: account.alias,
            website: account.website,
            loggedIn: false,
            username: null,
            data: {},
        });
        this.eventEmitter.emit(postybirb_commons_1.Events.AccountEvent.CREATED, createAccount._id);
        this.eventEmitter.emit(postybirb_commons_1.Events.AccountEvent.STATUS_UPDATED, this.loginStatuses);
    }
    async get(id) {
        const account = await this.repository.findOne(id);
        if (!account) {
            throw new common_1.NotFoundException(`Account ${id} does not exist.`);
        }
        return account;
    }
    getAll() {
        return this.repository.find();
    }
    getLoginStatuses() {
        return [...this.loginStatuses];
    }
    async removeAccount(id) {
        this.logger.log(id, 'Delete Account');
        await this.repository.remove(id);
        const index = this.loginStatuses.findIndex(s => s._id === id);
        if (index !== -1) {
            this.loginStatuses.splice(index, 1);
        }
        this.eventEmitter.emit(postybirb_commons_1.Events.AccountEvent.DELETED, id);
        this.eventEmitter.emit(postybirb_commons_1.Events.AccountEvent.STATUS_UPDATED, this.loginStatuses);
        electron_1.session
            .fromPartition(`persist:${id}`)
            .clearStorageData()
            .then(() => this.logger.debug(`Session data for ${id} cleared`, 'Account'));
        await Promise.all([
            this.submissionPartService.removeAllSubmissionPartsForAccount(id),
            this.submissionTemplateService.removePartsForAccount(id),
        ]);
        this.submissionService.verifyAll();
    }
    async renameAccount(id, alias) {
        const account = await this.get(id);
        if (!alias) {
            throw new common_1.BadRequestException('No new alias provided');
        }
        account.alias = alias;
        await this.repository.update(account);
        this.loginStatuses.find(status => status._id === id).alias = alias;
        this.eventEmitter.emit(postybirb_commons_1.Events.AccountEvent.STATUS_UPDATED, this.getLoginStatuses());
    }
    async checkLogin(userAccount) {
        const account = typeof userAccount === 'string' ? await this.repository.findOne(userAccount) : userAccount;
        if (!account) {
            throw new common_1.NotFoundException(`Account ID ${userAccount} does not exist.`);
        }
        this.logger.debug(account._id, 'Login Check');
        const website = this.websiteProvider.getWebsiteModule(account.website);
        let response = { loggedIn: false, username: null };
        try {
            response = await website.checkLoginStatus(account);
        }
        catch (err) {
            this.logger.error(err, err.stack, `${account.website} Login Check Failure`);
        }
        const login = {
            _id: account._id,
            website: account.website,
            alias: account.alias,
            loggedIn: response.loggedIn,
            username: response.username,
            data: website.transformAccountData(account.data),
        };
        if (response.data && !lodash_1.default.isEqual(response.data, account.data)) {
            await this.setData(account._id, response.data);
        }
        this.insertOrUpdateLoginStatus(login);
        return login;
    }
    async setData(id, data) {
        this.logger.debug(id, 'Update Account Data');
        const entity = await this.get(id);
        entity.data = data;
        await this.repository.update(entity);
    }
    async insertOrUpdateLoginStatus(login) {
        const index = this.loginStatuses.findIndex(s => s._id === login._id);
        this.loginStatuses[index] = login;
        this.eventEmitter.emit(postybirb_commons_1.Events.AccountEvent.STATUS_UPDATED, this.getLoginStatuses());
    }
};
AccountService = AccountService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(account_repository_1.AccountRepositoryToken)),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => submission_service_1.SubmissionService))),
    __metadata("design:paramtypes", [Object, events_gateway_1.EventsGateway,
        website_provider_service_1.WebsiteProvider,
        submission_part_service_1.SubmissionPartService,
        submission_service_1.SubmissionService,
        submission_template_service_1.SubmissionTemplateService])
], AccountService);
exports.AccountService = AccountService;
