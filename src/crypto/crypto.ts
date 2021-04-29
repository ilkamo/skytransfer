import { genKeyPairFromSeed } from 'skynet-js';

export interface FileEncrypt {
  encrypt(): Promise<File>;
  encryptChunkSize: number;
}

export interface FileDecrypt {
  decrypt(): Promise<File>;
  decryptChunkSize: number;
}

export const deriveEncryptionKeyFromKey = (key): string => {
  return genKeyPairFromSeed(`${key}-aes-encrypt`).privateKey;
};
