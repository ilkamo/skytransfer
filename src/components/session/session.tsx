import { useRef, useState } from 'react';

import { SkynetClient } from 'skynet-js';

// choose a data domain for saving files in MySky
const dataDomain = 'ilkamo.hns';
const skynetClient = new SkynetClient('https://siasky.net');

const useConstructor = (callBack = () => {}) => {
  const hasBeenCalled = useRef(false);
  if (hasBeenCalled.current) return;
  callBack();
  hasBeenCalled.current = true;
};

const Session = () => {
  const [errorMessage, setErrorMessage] = useState('');

  const initSession = async () => {
    try {
      const mySky = await skynetClient.loadMySky(dataDomain, {
        dev: true,
        debug: true,
      });

      if (!(await mySky.checkLogin())) {
        mySky.requestLoginAccess();
      }
    } catch (error) {
      console.log(error);
    }
  };

  useConstructor(() => {
    initSession();
  });

  return <div className="container">test</div>;
};

export default Session;
