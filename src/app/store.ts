import { configureStore } from '@reduxjs/toolkit';
import bucketSlice from '../features/bucket/bucket-slice';
import userSlice from '../features/user/user-slice';

export default configureStore({
  reducer: {
    user: userSlice,
    bucket: bucketSlice,
  },
});
