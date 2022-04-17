import { useSelector } from 'react-redux';
import { UserStatus } from '../../models/user';

import { Avatar, Card } from 'antd';
import { EditOutlined } from '@ant-design/icons';

import { selectUser } from './user-slice';

const { Meta } = Card;

export function User() {
  const user = useSelector(selectUser);

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
