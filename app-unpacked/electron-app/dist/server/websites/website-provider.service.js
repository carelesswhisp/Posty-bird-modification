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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsiteProvider = void 0;
const common_1 = require("@nestjs/common");
const artconomy_service_1 = require("./artconomy/artconomy.service");
const weasyl_service_1 = require("./weasyl/weasyl.service");
const website_base_1 = require("./website.base");
const discord_service_1 = require("./discord/discord.service");
const piczel_service_1 = require("./piczel/piczel.service");
const derpibooru_service_1 = require("./derpibooru/derpibooru.service");
const ko_fi_service_1 = require("./ko-fi/ko-fi.service");
const inkbunny_service_1 = require("./inkbunny/inkbunny.service");
const so_furry_service_1 = require("./so-furry/so-furry.service");
const e621_service_1 = require("./e621/e621.service");
const fur_affinity_service_1 = require("./fur-affinity/fur-affinity.service");
const subscribe_star_service_1 = require("./subscribe-star/subscribe-star.service");
const hentai_foundry_service_1 = require("./hentai-foundry/hentai-foundry.service");
const aryion_service_1 = require("./aryion/aryion.service");
const custom_service_1 = require("./custom/custom.service");
const newgrounds_service_1 = require("./newgrounds/newgrounds.service");
const pixiv_service_1 = require("./pixiv/pixiv.service");
const furtastic_service_1 = require("./furtastic/furtastic.service");
const furry_network_service_1 = require("./furry-network/furry-network.service");
const patreon_service_1 = require("./patreon/patreon.service");
const tumblr_service_1 = require("./tumblr/tumblr.service");
const deviant_art_service_1 = require("./deviant-art/deviant-art.service");
const manebooru_service_1 = require("./manebooru/manebooru.service");
const mastodon_service_1 = require("./mastodon/mastodon.service");
const pillowfort_service_1 = require("./pillowfort/pillowfort.service");
const telegram_service_1 = require("./telegram/telegram.service");
const furbooru_service_1 = require("./furbooru/furbooru.service");
const itaku_service_1 = require("./itaku/itaku.service");
const picarto_service_1 = require("./picarto/picarto.service");
const subscribe_star_adult_service_1 = require("./subscribe-star-adult/subscribe-star-adult.service");
const pixelfed_service_1 = require("./pixelfed/pixelfed.service");
const misskey_service_1 = require("./misskey/misskey.service");
const bluesky_service_1 = require("./bluesky/bluesky.service");
const pleroma_service_1 = require("./pleroma/pleroma.service");
const twitter_service_1 = require("./twitter/twitter.service");
let WebsiteProvider = class WebsiteProvider {
    constructor(artconomy, bluesky, weasyl, discord, piczel, derpibooru, kofi, inkbunny, sofurry, e621, furaffinity, furtastic, subscribestar, subscribestarAdult, hentaiFoundry, aryion, custom, newgrounds, pixiv, furryNetwork, patreon, tumblr, deviantArt, manebooru, mastodon, misskey, pillowfort, telegram, furbooru, itaku, picarto, pixelfed, pleroma, twitter) {
        this.artconomy = artconomy;
        this.bluesky = bluesky;
        this.weasyl = weasyl;
        this.discord = discord;
        this.piczel = piczel;
        this.derpibooru = derpibooru;
        this.kofi = kofi;
        this.inkbunny = inkbunny;
        this.sofurry = sofurry;
        this.e621 = e621;
        this.furaffinity = furaffinity;
        this.furtastic = furtastic;
        this.subscribestar = subscribestar;
        this.subscribestarAdult = subscribestarAdult;
        this.hentaiFoundry = hentaiFoundry;
        this.aryion = aryion;
        this.custom = custom;
        this.newgrounds = newgrounds;
        this.pixiv = pixiv;
        this.furryNetwork = furryNetwork;
        this.patreon = patreon;
        this.tumblr = tumblr;
        this.deviantArt = deviantArt;
        this.manebooru = manebooru;
        this.mastodon = mastodon;
        this.misskey = misskey;
        this.pillowfort = pillowfort;
        this.telegram = telegram;
        this.furbooru = furbooru;
        this.itaku = itaku;
        this.picarto = picarto;
        this.pixelfed = pixelfed;
        this.pleroma = pleroma;
        this.twitter = twitter;
        this.websiteModules = [];
        this.websiteModulesMap = {};
        this.websiteModules = [...arguments].filter(arg => arg instanceof website_base_1.Website);
        this.websiteModules.forEach(website => (this.websiteModulesMap[website.constructor.name.toLowerCase()] = website));
    }
    getWebsiteModule(name) {
        const module = this.websiteModulesMap[name.toLocaleLowerCase()];
        if (!module) {
            throw new Error(`Could not find ${name} module`);
        }
        return module;
    }
    getAllWebsiteModules() {
        return this.websiteModules;
    }
    websiteModuleExists(name) {
        return !!this.websiteModulesMap[name.toLocaleLowerCase()];
    }
};
WebsiteProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [artconomy_service_1.Artconomy,
        bluesky_service_1.Bluesky,
        weasyl_service_1.Weasyl,
        discord_service_1.Discord,
        piczel_service_1.Piczel,
        derpibooru_service_1.Derpibooru,
        ko_fi_service_1.KoFi,
        inkbunny_service_1.Inkbunny,
        so_furry_service_1.SoFurry,
        e621_service_1.e621,
        fur_affinity_service_1.FurAffinity,
        furtastic_service_1.Furtastic,
        subscribe_star_service_1.SubscribeStar,
        subscribe_star_adult_service_1.SubscribeStarAdult,
        hentai_foundry_service_1.HentaiFoundry,
        aryion_service_1.Aryion,
        custom_service_1.Custom,
        newgrounds_service_1.Newgrounds,
        pixiv_service_1.Pixiv,
        furry_network_service_1.FurryNetwork,
        patreon_service_1.Patreon,
        tumblr_service_1.Tumblr,
        deviant_art_service_1.DeviantArt,
        manebooru_service_1.Manebooru,
        mastodon_service_1.Mastodon,
        misskey_service_1.MissKey,
        pillowfort_service_1.Pillowfort,
        telegram_service_1.Telegram,
        furbooru_service_1.Furbooru,
        itaku_service_1.Itaku,
        picarto_service_1.Picarto,
        pixelfed_service_1.Pixelfed,
        pleroma_service_1.Pleroma,
        twitter_service_1.Twitter])
], WebsiteProvider);
exports.WebsiteProvider = WebsiteProvider;
