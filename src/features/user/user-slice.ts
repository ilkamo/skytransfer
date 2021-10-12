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
import SessionManager from '../../session/session-manager';
import {
  IBucketsInfo,
  IReadOnlyBucketInfo,
  IReadWriteBucketInfo,
  IReadWriteBucketsInfo,
} from '../../models/files/bucket';

type ActiveBucketKeys = {
  bucketPrivateKey: string;
  bucketEncryptionKey: string;
};

const userProfileRecord = new UserProfileDAC();

const initialState: IUserState = {
  status: UserStatus.NotLogged,
  data: null,

  activeBucketPrivateKey: null,
  activeBucketEncryptionKey: null,

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
    userLoaded: (state, action: PayloadAction<IUser>) => {
      state.data = action.payload;
      state.status = UserStatus.Logged;
    },
    keySet: (state, action: PayloadAction<ActiveBucketKeys>) => {
      state.activeBucketPrivateKey = action.payload.bucketPrivateKey;
      state.activeBucketEncryptionKey = action.payload.bucketEncryptionKey;
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
  keySet,
  bucketsSet,
  readWriteBucketRemoved,
  readOnlyBucketRemoved,
  readWriteBucketAdded,
  readOnlyBucketAdded,
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
    try {
      const mySky = await getMySky();
      const loggedIn = await mySky.checkLogin();
      if (!loggedIn) {
        return;
      }

      await performLogin(dispatch, mySky);
    } catch (err) {
      console.error(err);
    }
  };
};

export const login = () => {
  return async (dispatch, getState) => {
    try {
      const mySky = await getMySky();
      if (!(await mySky.requestLoginAccess())) {
        throw Error('could not login');
      }

      await performLogin(dispatch, mySky);
    } catch (err) {
      console.error(err);
    }
  };
};

export const initUserKeys = ({
  bucketPrivateKey,
  bucketEncryptionKey,
}: ActiveBucketKeys) => {
  return async (dispatch, getState) => {
    dispatch(keySet({ bucketPrivateKey, bucketEncryptionKey }));
  };
};

export const setUserKeys = ({
  bucketPrivateKey,
  bucketEncryptionKey,
}: ActiveBucketKeys) => {
  return async (dispatch, getState) => {
    SessionManager.setSessionKeys({
      bucketPrivateKey,
      bucketEncryptionKey,
    });
    dispatch(keySet({ bucketPrivateKey, bucketEncryptionKey }));
  };
};

export const loadBuckets = (mySky: MySky) => {
  return async (dispatch, getState) => {
    const { readOnly, readWrite } = await getAllUserHiddenBuckets(mySky);
    dispatch(bucketsSet({ readOnly, readWrite }));
  };
};

export const deleteReadWriteBucket = (mySky: MySky, bucketID: string) => {
  return async (dispatch, getState) => {
    await deleteUserReadWriteHiddenBucket(mySky, bucketID);
    dispatch(readWriteBucketRemoved({ bucketID }));
  };
};

export const deleteReadOnlyBucket = (mySky: MySky, bucketID: string) => {
  return async (dispatch, getState) => {
    await deleteUserReadOnlyHiddenBucket(mySky, bucketID);
    dispatch(readOnlyBucketRemoved({ bucketID }));
  };
};

export const addReadWriteBucket = (
  mySky: MySky,
  bucket: IReadWriteBucketInfo
) => {
  return async (dispatch, getState) => {
    await storeUserReadWriteHiddenBucket(mySky, bucket);
    dispatch(readWriteBucketAdded(bucket));
  };
};

export const addReadOnlyBucket = (
  mySky: MySky,
  bucket: IReadOnlyBucketInfo
) => {
  return async (dispatch, getState) => {
    await storeUserReadOnlyHiddenBucket(mySky, bucket);
    dispatch(readOnlyBucketRemoved(bucket));
  };
};

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.counter.value)`
export const selectUser = (state) => state.user;
