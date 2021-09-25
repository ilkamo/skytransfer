import { createSlice } from '@reduxjs/toolkit';
import { MySky } from 'skynet-js';
import { getCurrentPortal } from '../../portals';

import { UserProfileDAC } from '@skynethub/userprofile-library';
import { User, UserState, UserStatus } from '../../models/user';
import { getMySky } from '../../skynet/skynet';

const userProfileRecord = new UserProfileDAC();

const initialState: UserState = {
  status: UserStatus.NotLogged,
  data: null,
}

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
  },
});

export const { logout, userLoaded } = userSlice.actions;

export default userSlice.reducer;

const performLogin = async (dispatch, mySky: MySky) => {
  // @ts-ignore
  await mySky.loadDacs(userProfileRecord);

  // @ts-ignore
  const userProfile = await userProfileRecord.getProfile(
    await mySky.userID()
  );

  const tempUser: User = {
    username: userProfile.username,
    avatar: null,
  };

  if (userProfile.avatar && userProfile.avatar.length > 0) {
    tempUser['avatar'] = userProfile.avatar[0].url.replace('sia://', getCurrentPortal()+'/')
  }

  dispatch(userLoaded(tempUser));
}

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

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.counter.value)`
export const selectUser = (state) => state.user;
