import { EncryptionType } from '../models/encryption';
import { FileDecrypt } from './crypto';
import { ChunkResolver } from './chunk-resolver';
import { IEncryptedFile } from '../models/files/encrypted-file';

import _sodium from 'libsodium-wrappers';
import axiosRetry from 'axios-retry';
import axios from 'axios';
import { MAX_AXIOS_RETRIES } from '../config';

/* 
  salt and header are appended to each file as Uint8Array
  salt is 16 bytes long
  header is 24 bytes long
*/
const METADATA_SIZE = 40;

export interface ICryptoMetadata {
  salt: Uint8Array;
  header: Uint8Array;
}

export default class Xchacha20poly1305Decrypt implements FileDecrypt {
  private encryptedFile: IEncryptedFile;
  private encryptionKey: string;
  private chunkResolver: ChunkResolver;
  private stateIn: _sodium.StateAddress;

  parts: BlobPart[] = [];

  constructor(encryptedFile: IEncryptedFile) {
    this.encryptedFile = encryptedFile;
    this.encryptionKey = encryptedFile.file.key;
    this.chunkResolver = new ChunkResolver(
      EncryptionType[
        encryptedFile.file.encryptionType as keyof typeof EncryptionType
      ]
    );
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
    await _sodium.ready;
    const sodium = _sodium;

    const cryptoMetadata = await this.cryptoMetadata();

    let key = sodium.crypto_pwhash(
      sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
      this.encryptionKey,
      cryptoMetadata.salt,
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_ARGON2ID13
    );

    this.stateIn = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
      cryptoMetadata.header,
      key
    );

    const totalChunks = Math.ceil(
      (this.encryptedFile.file.encryptedSize - METADATA_SIZE) /
        this.decryptChunkSize
    );

    let rangeEnd = 0;
    let index = METADATA_SIZE;

    for (let i = 0; i < totalChunks; i++) {
      if (i === totalChunks - 1) {
        rangeEnd = this.encryptedFile.file.encryptedSize;
      } else {
        rangeEnd = index + this.decryptChunkSize - 1; // -1 because rangeEnd is included
      }

      const bytesRange = `bytes=${index}-${rangeEnd}`;

      const url = this.encryptedFile.file.url;

      console.log(url);

      try {
        const response = await this.downloadFile(
          url,
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
        const buff = await data.arrayBuffer();
        const chunkPart = await this.decryptBlob(buff, sodium);
        this.parts.push(chunkPart);

        index += this.decryptChunkSize;
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

  private async cryptoMetadata(): Promise<ICryptoMetadata> {
    const headerAndSaltBytesRange = `bytes=${0}-${39}`;
    const response = await this.downloadFile(
      this.encryptedFile.file.url,
      () => {},
      headerAndSaltBytesRange
    );

    const data: Blob = response.data;

    const [salt, header] = await Promise.all([
      data.slice(0, 16).arrayBuffer(), //salt
      data.slice(16, 40).arrayBuffer(), //header
    ]);

    let uSalt = new Uint8Array(salt);
    let uHeader = new Uint8Array(header);

    return {
      salt: uSalt,
      header: uHeader,
    };
  }

  private async downloadFile(skylink: string, onProgress, bytesRange?: string) {
    axiosRetry(axios, {
      retries: MAX_AXIOS_RETRIES,
      retryCondition: (_e) => true, // retry no matter what
    });

    const url = skylink.replace('sia://', 'https://siasky.net/');

    return axios({
      method: 'get',
      url: url,
      headers: {
        Range: bytesRange,
      },
      responseType: 'blob',
      onDownloadProgress: onProgress,
      withCredentials: true,
    });
  }

  private async decryptBlob(
    chunk: ArrayBuffer,
    sodium: typeof _sodium
  ): Promise<BlobPart> {
    const result = sodium.crypto_secretstream_xchacha20poly1305_pull(
      this.stateIn,
      new Uint8Array(chunk)
    );

    if (!result) {
      throw Error('error during xchacha20poly1305 decryption');
    }

    return result.message;
  }
}
