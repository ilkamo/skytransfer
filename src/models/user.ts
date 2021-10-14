import { IBucketsInfo } from './files/bucket';

export interface IUser {
  username: string;
  avatar: string;
  description: string;
}

export enum UserStatus {
  NotLogged = 1,
  Loading,
  Logged,
}

export interface IUserState {
  status: UserStatus;
  data: IUser;
  buckets: IBucketsInfo;
}
