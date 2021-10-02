import { genKeyPairAndSeed } from 'skynet-js';
import { BUCKET_ENCRYPTION_KEY_NAME, BUCKET_PRIVATE_KEY_NAME } from '../config';
import { publicKeyFromPrivateKey } from '../crypto/crypto';

export interface ISessionManagerKeys {
  bucketPrivateKey: string;
  bucketEncryptionKey: string;
}

export default class SessionManager {
  static get sessionKeys(): ISessionManagerKeys {
    let bucketPrivateKey = localStorage.getItem(BUCKET_PRIVATE_KEY_NAME);
    let bucketEncryptionKey = localStorage.getItem(BUCKET_ENCRYPTION_KEY_NAME);

    if (!bucketPrivateKey || !bucketEncryptionKey) {
      bucketPrivateKey = genKeyPairAndSeed().privateKey;
      localStorage.setItem(BUCKET_PRIVATE_KEY_NAME, bucketPrivateKey);

      bucketEncryptionKey = genKeyPairAndSeed().privateKey;
      localStorage.setItem(BUCKET_ENCRYPTION_KEY_NAME, bucketEncryptionKey);
    }

    return {
      bucketPrivateKey,
      bucketEncryptionKey,
    };
  }

  static setSessionKeys(sessionKeys: ISessionManagerKeys) {
    localStorage.setItem(BUCKET_PRIVATE_KEY_NAME, sessionKeys.bucketPrivateKey);
    localStorage.setItem(
      BUCKET_ENCRYPTION_KEY_NAME,
      sessionKeys.bucketEncryptionKey
    );
  }

  static destroySession() {
    localStorage.removeItem(BUCKET_PRIVATE_KEY_NAME);
  }

  static isReadOnlyFromLink() {
    return (
      window.location.hash.split('/').length === 3 &&
      window.location.hash.split('/')[1].length === 64
    );
  }

  static get readOnlyLink() {
    const { bucketPrivateKey, bucketEncryptionKey } = this.sessionKeys;

    if (this.isReadOnlyFromLink()) {
      return `https://${window.location.hostname}/${window.location.hash}`;
    }
    return `https://${window.location.hostname}/#/${publicKeyFromPrivateKey(
      bucketPrivateKey
    )}/${bucketEncryptionKey}`;
  }

  static get readWriteLink() {
    const { bucketPrivateKey, bucketEncryptionKey } = this.sessionKeys;

    return `https://${window.location.hostname}/#/${bucketPrivateKey}/${bucketEncryptionKey}`;
  }

  static canResume() {
    return localStorage.getItem(BUCKET_PRIVATE_KEY_NAME) !== null;
  }
}
