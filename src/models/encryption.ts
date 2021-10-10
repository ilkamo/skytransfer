export enum EncryptionType {
  Xchacha20poly1305_4MB,
  Xchacha20poly1305_8MB,
  Xchacha20poly1305_16MB,
  Xchacha20poly1305_32MB,
  Xchacha20poly1305_64MB,
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
