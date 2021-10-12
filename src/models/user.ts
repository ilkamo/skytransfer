import { IBucketsInfo } from './files/bucket';

export interface IUser {
  username: string;
  avatar: string;
  description: string;
}

export enum UserStatus {
  NotLogged = 1,
  Logged,
}

export interface IUserState {
  status: UserStatus;
  data: IUser;
  activeBucketPrivateKey: string;
  activeBucketEncryptionKey: string;
  buckets: IBucketsInfo;
}
