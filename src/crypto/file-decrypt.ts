import { SkynetClient } from 'skynet-js';
import { EncryptionType } from '../models/encryption';
import { FileDecrypt } from './crypto';
import { getEndpointInCurrentPortal } from '../portals';
import { ChunkResolver } from './chunk-resolver';
import { downloadFile } from '../skynet/skynet';
import { EncryptedFile } from '../models/files/encrypted-file';

import _sodium from 'libsodium-wrappers';

const metadataSize = 40;

export default class LibsodiumDecrypt implements FileDecrypt {
  private encryptedFile: EncryptedFile;
  private encryptionKey: string;
  private chunkResolver: ChunkResolver;
  private state: _sodium.StateAddress;

  skynetClient = new SkynetClient(getEndpointInCurrentPortal());

  parts: BlobPart[] = [];

  constructor(encryptedFile: EncryptedFile) {
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
    const headerAndSaltBytesRange = `bytes=${0}-${39}`;
    const response = await downloadFile(
      this.encryptedFile.file.url,
      (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded / progressEvent.total) * 100
        );
        onFileDownloadProgress(false, progress);
      },
      headerAndSaltBytesRange
    );

    const data: Blob = response.data;
    
    const [salt, header] = await Promise.all([
      data.slice(0, 16).arrayBuffer(), //salt
      data.slice(16, 40).arrayBuffer(), //header
    ]);

    let decSalt = new Uint8Array(salt);
    let decHeader = new Uint8Array(header);

    await _sodium.ready;

    let key = _sodium.crypto_pwhash(
      _sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
      this.encryptionKey,
      decSalt,
      _sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      _sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      _sodium.crypto_pwhash_ALG_ARGON2ID13
    );

    this.state = _sodium.crypto_secretstream_xchacha20poly1305_init_pull(
      decHeader,
      key
    );

    const totalChunks = Math.ceil(
      (this.encryptedFile.file.encryptedSize - metadataSize) /
        this.decryptChunkSize
    );

    debugger;

    let rangeEnd = 0;
    let index = metadataSize;

    for (let i = 0; i < totalChunks; i++) {
      if (i === totalChunks - 1) {
        rangeEnd = this.encryptedFile.file.encryptedSize;
      } else {
        rangeEnd = index + this.decryptChunkSize - 1; // -1 because rangeEnd is included 
      }

      const bytesRange = `bytes=${index}-${rangeEnd}`;
      debugger;

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
        const buff = await data.arrayBuffer();
        const chunkPart = await this.decryptBlob(buff);
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

  private async decryptBlob(
    chunk: ArrayBuffer
  ): Promise<BlobPart> {
    await _sodium.ready;
    const sodium = _sodium;

    const result = sodium.crypto_secretstream_xchacha20poly1305_pull(
      this.state,
      new Uint8Array(chunk)
    );

    if (!result) {
      throw Error("error during decryption");
    }

    console.log(result.tag);

    return result.message
  }
}
