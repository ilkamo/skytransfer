import { genKeyPairAndSeed } from 'skynet-js';
import { SESSION_KEY_NAME } from '../config';
import { deriveEncryptionKeyFromKey } from '../crypto/crypto';

export default class SessionManager {
  static get sessionPrivateKey(): string {
    let sessionKey = localStorage.getItem(SESSION_KEY_NAME);
    if (!sessionKey) {
      sessionKey = genKeyPairAndSeed().privateKey;
      localStorage.setItem(SESSION_KEY_NAME, sessionKey);
    }

    return sessionKey;
  }

  static get sessionPublicKey(): string {
    return this.sessionPrivateKey.substr(this.sessionPrivateKey.length - 64);
  }

  static destroySession() {
    localStorage.removeItem(SESSION_KEY_NAME);
  }

  static isReadOnlyFromLink() {
    return (
      window.location.hash.split('/').length === 3 &&
      window.location.hash.split('/')[1].length === 64
    );
  }

  static get readOnlyLink() {
    if (this.isReadOnlyFromLink()) {
      return `https://${window.location.hostname}/${window.location.hash}`;
    }
    return `https://${window.location.hostname}/#/${
      this.sessionPublicKey
    }/${deriveEncryptionKeyFromKey(this.sessionPrivateKey)}`;
  }

  static get readWriteLink() {
    return `https://${window.location.hostname}/#/${
      this.sessionPrivateKey
    }/${deriveEncryptionKeyFromKey(this.sessionPrivateKey)}`;
  }

  static getReadWriteLinkForURL(baseURL: string) {
    return `${baseURL}/#/${this.sessionPrivateKey}/${deriveEncryptionKeyFromKey(
      this.sessionPrivateKey
    )}`;
  }

  static canResume() {
    return localStorage.getItem(SESSION_KEY_NAME) !== null;
  }
}
