import { DEFAULT_ENCRYPTION_TYPE } from '../config';
import { ChunkResolver } from './chunk-resolver';
import { FileEncoder } from './crypto';
import _sodium from 'libsodium-wrappers';
import { v4 as uuid } from 'uuid';

export default class Xchacha20poly1305Encrypt implements FileEncoder {
  private file: File;
  readonly encryptionKey: string;
  readonly totalChunks: number = 0;
  private chunkResolver: ChunkResolver;

  private stateOut: _sodium.StateAddress;

  private isStreamReadyToBeConsumed: boolean = false;
  private streamSize: number = 0;

  private chunkCounter = 0;
  fileChunks: BlobPart[] = [];

  constructor(file: File, encryptionKey: string) {
    this.file = file;
    this.encryptionKey = encryptionKey;
    this.chunkResolver = new ChunkResolver(DEFAULT_ENCRYPTION_TYPE);
    this.totalChunks = Math.ceil(this.file.size / this.encryptChunkSize);
  }

  get encryptChunkSize(): number {
    return this.chunkResolver.encryptChunkSize;
  }

  async encryptAndStream(
    onEncryptProgress: (
      completed: boolean,
      percentage: number
    ) => void = () => {}
  ): Promise<void> {
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

    this.fileChunks.push(salt);
    this.fileChunks.push(header);

    this.streamSize += salt.byteLength;
    this.streamSize += header.byteLength;

    onEncryptProgress(false, 1);

    while (this.hasNextChunkDelimiter()) {
      const delimiters = this.nextChunkDelimiters();
      const buffer = await this.file
        .slice(delimiters[0], delimiters[1])
        .arrayBuffer();

      const encryptedChunk = await this.encryptBlob(
        buffer,
        sodium,
        !this.hasNextChunkDelimiter()
      );

      this.fileChunks.push(encryptedChunk);
      this.streamSize += encryptedChunk.byteLength;
      onEncryptProgress(false, this.progress());
    }

    onEncryptProgress(true, 100);

    this.isStreamReadyToBeConsumed = true;
  }

  isStreamReady(): boolean {
    return this.isStreamReadyToBeConsumed;
  }

  async getStream(streamChunkSize: number): Promise<ReadableStream> {
    if (streamChunkSize > this.chunkResolver.encryptChunkSize) {
      throw new Error(
        'streamChunkSize should be less or equal to encryptChunkSize'
      );
    }

    if (!this.isStreamReady()) {
      throw new Error('stream is not ready');
    }

    const file = new File(this.fileChunks, `skytransfer-${uuid()}`, {
      type: 'text/plain',
    });

    const totalChunks = Math.ceil(this.streamSize / streamChunkSize);
    let streamCounter = 0;
    let endStream: boolean;

    const that = this;

    function getEndDelimiterAndSetEndStream(): number {
      let endDelimiter;

      if (streamCounter === totalChunks - 1) {
        endDelimiter = that.streamSize;
        endStream = true;
      } else {
        endDelimiter = (streamCounter + 1) * streamChunkSize;
      }

      return endDelimiter;
    }

    return new ReadableStream({
      async start(controller) {
        controller.enqueue(
          file.slice(
            streamChunkSize * streamCounter,
            getEndDelimiterAndSetEndStream()
          )
        );
        streamCounter++;
      },
      async pull(controller) {
        controller.enqueue(
          file.slice(
            streamChunkSize * streamCounter,
            getEndDelimiterAndSetEndStream()
          )
        );
        streamCounter++;

        if (endStream) {
          controller.close();
          return;
        }
      },
    });
  }

  private progress(): number {
    if (this.chunkCounter === 0) {
      return 0;
    }

    return Math.floor((this.chunkCounter / this.totalChunks) * 100);
  }

  private nextChunkDelimiters(): number[] {
    const startDelimiter = this.chunkCounter * this.encryptChunkSize;
    let endDelimiter: number;

    if (this.chunkCounter === this.totalChunks - 1) {
      endDelimiter = this.file.size;
    } else {
      endDelimiter = (this.chunkCounter + 1) * this.encryptChunkSize;
    }

    this.chunkCounter++;

    return [startDelimiter, endDelimiter];
  }

  private hasNextChunkDelimiter(): boolean {
    return this.chunkCounter <= this.totalChunks - 1;
  }

  getStreamSize(): number {
    return this.streamSize;
  }

  private async encryptBlob(
    chunk: ArrayBuffer,
    sodium: typeof _sodium,
    last: boolean = false
  ): Promise<Uint8Array> {
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
