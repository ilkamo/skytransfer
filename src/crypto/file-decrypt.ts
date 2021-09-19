import { SkynetClient } from 'skynet-js';
import CryptoJS from 'crypto-js';
import { EncryptionType } from '../models/encryption';
import { FileDecrypt } from './crypto';
import { getEndpointInCurrentPortal } from '../portals';
import { ChunkResolver } from './chunk-resolver';
import { downloadFile } from '../skynet/skynet';
import { EncryptedFile } from '../models/files/encrypted-file';

export default class AESFileDecrypt implements FileDecrypt {
  private encryptedFile: EncryptedFile;
  private encryptionKey: string;
  private chunkResolver: ChunkResolver;

  skynetClient = new SkynetClient(getEndpointInCurrentPortal());

  parts: BlobPart[] = [];

  constructor(encryptedFile: EncryptedFile) {
    this.encryptedFile = encryptedFile;
    this.encryptionKey = encryptedFile.file.key;
    this.chunkResolver = new ChunkResolver(EncryptionType[encryptedFile.file.encryptionType as keyof typeof EncryptionType]);
  }

  get decryptChunkSize(): number {
    return this.chunkResolver.decryptChunkSize;
  }

  async decrypt(
    onDecryptProgress: (
      completed: boolean,
      percentage: number
    ) => void = () => {},
    onFileDownloadProgress: (
      completed: boolean,
      percentage: number
    ) => void = () => {}
  ): Promise<File> {
    const totalChunks = Math.ceil(
      this.encryptedFile.file.encryptedSize / this.decryptChunkSize
    );

    let rangeStart,
      rangeEnd = 0;

    for (let i = 0; i < totalChunks; i++) {
      rangeStart = i * this.decryptChunkSize;

      if (i === totalChunks - 1) {
        rangeEnd = this.encryptedFile.file.encryptedSize;
      } else {
        rangeEnd = (i + 1) * this.decryptChunkSize;
      }

      const bytesRange = `bytes=${rangeStart}-${rangeEnd}`;

      try {
        const response = await downloadFile(
          this.encryptedFile.file.url,
          (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            onFileDownloadProgress(false, progress);
          },
          bytesRange
        );

        const progress = Math.floor(((i + 1) / totalChunks) * 100);
        onDecryptProgress(false, progress);

        const data: Blob = response.data;
        const chunkPart = await this.decryptBlob(data);
        this.parts.push(chunkPart);
      } catch (error) {
        onFileDownloadProgress(true, 0);
        throw new Error(
          `could not download the file because of: ${error.message}`
        );
      }
    }

    onDecryptProgress(true, 100);

    return new File(this.parts, this.encryptedFile.name, {
      type: this.encryptedFile.mimeType,
    });
  }

  private async decryptBlob(encryptedData: Blob): Promise<BlobPart> {
    return new Promise((resolve) => {
      // To give some CPU time in order to refresh the UI.
      setTimeout(() => {
        var decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
        var typedArray = this.convertWordArrayToUint8Array(decrypted);
        resolve(typedArray);
      }, 200);
    });
  }

  private convertWordArrayToUint8Array(wordArray) {
    const arrayOfWords = wordArray.hasOwnProperty('words')
      ? wordArray.words
      : [];
    const length = wordArray.hasOwnProperty('sigBytes')
      ? wordArray.sigBytes
      : arrayOfWords.length * 4;
    let uInt8Array = new Uint8Array(length),
      index = 0,
      word,
      i;
    for (i = 0; i < length; i++) {
      word = arrayOfWords[i];
      uInt8Array[index++] = word >> 24;
      uInt8Array[index++] = (word >> 16) & 0xff;
      uInt8Array[index++] = (word >> 8) & 0xff;
      uInt8Array[index++] = word & 0xff;
    }
    return uInt8Array;
  }
}
