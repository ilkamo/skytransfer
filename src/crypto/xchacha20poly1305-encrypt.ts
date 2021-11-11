import { DEFAULT_ENCRYPTION_TYPE } from '../config';
import { ChunkResolver } from './chunk-resolver';
import { FileEncrypt } from './crypto';
import _sodium from 'libsodium-wrappers';
import { delimiter } from 'path/posix';

export default class Xchacha20poly1305Encrypt implements FileEncrypt {
  private file: File;
  private encryptionKey: string;
  private chunkResolver: ChunkResolver;
  private stateOut: _sodium.StateAddress;
  private totalChunks: number = 0;

  private counter = 0;

  parts: BlobPart[] = [];

  constructor(file: File, encryptionKey: string) {
    this.file = file;
    this.encryptionKey = encryptionKey;
    this.chunkResolver = new ChunkResolver(DEFAULT_ENCRYPTION_TYPE);
    this.totalChunks = Math.ceil(this.file.size / this.encryptChunkSize);
  }

  get encryptChunkSize(): number {
    return this.chunkResolver.encryptChunkSize;
  }

  async encrypt(
    onEncryptProgress: (
      completed: boolean,
      percentage: number
    ) => void = () => {}
  ): Promise<ReadableStream> {
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
    this.stateOut = state_out;

    this.parts.push(salt);
    this.parts.push(header);

    onEncryptProgress(false, 1);

    // for (let i = 0; i < totalChunks; i++) {
    //   let chunkPart: BlobPart;

    //   if (i === totalChunks - 1) {
    //     const buff = await this.file
    //       .slice(i * this.encryptChunkSize, this.file.size)
    //       .arrayBuffer();
    //     chunkPart = await this.encryptBlob(buff, sodium, true);
    //   } else {
    //     const buff = await this.file
    //       .slice(i * this.encryptChunkSize, (i + 1) * this.encryptChunkSize)
    //       .arrayBuffer();
    //     chunkPart = await this.encryptBlob(buff, sodium);
    //   }

    //   const progress = Math.floor(((i + 1) / totalChunks) * 100);
    //   onEncryptProgress(false, progress);

    //   this.parts.push(chunkPart);
    // }

    // onEncryptProgress(true, 100);

    // The returned file name is a random uuid() in order to not expose the file name to the portal.
    // The correct information is stored in the EncryptedFileReference.
    // return new File(this.parts, `skytransfer-${uuid()}`, {
    //   type: 'text/plain',
    // });

    const that = this;

    return new ReadableStream({
      async start(controller) {
        controller.enqueue(salt);
        controller.enqueue(header);
      },
      async pull(controller) {
        if (that.hasNextChunkDelimiter()) {
          const delimiters = that.nextChunkDelimiters();
          const buffer = await that.file
          .slice(delimiters[0], delimiters[1])
          .arrayBuffer();

          const encryptedChunk= await that.encryptBlob(buffer, sodium, !that.hasNextChunkDelimiter());
          controller.enqueue(encryptedChunk);
          onEncryptProgress(false, that.progress());
        } else {
          controller.close();
          return;
        }
      },
    });
  }

  private progress(): number {
    return Math.floor(((this.counter + 1) / this.totalChunks) * 100);
  }

  private nextChunkDelimiters(): number[] {
    const startDelimiter = this.counter * this.encryptChunkSize;
    let endDelimiter = 0;

    if (this.counter === this.totalChunks - 1) {
      endDelimiter = this.file.size;
    } else {
      endDelimiter = (this.counter + 1) * this.encryptChunkSize;
    }

    this.counter++;

    return [startDelimiter, endDelimiter];
  }

  private hasNextChunkDelimiter(): boolean {
    return this.counter <= this.totalChunks - 1;
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
      this.stateOut,
      new Uint8Array(chunk),
      null,
      tag
    );
  }
}
