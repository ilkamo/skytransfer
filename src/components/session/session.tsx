import { useRef } from 'react';

const useConstructor = (callBack = () => {}) => {
  const hasBeenCalled = useRef(false);
  if (hasBeenCalled.current) return;
  callBack();
  hasBeenCalled.current = true;
};

const Session = () => {
  const initSession = async () => {
    // TODO: add session logic
  };

  useConstructor(() => {
    initSession();
  });

  return '';
};

export default Session;
