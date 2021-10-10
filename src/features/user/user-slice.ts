import { createSlice } from '@reduxjs/toolkit';
import { MySky } from 'skynet-js';
import { getCurrentPortal } from '../../portals';

import { UserProfileDAC } from '@skynethub/userprofile-library';
import { User, UserState, UserStatus } from '../../models/user';
import { getMySky } from '../../skynet/skynet';
import SessionManager from '../../session/session-manager';

const userProfileRecord = new UserProfileDAC();

const initialState: UserState = {
  status: UserStatus.NotLogged,
  data: null,
  bucketPrivateKey: null,
  bucketEncryptionKey: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState: initialState,
  reducers: {
    logout: (state) => {
      // TODO
    },
    userLoaded: (state, action) => {
      state.data = action.payload;
      state.status = UserStatus.Logged;
    },
    keySet: (state, action) => {
      state.bucketPrivateKey = action.payload.bucketPrivateKey;
      state.bucketEncryptionKey = action.payload.bucketEncryptionKey;
    },
  },
});

export const { logout, userLoaded, keySet } = userSlice.actions;

export default userSlice.reducer;

const performLogin = async (dispatch, mySky: MySky) => {
  // @ts-ignore
  await mySky.loadDacs(userProfileRecord);

  // @ts-ignore
  const userProfile = await userProfileRecord.getProfile(await mySky.userID());

  const tempUser: User = {
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
};

export const checkLogin = () => {
  // the inside "thunk function"
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
  // the inside "thunk function"
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

export const initUserKeys = (bucketPrivateKey, bucketEncryptionKey: string) => {
  return async (dispatch, getState) => {
    dispatch(keySet({ bucketPrivateKey, bucketEncryptionKey }));
  };
};

export const setUserKeys = (bucketPrivateKey, bucketEncryptionKey: string) => {
  return async (dispatch, getState) => {
    SessionManager.setSessionKeys({
      bucketPrivateKey,
      bucketEncryptionKey,
    });
    dispatch(keySet({ bucketPrivateKey, bucketEncryptionKey }));
  };
};

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.counter.value)`
export const selectUser = (state) => state.user;
