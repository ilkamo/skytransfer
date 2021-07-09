export enum EncryptionType {
  AES_4MB,
  AES_8MB,
  AES_16MB,
  AES_32MB,
  AES_64MB,
}

export interface EncryptedFileReference {
  uuid: string;
  mimeType: string;
  fileName: string;
  skylink: string; // skylink of the stored encrypted file
  encryptionType: EncryptionType;
  relativePath: string;
  size: number;
  encryptedSize: number;
  updatedAt?: number;
}
