export interface FileEncoder {
  encryptChunkSize: number;

  encryptAndStream(): Promise<void>;

  isStreamReady(): boolean;

  getStream(streamChunkSize: number): Promise<ReadableStream>;

  getStreamSize(): number;
}

export interface FileDecoder {
  decryptChunkSize: number;

  decrypt(): Promise<File>;
}

export const publicKeyFromPrivateKey = (key: string): string => {
  return key.substr(key.length - 64);
};
