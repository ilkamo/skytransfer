import CryptoJS from 'crypto-js';
import { DEFAULT_ENCRYPTION_TYPE } from '../config';
import { ChunkResolver } from './chunk-resolver';
import { FileEncrypt } from './crypto';
import { v4 as uuid } from 'uuid';

export default class AESFileEncrypt implements FileEncrypt {
  private file: File;
  private encryptionKey: string;
  private chunkResolver: ChunkResolver;

  parts: BlobPart[] = [];

  constructor(file: File, encryptionKey: string) {
    this.file = file;
    this.encryptionKey = encryptionKey;
    this.chunkResolver = new ChunkResolver(DEFAULT_ENCRYPTION_TYPE);
  }

  get encryptChunkSize(): number {
    return this.chunkResolver.encryptChunkSize;
  }

  async encrypt(
    onEncryptProgress: (
      completed: boolean,
      percentage: number
    ) => void = () => {}
  ): Promise<File> {
    const totalChunks = Math.ceil(this.file.size / this.encryptChunkSize);

    for (let i = 0; i < totalChunks; i++) {
      let chunkPart: BlobPart;

      if (i === totalChunks - 1) {
        chunkPart = await this.encryptBlob(
          this.file.slice(i * this.encryptChunkSize, this.file.size)
        );
      } else {
        chunkPart = await this.encryptBlob(
          this.file.slice(
            i * this.encryptChunkSize,
            (i + 1) * this.encryptChunkSize
          )
        );
      }

      const progress = Math.floor(((i + 1) / totalChunks) * 100);
      onEncryptProgress(false, progress);

      this.parts.push(chunkPart);
    }

    onEncryptProgress(true, 100);

    // The returned file name is a random uuid() in order to not expose the file name to the portal.
    // The correct information is stored in the EncryptedFileReference.
    return new File(this.parts, uuid(), { type: 'text/plain' });
  }

  private async encryptBlob(fileBlob: Blob): Promise<BlobPart> {
    const $this = this;
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async function (e) {
        const data = e.target.result;

        const wordArray = CryptoJS.lib.WordArray.create(data);
        const encrypted = CryptoJS.AES.encrypt(
          wordArray,
          $this.encryptionKey
        ).toString();

        return resolve(encrypted);
      };

      reader.onerror = reject;

      reader.readAsArrayBuffer(fileBlob);
    });
  }
}
