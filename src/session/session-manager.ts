import { genKeyPairAndSeed } from "skynet-js";
import { SESSION_KEY_NAME, SESSION_UUID_KEY_NAME } from "../config";
import { deriveEncryptionKeyFromKey } from "../crypto/crypto";

export default class SessionManager {
    static get sessionPrivateKey(): string {
        let sessionKey = localStorage.getItem(SESSION_KEY_NAME);
        if (!sessionKey) {
            sessionKey = genKeyPairAndSeed().privateKey
            localStorage.setItem(SESSION_KEY_NAME, sessionKey);
        }

        return sessionKey;
    }

    static get sessionPublicKey(): string {
        return this.sessionPrivateKey.substr(this.sessionPrivateKey.length - 64);
    }

    static destroySession() {
        localStorage.removeItem(SESSION_KEY_NAME);
        localStorage.removeItem(SESSION_UUID_KEY_NAME);
    }

    static get readOnlyLink() {
        return `${window.location.hostname}/#/${this.sessionPublicKey}/${deriveEncryptionKeyFromKey(this.sessionPrivateKey)}`;
    };

    static get readWriteLink() {
        return `${window.location.hostname}/#/${this.sessionPrivateKey}/${deriveEncryptionKeyFromKey(this.sessionPrivateKey)}`;
    };
}