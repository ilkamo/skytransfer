import { EncryptedFile, EncryptedFiles } from "./encrypted-file";

export interface Bucket {
  uuid: string;
  name: string;
  description: string;
  files: EncryptedFiles;
  created: number;
  modified: number;

  encryptedFileExists(relativePath: string): boolean;
  getEncryptedFile(relativePath: string): EncryptedFile;
}

export interface BucketInfo {
  uuid: string;
  name: string;
  description: string;
  created: number;
  key: string;
}

export interface Buckets {
  [bucketID: string]: BucketInfo;
}

export class DecryptedBucket implements Bucket {
  uuid: string;
  name: string;
  description: string;
  files: EncryptedFiles = {};
  created: number;
  modified: number;

  encryptedFileExists(relativePath: string): boolean {
    return relativePath in this.files;
  }

  getEncryptedFile(relativePath: string): EncryptedFile {
    if (this.encryptedFileExists(relativePath)) {
      return this.files[relativePath];
    }

    throw Error("file doesn't exist");
  }
}