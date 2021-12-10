export interface FileEncoder {
  encryptAndStream(): Promise<void>;
  encryptChunkSize: number;

  isStreamReady(): boolean;
  getStream(streamChunkSize: number): Promise<ReadableStream>;
  getStreamSize(): number;
}

export interface FileDecoder {
  decrypt(): Promise<File>;
  decryptChunkSize: number;
}

export const publicKeyFromPrivateKey = (key: string): string => {
  return key.substr(key.length - 64);
};
