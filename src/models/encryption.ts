export enum EncryptionType {
  AES
}

export interface FileEncrypted {
  skylink: string; // skylink of the stored encrypted file
  encryptionType: EncryptionType;
}
