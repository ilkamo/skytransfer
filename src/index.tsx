import 'react-app-polyfill/stable';

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './app';

import store from './app/store';
import { Provider } from 'react-redux';
import SessionManager from './session/session-manager';
import { initUserKeys } from './features/user/user-slice';

const { bucketPrivateKey, bucketEncryptionKey } = SessionManager.sessionKeys;

store.dispatch(initUserKeys(bucketPrivateKey, bucketEncryptionKey));

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
    ,
  </React.StrictMode>,
  document.getElementById('root')
);
