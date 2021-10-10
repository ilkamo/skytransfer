import { configureStore } from '@reduxjs/toolkit';
import userSlice from '../features/user/user-slice';

export default configureStore({
  reducer: {
    user: userSlice,
  },
});
