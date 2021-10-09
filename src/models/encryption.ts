export enum EncryptionType {
  xchacha20poly1305_4MB,
  xchacha20poly1305_8MB,
  xchacha20poly1305_16MB,
  xchacha20poly1305_32MB,
  xchacha20poly1305_64MB,
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
