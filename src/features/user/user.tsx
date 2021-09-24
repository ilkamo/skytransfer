import { useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { UserStatus } from '../../models/user';

import { initLogin, selectUser } from './user-slice';

const useConstructor = (callBack = () => {}) => {
  const hasBeenCalled = useRef(false);
  if (hasBeenCalled.current) return;
  callBack();
  hasBeenCalled.current = true;
};

export function User() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  useConstructor(async () => {
    dispatch(initLogin());
  });

  return (
    <div>
      {user.status == UserStatus.Logged ? (
        <b>{user.data.username}</b>
      ) : (
        <b>Not logged</b>
      )}
    </div>
  );
}
