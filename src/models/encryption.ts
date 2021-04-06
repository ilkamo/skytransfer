export enum EncryptionType {
  AES
}

export interface FileEncrypted {
  mimeType: string;
  fileName: string;
  skylink: string; // skylink of the stored encrypted file
  encryptionType: EncryptionType;
  size?: string;
}
