export class IFileData {
  uuid: string;
  size: number;
  chunkSize: number;
  encryptionType: string;
  url: string;
  key: string;
  hash: string;
  ts: number;
  encryptedSize: number;
  relativePath: string;
}
