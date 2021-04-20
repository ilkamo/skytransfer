import { genKeyPairAndSeed, genKeyPairFromSeed } from "skynet-js";
import { SESSION_KEY_NAME } from "../config";

export default class SessionManager {
    static get sessionPrivateKey(): string {
        const sessionKey = localStorage.getItem(SESSION_KEY_NAME);
        if (sessionKey) {
            return sessionKey;
        }

        const { privateKey } = genKeyPairAndSeed();
        localStorage.setItem(SESSION_KEY_NAME, privateKey);
        return privateKey;
    }

    static get sessionPublicKey(): string {
        return this.sessionPrivateKey.substr(this.sessionPrivateKey.length - 64);
    }

    static get sessionEncryptionKey(): string {
        return genKeyPairFromSeed(`${this.sessionPrivateKey}-aes-encrypt`).privateKey;
    }

    static destroySession() {
        localStorage.removeItem(SESSION_KEY_NAME);
    }

    static get readOnlyLink() {
        return `${window.location.hostname}/#/${this.sessionPublicKey}/${this.sessionEncryptionKey}`;
    };

    static get readWriteLink() {
        return `${window.location.hostname}/#/${this.sessionPrivateKey}/${this.sessionEncryptionKey}`;
    };
}