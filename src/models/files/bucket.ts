import { EncryptedFile, EncryptedFiles } from './encrypted-file';

export interface Bucket {
  uuid: string;
  name: string;
  description: string;
  files: EncryptedFiles;
  created: number;
  modified: number;
}

export interface BucketInfo {
  bucketID: string;
  name: string;
  description: string;
  created: number;
  modified: number;
  privateKey: string;
  encryptionKey: string;
}

export interface Buckets {
  [bucketID: string]: BucketInfo;
}

export interface DecryptedBucket extends Bucket {}

export class DecryptedBucket {
  constructor(bucket: Bucket) {
    Object.assign(this, bucket, {});
  }

  encryptedFileExists(relativePath: string): boolean {
    return this.files && relativePath in this.files;
  }

  getEncryptedFile(relativePath: string): EncryptedFile {
    if (this.encryptedFileExists(relativePath)) {
      return this.files[relativePath];
    }

    throw Error("file doesn't exist");
  }

  toBucketInfo(bucketPrivateKey, bucketEncryptionKey): BucketInfo {
    return {
      bucketID: this.uuid,
      name: this.name,
      description: this.description,
      created: this.created,
      modified: this.modified,
      privateKey: bucketPrivateKey,
      encryptionKey: bucketEncryptionKey,
    };
  }
}
