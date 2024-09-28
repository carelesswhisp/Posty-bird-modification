"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSL = void 0;
const node_forge_1 = __importDefault(require("node-forge"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
node_forge_1.default.options.usePureJavaScript = true;
class SSL {
    static getOrCreate() {
        if (fs_extra_1.default.existsSync(path_1.default.join(electron_1.app.getPath('userData'), 'data', 'cert.pem'))) {
            return {
                key: fs_extra_1.default.readFileSync(path_1.default.join(electron_1.app.getPath('userData'), 'data', 'key.pem')),
                cert: fs_extra_1.default.readFileSync(path_1.default.join(electron_1.app.getPath('userData'), 'data', 'cert.pem')),
            };
        }
        const pki = node_forge_1.default.pki;
        const keys = pki.rsa.generateKeyPair(2048);
        const cert = pki.createCertificate();
        cert.publicKey = keys.publicKey;
        cert.serialNumber = '01';
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 99);
        const attrs = [
            { name: 'commonName', value: 'postybirb.com' },
            { name: 'countryName', value: 'US' },
            { shortName: 'ST', value: 'Virginia' },
            { name: 'localityName', value: 'Fairfax' },
            { name: 'organizationName', value: 'PostyBirb' },
            { shortName: 'OU', value: 'PostyBirb' },
        ];
        cert.setSubject(attrs);
        cert.setIssuer(attrs);
        cert.sign(keys.privateKey);
        const pem_privateKey = node_forge_1.default.pki.privateKeyToPem(keys.privateKey);
        const pem_cert = pki.certificateToPem(cert);
        fs_extra_1.default.writeFile(path_1.default.join(electron_1.app.getPath('userData'), 'data', 'cert.pem'), pem_cert);
        fs_extra_1.default.writeFile(path_1.default.join(electron_1.app.getPath('userData'), 'data', 'key.pem'), pem_privateKey);
        return { cert: pem_cert, key: pem_privateKey };
    }
}
exports.SSL = SSL;
