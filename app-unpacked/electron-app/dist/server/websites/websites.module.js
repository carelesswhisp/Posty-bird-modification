"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsitesModule = void 0;
const common_1 = require("@nestjs/common");
const website_provider_service_1 = require("./website-provider.service");
const websites_service_1 = require("./websites.service");
const artconomy_module_1 = require("./artconomy/artconomy.module");
const piczel_module_1 = require("./piczel/piczel.module");
const weasyl_module_1 = require("./weasyl/weasyl.module");
const discord_module_1 = require("./discord/discord.module");
const websites_controller_1 = require("./websites.controller");
const derpibooru_module_1 = require("./derpibooru/derpibooru.module");
const ko_fi_module_1 = require("./ko-fi/ko-fi.module");
const inkbunny_module_1 = require("./inkbunny/inkbunny.module");
const so_furry_module_1 = require("./so-furry/so-furry.module");
const e621_module_1 = require("./e621/e621.module");
const fur_affinity_module_1 = require("./fur-affinity/fur-affinity.module");
const furtastic_module_1 = require("./furtastic/furtastic.module");
const subscribe_star_module_1 = require("./subscribe-star/subscribe-star.module");
const hentai_foundry_module_1 = require("./hentai-foundry/hentai-foundry.module");
const aryion_module_1 = require("./aryion/aryion.module");
const custom_module_1 = require("./custom/custom.module");
const newgrounds_module_1 = require("./newgrounds/newgrounds.module");
const pixiv_module_1 = require("./pixiv/pixiv.module");
const furry_network_module_1 = require("./furry-network/furry-network.module");
const patreon_module_1 = require("./patreon/patreon.module");
const tumblr_module_1 = require("./tumblr/tumblr.module");
const deviant_art_module_1 = require("./deviant-art/deviant-art.module");
const manebooru_module_1 = require("./manebooru/manebooru.module");
const mastodon_module_1 = require("./mastodon/mastodon.module");
const misskey_module_1 = require("./misskey/misskey.module");
const pleroma_module_1 = require("./pleroma/pleroma.module");
const pillowfort_module_1 = require("./pillowfort/pillowfort.module");
const telegram_module_1 = require("./telegram/telegram.module");
const furbooru_module_1 = require("./furbooru/furbooru.module");
const itaku_module_1 = require("./itaku/itaku.module");
const picarto_module_1 = require("./picarto/picarto.module");
const pixelfed_module_1 = require("./pixelfed/pixelfed.module");
const subscribe_star_adult_module_1 = require("./subscribe-star-adult/subscribe-star-adult.module");
const bluesky_module_1 = require("./bluesky/bluesky.module");
const twitter_module_1 = require("./twitter/twitter.module");
let WebsitesModule = class WebsitesModule {
};
WebsitesModule = __decorate([
    (0, common_1.Module)({
        controllers: [websites_controller_1.WebsitesController],
        providers: [website_provider_service_1.WebsiteProvider, websites_service_1.WebsitesService],
        exports: [website_provider_service_1.WebsiteProvider, websites_service_1.WebsitesService],
        imports: [
            artconomy_module_1.ArtconomyModule,
            aryion_module_1.AryionModule,
            bluesky_module_1.BlueskyModule,
            custom_module_1.CustomModule,
            derpibooru_module_1.DerpibooruModule,
            deviant_art_module_1.DeviantArtModule,
            discord_module_1.DiscordModule,
            e621_module_1.E621Module,
            fur_affinity_module_1.FurAffinityModule,
            furtastic_module_1.FurtasticModule,
            furbooru_module_1.FurbooruModule,
            furry_network_module_1.FurryNetworkModule,
            hentai_foundry_module_1.HentaiFoundryModule,
            inkbunny_module_1.InkbunnyModule,
            ko_fi_module_1.KoFiModule,
            manebooru_module_1.ManebooruModule,
            mastodon_module_1.MastodonModule,
            misskey_module_1.MissKeyModule,
            pleroma_module_1.PleromaModule,
            newgrounds_module_1.NewgroundsModule,
            patreon_module_1.PatreonModule,
            piczel_module_1.PiczelModule,
            pillowfort_module_1.PillowfortModule,
            pixiv_module_1.PixivModule,
            so_furry_module_1.SoFurryModule,
            subscribe_star_module_1.SubscribeStarModule,
            subscribe_star_adult_module_1.SubscribeStarAdultModule,
            telegram_module_1.TelegramModule,
            tumblr_module_1.TumblrModule,
            weasyl_module_1.WeasylModule,
            itaku_module_1.ItakuModule,
            picarto_module_1.PicartoModule,
            pixelfed_module_1.PixelfedModule,
            twitter_module_1.TwitterModule,
        ],
    })
], WebsitesModule);
exports.WebsitesModule = WebsitesModule;
