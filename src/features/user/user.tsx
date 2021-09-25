import { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { UserStatus } from '../../models/user';

import { Card, Avatar } from 'antd';
import { EditOutlined } from '@ant-design/icons';

import { checkLogin, selectUser } from './user-slice';
const { Meta } = Card;

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
    dispatch(checkLogin());
  });

  return (
    <>
      {user.status === UserStatus.Logged ? (
        <Card
          actions={[
            <a
              href="https://skyprofile.hns.siasky.net/"
              target="_blank"
              rel="noreferrer"
            >
              Edit profile <EditOutlined key="edit" />
            </a>,
          ]}
        >
          <Meta
            avatar={<Avatar src={user.data.avatar} />}
            title={user.data.username}
          />
        </Card>
      ) : (
        <Card
          actions={[
            <a
              href="https://skyprofile.hns.siasky.net/"
              target="_blank"
              rel="noreferrer"
            >
              Edit profile <EditOutlined key="edit" />
            </a>,
          ]}
        >
          <Meta avatar={<Avatar />} title="Anonimous" />
        </Card>
      )}
    </>
  );
}
