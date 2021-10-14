import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import SessionManager from '../../session/session-manager';

export interface IBucketState {
  privateKey: string;
  encryptionKey: string;

  bucketIsLoading: boolean;
}

interface IActiveBucketKeys {
  bucketPrivateKey: string;
  bucketEncryptionKey: string;
}

const initialState: IBucketState = {
  privateKey: null,
  encryptionKey: null,
  bucketIsLoading: false,
};

export const bucketSlice = createSlice({
  name: 'bicket',
  initialState: initialState,
  reducers: {
    keySet: (state, action: PayloadAction<IActiveBucketKeys>) => {
      state.privateKey = action.payload.bucketPrivateKey;
      state.encryptionKey = action.payload.bucketEncryptionKey;
    },
    bucketIsLoadingStart: (state, action: PayloadAction<void>) => {
      state.bucketIsLoading = true;
    },
    bucketIsLoadingFinish: (state, action: PayloadAction<void>) => {
      state.bucketIsLoading = false;
    },
  },
});

export const { 
    keySet, 
    bucketIsLoadingStart, 
    bucketIsLoadingFinish 
} = bucketSlice.actions;

export default bucketSlice.reducer;

export const initUserKeys = ({
  bucketPrivateKey,
  bucketEncryptionKey,
}: IActiveBucketKeys) => {
  return async (dispatch, getState) => {
    dispatch(keySet({ bucketPrivateKey, bucketEncryptionKey }));
  };
};

export const setUserKeys = ({
  bucketPrivateKey,
  bucketEncryptionKey,
}: IActiveBucketKeys) => {
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
export const selectBucket = (state) => state.bucket;
