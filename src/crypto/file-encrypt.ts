import { DEFAULT_ENCRYPTION_TYPE } from '../config';
import { ChunkResolver } from './chunk-resolver';
import { FileEncrypt } from './crypto';
import { v4 as uuid } from 'uuid';
import _sodium from 'libsodium-wrappers';

export default class LibsodiumEncrypt implements FileEncrypt {
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
    const salt = _sodium.randombytes_buf(_sodium.crypto_pwhash_SALTBYTES);

    const key = _sodium.crypto_pwhash(
      _sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
      this.encryptionKey,
      salt,
      _sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      _sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      _sodium.crypto_pwhash_ALG_ARGON2ID13
    );

    let res = _sodium.crypto_secretstream_xchacha20poly1305_init_push(key);
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
        chunkPart = await this.encryptBlob(buff);
      } else {
        const buff = await this.file
          .slice(i * this.encryptChunkSize, (i + 1) * this.encryptChunkSize)
          .arrayBuffer();
        chunkPart = await this.encryptBlob(buff);
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
    last: boolean = false
  ): Promise<BlobPart> {
    await _sodium.ready;
    const sodium = _sodium;

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
