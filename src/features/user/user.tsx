import { useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { UserStatus } from '../../models/user';

import { Card, Avatar } from 'antd';
import { EditOutlined } from '@ant-design/icons';

import { Button } from 'antd';
import { LoginOutlined } from '@ant-design/icons';

import { checkLogin, login, selectUser } from './user-slice';
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
    <div className="default-margin" style={{ textAlign: 'center' }}>
      {user.status === UserStatus.Logged ? (
        <Card
          style={{ width: 300 }}
          actions={[
            <a href="https://skyprofile.hns.siasky.net/" target="_blank" rel="noreferrer">
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
        <div>
          <p>You are not logged. Login and access to your buckets.</p>
          <Button
            onClick={() => dispatch(login())}
            type="primary"
            icon={<LoginOutlined />}
            size="large"
          >
            Sign in with MySky
          </Button>
        </div>
      )}
    </div>
  );
}
