import CryptoJS from 'crypto-js';
import { EncryptionType } from '../models/encryption';
import { ChunkResolver } from './chunk-resolver';
import { FileEncrypt } from './crypto';

export default class AESFileEncrypt implements FileEncrypt {
  private file: File;
  private encryptionKey: string;
  private chunkResolver: ChunkResolver;

  parts: BlobPart[] = [];

  constructor(file: File, encryptionKey: string) {
    this.file = file;
    this.encryptionKey = encryptionKey;

    // This is the one used for new uploaded files.
    this.chunkResolver = new ChunkResolver(EncryptionType.AES_64MB);
  }

  get encryptChunkSize(): number {
    return this.chunkResolver.encryptChunkSize;
  }

  async encrypt(
    onEncryptProgress: (
      completed: boolean,
      percentage: number
    ) => void = () => { }
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
          this.file.slice(i * this.encryptChunkSize, (i + 1) * this.encryptChunkSize)
        );
      }

      const progress = Math.floor(((i + 1) / totalChunks) * 100);
      onEncryptProgress(false, progress);

      this.parts.push(chunkPart);
    }

    onEncryptProgress(true, 100);

    return new File(this.parts, this.file.name, { type: this.file.type });
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
