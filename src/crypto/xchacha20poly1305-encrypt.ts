import { DEFAULT_ENCRYPTION_TYPE } from '../config';
import { ChunkResolver } from './chunk-resolver';
import { FileEncrypt } from './crypto';
import { v4 as uuid } from 'uuid';
import _sodium from 'libsodium-wrappers';

export default class Xchacha20poly1305Encrypt implements FileEncrypt {
  private file: File;
  private encryptionKey: string;
  private chunkResolver: ChunkResolver;
  private state: _sodium.StateAddress;

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
    await _sodium.ready;
    const sodium = _sodium;
    const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);

    const key = sodium.crypto_pwhash(
      sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
      this.encryptionKey,
      salt,
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_ARGON2ID13
    );

    let res = sodium.crypto_secretstream_xchacha20poly1305_init_push(key);
    let [state_out, header] = [res.state, res.header];
    this.state = state_out;

    this.parts.push(salt);
    this.parts.push(header);

    const totalChunks = Math.ceil(this.file.size / this.encryptChunkSize);

    for (let i = 0; i < totalChunks; i++) {
      let chunkPart: BlobPart;

      if (i === totalChunks - 1) {
        const buff = await this.file
          .slice(i * this.encryptChunkSize, this.file.size)
          .arrayBuffer();
        chunkPart = await this.encryptBlob(buff, sodium, true);
      } else {
        const buff = await this.file
          .slice(i * this.encryptChunkSize, (i + 1) * this.encryptChunkSize)
          .arrayBuffer();
        chunkPart = await this.encryptBlob(buff, sodium);
      }

      const progress = Math.floor(((i + 1) / totalChunks) * 100);
      onEncryptProgress(false, progress);

      this.parts.push(chunkPart);
    }

    onEncryptProgress(true, 100);

    // The returned file name is a random uuid() in order to not expose the file name to the portal.
    // The correct information is stored in the EncryptedFileReference.
    return new File(this.parts, `skytransfer-${uuid()}`, {
      type: 'text/plain',
    });
  }

  private async encryptBlob(
    chunk: ArrayBuffer,
    sodium: typeof _sodium,
    last: boolean = false
  ): Promise<BlobPart> {
    let tag = last
      ? sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
      : sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE;

    return sodium.crypto_secretstream_xchacha20poly1305_push(
      this.state,
      new Uint8Array(chunk),
      null,
      tag
    );
  }
}
