import 'react-app-polyfill/stable';

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './app';

import store from './app/store';
import { Provider } from 'react-redux';
import SessionManager from './session/session-manager';
import { silentLogin } from './features/user/user-slice';
import { initUserKeys } from './features/bucket/bucket-slice';

const { bucketPrivateKey, bucketEncryptionKey } = SessionManager.sessionKeys;

store.dispatch(initUserKeys({ bucketPrivateKey, bucketEncryptionKey }));
store.dispatch(silentLogin());

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
    ,
  </React.StrictMode>,
  document.getElementById('root')
);
