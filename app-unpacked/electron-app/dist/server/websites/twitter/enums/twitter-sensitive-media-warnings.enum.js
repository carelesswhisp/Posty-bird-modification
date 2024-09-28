"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESensitiveMediaWarnings_Utils = exports.ESensitiveMediaWarnings = exports.ESubmissionRating = void 0;
var ESubmissionRating;
(function (ESubmissionRating) {
    ESubmissionRating["GENERAL"] = "general";
    ESubmissionRating["MATURE"] = "mature";
    ESubmissionRating["ADULT"] = "adult";
    ESubmissionRating["EXTREME"] = "extreme";
})(ESubmissionRating = exports.ESubmissionRating || (exports.ESubmissionRating = {}));
var ESubmissionRating_Utils;
(function (ESubmissionRating_Utils) {
    function fromStringValue(srVal) {
        const srIdx = Object.values(ESubmissionRating).indexOf(srVal);
        if (srIdx == -1)
            throw new RangeError(`Unknown submission rating: ${srVal}`);
        return ESubmissionRating[Object.keys(ESubmissionRating)[srIdx]];
    }
    ESubmissionRating_Utils.fromStringValue = fromStringValue;
})(ESubmissionRating_Utils || (ESubmissionRating_Utils = {}));
var ESensitiveMediaWarnings;
(function (ESensitiveMediaWarnings) {
    ESensitiveMediaWarnings["OTHER"] = "other";
    ESensitiveMediaWarnings["GRAPHIC_VIOLENCE"] = "graphic_violence";
    ESensitiveMediaWarnings["ADULT_CONTENT"] = "adult_content";
})(ESensitiveMediaWarnings = exports.ESensitiveMediaWarnings || (exports.ESensitiveMediaWarnings = {}));
var ESensitiveMediaWarnings_Utils;
(function (ESensitiveMediaWarnings_Utils) {
    function getSMWFromContentBlur(contentBlur) {
        switch (contentBlur) {
            case 'other':
                return ESensitiveMediaWarnings.OTHER;
            case 'adult_content':
                return ESensitiveMediaWarnings.ADULT_CONTENT;
            case 'graphic_violence':
                return ESensitiveMediaWarnings.GRAPHIC_VIOLENCE;
            default:
                return undefined;
        }
    }
    ESensitiveMediaWarnings_Utils.getSMWFromContentBlur = getSMWFromContentBlur;
})(ESensitiveMediaWarnings_Utils = exports.ESensitiveMediaWarnings_Utils || (exports.ESensitiveMediaWarnings_Utils = {}));
