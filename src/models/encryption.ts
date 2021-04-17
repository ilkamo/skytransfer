export enum EncryptionType {
  AES
}

export interface EncryptedFileReference {
  uuid: string
  mimeType: string
  fileName: string
  skylink: string // skylink of the stored encrypted file
  encryptionType: EncryptionType
  relativePath: string
  size: number
}
