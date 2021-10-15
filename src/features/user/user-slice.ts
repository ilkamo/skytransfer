import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MySky } from 'skynet-js';
import { getCurrentPortal } from '../../portals';

import { UserProfileDAC } from '@skynethub/userprofile-library';
import { IUser, IUserState, UserStatus } from '../../models/user';
import {
  deleteUserReadOnlyHiddenBucket,
  deleteUserReadWriteHiddenBucket,
  getAllUserHiddenBuckets,
  getMySky,
  storeUserReadOnlyHiddenBucket,
  storeUserReadWriteHiddenBucket,
} from '../../skynet/skynet';
import {
  IBucketsInfo,
  IReadOnlyBucketInfo,
  IReadWriteBucketInfo,
} from '../../models/files/bucket';
import {
  bucketIsLoadingFinish,
  bucketIsLoadingStart,
} from '../bucket/bucket-slice';

const userProfileRecord = new UserProfileDAC();

const initialState: IUserState = {
  status: UserStatus.NotLogged,
  data: null,

  buckets: {
    readOnly: {},
    readWrite: {},
  },
};

export const userSlice = createSlice({
  name: 'user',
  initialState: initialState,
  reducers: {
    logout: (state) => {
      // TODO
    },
    userLoading: (state, action: PayloadAction<void>) => {
      state.status = UserStatus.Loading;
    },
    userLoadingFailed: (state, action: PayloadAction<void>) => {
      state.status = UserStatus.NotLogged;
    },
    userLoaded: (state, action: PayloadAction<IUser>) => {
      state.data = action.payload;
      state.status = UserStatus.Logged;
    },
    bucketsSet: (state, action: PayloadAction<IBucketsInfo>) => {
      state.buckets.readOnly = action.payload.readOnly;
      state.buckets.readWrite = action.payload.readWrite;
    },
    readWriteBucketRemoved: (
      state,
      action: PayloadAction<{ bucketID: string }>
    ) => {
      const newState = { ...state.buckets.readWrite };
      delete newState[action.payload.bucketID];
      state.buckets.readWrite = newState;
    },
    readOnlyBucketRemoved: (
      state,
      action: PayloadAction<{ bucketID: string }>
    ) => {
      const newState = { ...state.buckets.readOnly };
      delete newState[action.payload.bucketID];
      state.buckets.readOnly = newState;
    },
    readWriteBucketAdded: (
      state,
      action: PayloadAction<IReadWriteBucketInfo>
    ) => {
      const newState = { ...state.buckets.readWrite };
      newState[action.payload.bucketID] = action.payload;
      state.buckets.readWrite = { ...newState };
    },
    readOnlyBucketAdded: (
      state,
      action: PayloadAction<IReadOnlyBucketInfo>
    ) => {
      const newState = { ...state.buckets.readOnly };
      newState[action.payload.bucketID] = action.payload;
      state.buckets.readOnly = { ...newState };
    },
  },
});

export const {
  logout,
  userLoaded,
  bucketsSet,
  readWriteBucketRemoved,
  readOnlyBucketRemoved,
  readWriteBucketAdded,
  readOnlyBucketAdded,
  userLoading,
  userLoadingFailed,
} = userSlice.actions;

export default userSlice.reducer;

const performLogin = async (dispatch, mySky: MySky) => {
  // @ts-ignore
  await mySky.loadDacs(userProfileRecord);

  // @ts-ignore
  const userProfile = await userProfileRecord.getProfile(await mySky.userID());

  const tempUser: IUser = {
    username: userProfile.username,
    description: userProfile.description,
    avatar: null,
  };

  if (userProfile.avatar && userProfile.avatar.length > 0) {
    const avatarPrefix = getCurrentPortal().domain;
    tempUser['avatar'] = userProfile.avatar[0].url.replace(
      'sia://',
      `https://${avatarPrefix}/`
    );
  }

  dispatch(userLoaded(tempUser));
  dispatch(loadBuckets(mySky));
};

export const silentLogin = () => {
  return async (dispatch, getState) => {
    dispatch(userLoading());
    try {
      const mySky = await getMySky();
      const loggedIn = await mySky.checkLogin();
      if (!loggedIn) {
        dispatch(userLoadingFailed());
        return;
      }

      await performLogin(dispatch, mySky);
    } catch (err) {
      console.error(err);
      dispatch(userLoadingFailed());
    }
  };
};

export const login = () => {
  return async (dispatch, getState) => {
    dispatch(userLoading());
    try {
      const mySky = await getMySky();
      if (!(await mySky.requestLoginAccess())) {
        dispatch(userLoadingFailed());
        throw Error('could not login');
      }

      await performLogin(dispatch, mySky);
    } catch (err) {
      dispatch(userLoadingFailed());
      console.error(err);
    }
  };
};

export const loadBuckets = (mySky: MySky) => {
  return async (dispatch, getState) => {
    dispatch(bucketIsLoadingStart());
    const { readOnly, readWrite } = await getAllUserHiddenBuckets(mySky);
    dispatch(bucketsSet({ readOnly, readWrite }));
    dispatch(bucketIsLoadingFinish());
  };
};

export const deleteReadWriteBucket = (mySky: MySky, bucketID: string) => {
  return async (dispatch, getState) => {
    dispatch(bucketIsLoadingStart());
    await deleteUserReadWriteHiddenBucket(mySky, bucketID);
    dispatch(readWriteBucketRemoved({ bucketID }));
    dispatch(bucketIsLoadingFinish());
  };
};

export const deleteReadOnlyBucket = (mySky: MySky, bucketID: string) => {
  return async (dispatch, getState) => {
    dispatch(bucketIsLoadingStart());
    await deleteUserReadOnlyHiddenBucket(mySky, bucketID);
    dispatch(readOnlyBucketRemoved({ bucketID }));
    dispatch(bucketIsLoadingFinish());
  };
};

export const addReadWriteBucket = (
  mySky: MySky,
  bucket: IReadWriteBucketInfo
) => {
  return async (dispatch, getState) => {
    dispatch(bucketIsLoadingStart());
    await storeUserReadWriteHiddenBucket(mySky, bucket);
    dispatch(readWriteBucketAdded(bucket));
    dispatch(bucketIsLoadingFinish());
  };
};

export const addReadOnlyBucket = (
  mySky: MySky,
  bucket: IReadOnlyBucketInfo
) => {
  return async (dispatch, getState) => {
    dispatch(bucketIsLoadingStart());
    await storeUserReadOnlyHiddenBucket(mySky, bucket);
    dispatch(readOnlyBucketAdded(bucket));
    dispatch(bucketIsLoadingFinish());
  };
};

export const selectUser = (state) => state.user;
