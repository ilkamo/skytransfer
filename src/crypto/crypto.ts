import { genKeyPairFromSeed } from 'skynet-js';

export const ENCRYPT_CHUNK_SIZE = 1048576 * 4; // 4MB
export const DECRYPT_CHUNK_SIZE = 5592448; // Find how to calculate it automatically from ENCRYPT_CHUNK_SIZE

export interface FileEncrypt {
  encrypt(): Promise<File>;
}

export interface FileDecrypt {
  decrypt(): Promise<File>;
}

export const deriveEncryptionKeyFromKey = (key): string => {
  return genKeyPairFromSeed(`${key}-aes-encrypt`).privateKey;
};
