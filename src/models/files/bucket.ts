import { IEncryptedFile, IEncryptedFiles } from './encrypted-file';

export interface IBucket {
  uuid: string;
  name: string;
  description: string;
  files: IEncryptedFiles;
  created: number;
  modified: number;
}

export interface IReadWriteBucketInfo {
  bucketID: string;
  privateKey: string;
  encryptionKey: string;
}

export interface IReadOnlyBucketInfo {
  bucketID: string;
  publicKey: string;
  encryptionKey: string;
}

export interface IReadWriteBucketsInfo {
  [bucketID: string]: IReadWriteBucketInfo;
}

export interface IReadOnlyBucketsInfo {
  [bucketID: string]: IReadOnlyBucketInfo;
}

export interface IBucketsInfo {
  readWrite: IReadWriteBucketsInfo;
  readOnly: IReadOnlyBucketsInfo;
}

export interface IBuckets {
  [bucketID: string]: IBucket;
}

export interface IAllBuckets {
  readOnly: IBuckets;
  readWrite: IBuckets;
}

export interface DecryptedBucket extends IBucket {}

export class DecryptedBucket {
  constructor(bucket: IBucket) {
    Object.assign(this, bucket, {});
  }

  encryptedFileExists(relativePath: string): boolean {
    return this.files && relativePath in this.files;
  }

  getEncryptedFile(relativePath: string): IEncryptedFile {
    if (this.encryptedFileExists(relativePath)) {
      return this.files[relativePath];
    }

    throw Error("file doesn't exist");
  }
}
