export interface User {
  username: string;
  avatar: string;
}

export enum UserStatus {
  NotLogged = 1,
  Logged,
}

export interface UserState {
  status: UserStatus;
  data: User;
}