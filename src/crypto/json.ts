import CryptoJS from 'crypto-js';

export class JsonCrypto {
  readonly encryptionKey: string;

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  public encrypt(json: any): string {
    return CryptoJS.AES.encrypt(
      JSON.stringify(json),
      this.encryptionKey
    ).toString();
  }

  public decrypt(encryptedJson: string): any {
    const decryptedMemories = CryptoJS.AES.decrypt(
      encryptedJson,
      this.encryptionKey
    ).toString(CryptoJS.enc.Utf8);

    return JSON.parse(decryptedMemories);
  }
}
