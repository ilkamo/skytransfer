import { FileEncrypted } from './../models/encryption';
import { SkynetClient, genKeyPairFromSeed } from "skynet-js";
import CryptoJS from "crypto-js";

const skynetClient = new SkynetClient("https://ilkamo.hns.siasky.net");

const ENCRYPTED_FILES_SKYDB_KEY_NAME = "ENCRYPTED_FILES";

class FileUtils {

  public generateEncryptionKey(sessionPrivateKey: string): string {
    return genKeyPairFromSeed(`${sessionPrivateKey}-aes-encrypt`).privateKey;
  }

  public async encryptFile(encryptionKey: string, file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async function (e) {
        const data = e.target.result;

        const wordArray = CryptoJS.lib.WordArray.create(data);
        const encrypted = CryptoJS.AES.encrypt(wordArray, encryptionKey).toString();

        const fileEnc = new Blob([encrypted], { type: file.type });

        return resolve(new File([fileEnc], file.name, { type: file.type }));
      };

      reader.onerror = reject

      reader.readAsArrayBuffer(file);
    });
  }

  public async decryptFile(encryptionKey: string, encryptedFile: FileEncrypted): Promise<File> {
    const { data } = await skynetClient.getFileContent(encryptedFile.skylink);
    return this.decrypt(encryptionKey, data, encryptedFile);
  }

  public decrypt(encryptionKey: string, encryptedData: Blob, encryptedFile: FileEncrypted): File {
    var decrypted = CryptoJS.AES.decrypt(encryptedData, encryptionKey);
    var typedArray = this.convertWordArrayToUint8Array(decrypted);

    return new File([typedArray], encryptedFile.fileName, { type: encryptedFile.mimeType });
  }

  private convertWordArrayToUint8Array(wordArray) {
    const arrayOfWords = wordArray.hasOwnProperty("words") ? wordArray.words : [];
    const length = wordArray.hasOwnProperty("sigBytes") ? wordArray.sigBytes : arrayOfWords.length * 4;
    let uInt8Array = new Uint8Array(length), index = 0, word, i;
    for (i = 0; i < length; i++) {
      word = arrayOfWords[i];
      uInt8Array[index++] = word >> 24;
      uInt8Array[index++] = (word >> 16) & 0xff;
      uInt8Array[index++] = (word >> 8) & 0xff;
      uInt8Array[index++] = word & 0xff;
    }
    return uInt8Array;
  }

  public async storeSessionEncryptedFiles(sessionPrivateKey: string, encryptedFiles: FileEncrypted[]): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (encryptedFiles.length === 0) {
        return resolve(false);
      }

      try {
        await skynetClient.db.setJSON(
          sessionPrivateKey,
          ENCRYPTED_FILES_SKYDB_KEY_NAME,
          encryptedFiles,
          undefined,
          {
            timeout: 5,
          },
        );
        return resolve(true);
      } catch (error) {
        return reject(error);
      }
    });
  }

  public async getSessionEncryptedFiles(sessionPublicKey: string): Promise<FileEncrypted[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const { data } = await skynetClient.db.getJSON(
          sessionPublicKey,
          ENCRYPTED_FILES_SKYDB_KEY_NAME,
          {
            timeout: 5,
          },
        );
        return resolve(data);
      } catch (error) {
        return reject(error);
      }
    });
  }

  publicKeyFromPrivateKey(privateKey: string): string {
    return privateKey.substr(privateKey.length - 64);
  }

  public fileSize(size: number): string {
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
}

export default FileUtils;