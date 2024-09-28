"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GifManipulator = void 0;
const Jimp = require('jimp');
class GifManipulator {
    static async getFrame(fileBuffer) {
        const gif = await Jimp.read(fileBuffer);
        return await gif.getBufferAsync(Jimp.MIME_PNG);
    }
}
exports.GifManipulator = GifManipulator;
