export enum EncryptionType {
  Xchacha20poly1305_4MB,
  Xchacha20poly1305_8MB,
  Xchacha20poly1305_16MB,
  Xchacha20poly1305_32MB,
  Xchacha20poly1305_64MB,
  Xchacha20poly1305_128MB,
  Xchacha20poly1305_256MB,
  Xchacha20poly1305_512MB,
}

export interface IEncryptionReaderResult {
  value: BlobPart;
  done: boolean;
}
