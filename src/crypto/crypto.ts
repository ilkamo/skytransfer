export interface FileEncrypt {
  encrypt(): Promise<ReadableStream>;
  encryptChunkSize: number;
}

export interface FileDecrypt {
  decrypt(): Promise<File>;
  decryptChunkSize: number;
}

export const publicKeyFromPrivateKey = (key: string): string => {
  return key.substr(key.length - 64);
};
