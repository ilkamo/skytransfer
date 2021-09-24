import { createSlice } from '@reduxjs/toolkit';
import { SkynetClient } from 'skynet-js';
import { getMySkyDomain } from '../../portals';

import { UserProfileDAC } from '@skynethub/userprofile-library';
import { User, UserState, UserStatus } from '../../models/user';

const dataDomain = 'skytransfer.hns';
const privateBucketsPath = 'skytransfer.hns/privateBuckets.json';

const userProfileRecord = new UserProfileDAC();

const initialState: UserState = {
  status: UserStatus.NotLogged,
  data: null,
}

export const userSlice = createSlice({
  name: 'user',
  initialState: initialState,
  reducers: {
    login: (state) => {
      // TODO
    },
    logout: (state) => {
      // TODO
    },
    userLoaded: (state, action) => {
      state.data = action.payload;
      state.status = UserStatus.Logged;
    },
  },
});

export const { login, logout, userLoaded } = userSlice.actions;

export default userSlice.reducer;

export const initLogin = () => {
  // the inside "thunk function"
  return async (dispatch, getState) => {
    try {
      const client = new SkynetClient(getMySkyDomain());
      const mySky = await client.loadMySky(dataDomain, { debug: true });

      const loggedIn = await mySky.checkLogin();
      if (!loggedIn) {
        if (!(await mySky.requestLoginAccess())) {
          throw Error('could not login');
        }
      }

      // setUserID(await mySky.userID());

      // @ts-ignore
      await mySky.loadDacs(userProfileRecord);

      // @ts-ignore
      const userProfile = await userProfileRecord.getProfile(
        await mySky.userID()
      );

      const tempUser: User = {
        username: userProfile.username,
        avatar: userProfile.avatar[0].url,
      };

      dispatch(userLoaded(tempUser));
    } catch (err) {
      const tempUser: User = {
        username: 'test',
        avatar: 'test',
      };

      dispatch(userLoaded(tempUser));
    }
  };
};

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.counter.value)`
export const selectUser = (state) => state.user;
