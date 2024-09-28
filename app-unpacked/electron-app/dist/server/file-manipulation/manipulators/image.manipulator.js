"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jimp_1 = __importDefault(require("jimp"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const shortid_1 = __importDefault(require("shortid"));
const child_process_1 = __importDefault(require("child_process"));
const image_decode_1 = __importDefault(require("image-decode"));
const directories_1 = require("../../directories");
class ImageManipulator {
    constructor(buffer, type, deferredObj) {
        this.buffer = buffer;
        this.type = type;
        this.originalType = type;
        this.quality = 100;
        this.convertOnAlpha = false;
        this.deferredLocation = deferredObj;
        this.propertiesPopulated = false;
    }
    get isDeferred() {
        return !!this.deferredLocation;
    }
    static async build(data, type) {
        let deferredObj = null;
        if (data.length > ImageManipulator.DEFERRED_LIMIT) {
            deferredObj = `${directories_1.TEMP_FILE_DIRECTORY}/${shortid_1.default.generate()}.tmp`;
            await fs_extra_1.default.writeFile(deferredObj, data);
        }
        return new ImageManipulator(data, type, deferredObj);
    }
    static isMimeType(mimeType) {
        return (mimeType === 'image/png' ||
            mimeType === 'image/jpeg' ||
            mimeType === 'image/tiff' ||
            mimeType === 'image/bmp');
    }
    static getExtension(mimeType) {
        switch (mimeType) {
            case 'image/jpeg':
                return 'jpg';
            case 'image/png':
                return 'png';
            case 'image/bmp':
                return 'bmp';
            case 'image/tiff':
                return 'tiff';
        }
    }
    setConvertOnAlpha(convertOnAlpha) {
        this.convertOnAlpha = convertOnAlpha;
        return this;
    }
    setQuality(quality) {
        this.quality = Math.min(100, Math.max(quality, 1));
        return this;
    }
    setMimeType(type) {
        this.type = type;
        return this;
    }
    scale(scalePercent) {
        this.scalePercent = scalePercent;
        return this;
    }
    resize(scalePx) {
        this.resizePx = Math.floor(Math.max(1, scalePx));
        return this;
    }
    toJPEG(quality) {
        this.setMimeType('image/jpeg');
        if (quality) {
            this.setQuality(quality);
        }
        return this;
    }
    toPNG() {
        return this.setMimeType('image/png');
    }
    async getData() {
        if (!this.hasChanges()) {
            return { buffer: this.buffer, type: this.originalType };
        }
        if (this.isDeferred) {
            await this.fork();
            return await this.getBufferFromDeferred();
        }
        else {
            if (!this.img) {
                this.img = await jimp_1.default.read(this.buffer);
            }
            const clone = this.img.clone();
            clone.quality(this.quality);
            const ar = clone.bitmap.width / clone.bitmap.height;
            if (ar >= 1) {
                if (this.resizePx < clone.bitmap.width) {
                    clone.resize(this.resizePx, jimp_1.default.AUTO);
                }
            }
            else {
                if (this.resizePx < clone.bitmap.height) {
                    clone.resize(jimp_1.default.AUTO, this.resizePx);
                }
            }
            if (this.scalePercent) {
                clone.scale(this.scalePercent);
            }
            let newType = this.type;
            if (this.convertOnAlpha && !clone.hasAlpha()) {
                newType = jimp_1.default.MIME_JPEG;
            }
            return { buffer: await clone.getBufferAsync(newType), type: newType };
        }
    }
    getDeferredLocation() {
        return this.deferredLocation;
    }
    getMimeType() {
        return this.type;
    }
    getQuality() {
        return this.quality;
    }
    getScale() {
        return this.scalePercent;
    }
    getWidth() {
        if (!this.propertiesPopulated) {
            this.fillImageProperties();
        }
        return this.imageWidth;
    }
    getHeight() {
        if (!this.propertiesPopulated) {
            this.fillImageProperties();
        }
        return this.imageHeight;
    }
    hasTransparency() {
        if (this.type === 'image/jpeg') {
            return false;
        }
        if (!this.propertiesPopulated) {
            this.fillImageProperties();
        }
        return this.alpha;
    }
    destroy() {
        if (this.deferredLocation) {
            fs_extra_1.default.remove(this.deferredLocation);
        }
        if (this.process) {
            const index = global.CHILD_PROCESS_IDS.indexOf(this.process.pid);
            if (index !== -1) {
                global.CHILD_PROCESS_IDS.splice(index, 1);
            }
            process.kill(this.process.pid);
        }
        if (this.onDestroyFn) {
            this.onDestroyFn(this);
        }
    }
    onDestroy(fn) {
        this.onDestroyFn = fn;
        return this;
    }
    hasChanges() {
        if (this.quality !== 100) {
            return true;
        }
        if (this.type !== this.originalType) {
            return true;
        }
        if (this.resizePx) {
            return true;
        }
        if (this.convertOnAlpha && this.originalType !== 'image/jpeg') {
            return true;
        }
        if (this.scalePercent && this.scalePercent !== 1) {
            return true;
        }
        return false;
    }
    getBufferFromDeferred() {
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            this.process.send({
                convertOnAlpha: this.convertOnAlpha,
                location: this.deferredLocation,
                originalType: this.originalType,
                quality: this.quality,
                type: this.type,
                resizePx: this.resizePx,
                scalePercent: this.scalePercent,
            });
        }).then(async ({ location, type }) => {
            let buffer = this.buffer;
            if (location) {
                buffer = await fs_extra_1.default.readFile(location);
                fs_extra_1.default.remove(location);
            }
            return {
                buffer,
                type: type || this.originalType,
            };
        });
    }
    fillImageProperties() {
        const { data, width, height } = (0, image_decode_1.default)(this.buffer, this.originalType);
        this.alpha = false;
        this.imageHeight = height;
        this.imageWidth = width;
        const rgbaCount = data.length / 4;
        for (let i = 0; i < rgbaCount; i++) {
            const a = data[i * 4 + 3];
            if (!a) {
                this.alpha = true;
                break;
            }
        }
    }
    async fork() {
        if (!this.process) {
            this.process = child_process_1.default.fork(__dirname + '/image.manipulator.worker');
            global.CHILD_PROCESS_IDS.push(process.pid);
            this.process.on('message', (msg) => {
                if (this.resolve) {
                    msg.success ? this.resolve(msg.data) : this.reject(msg);
                    this.resolve = null;
                    this.reject = null;
                }
            });
            this.process.on('error', err => {
                console.log('Worker thread error', err);
                if (this.reject) {
                    this.reject(err);
                }
            });
            this.process.on('exit', code => {
                if (this.reject) {
                    this.reject(code);
                    this.destroy();
                }
            });
        }
    }
}
exports.default = ImageManipulator;
ImageManipulator.DEFERRED_LIMIT = 1048576;
