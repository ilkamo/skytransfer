import { useRef, useState } from 'react';
import {
  getUserPublicSessions,
  mySkyLogin,
  storeUserSession,
} from '../../skynet/skynet';

import { Form, Input, Button, Divider, Alert } from 'antd';
import { PublicSession } from '../../models/session';

import { List } from 'antd';

import { v4 as uuid } from 'uuid';
import { MySky } from 'skynet-js';

const useConstructor = (callBack = () => {}) => {
  const hasBeenCalled = useRef(false);
  if (hasBeenCalled.current) return;
  callBack();
  hasBeenCalled.current = true;
};

const Account = () => {
  const [userSessions, setUserSessions] = useState<PublicSession[]>([]);
  const [isLogged, setIsLogged] = useState(false);
  const [userID, setUserID] = useState('');
  const [isloading, setIsLoading] = useState(true);

  let mySky: MySky = null;

  useConstructor(async () => {
    try {
      mySky = await mySkyLogin();
      setUserID(await mySky.userID());
      setIsLogged(true);
      setUserSessions(await getUserPublicSessions(mySky));
    } catch (error) {
      setIsLogged(false);
    }
    setIsLoading(false);
  });

  const onFinish = async (values: any) => {
    setIsLoading(true);
    const session: PublicSession = {
      id: uuid(),
      name: values.sessionName,
      link: values.sessionLink,
      createdAt: new Date().getTime(),
    };

    setUserSessions((p) => [...p, session]);

    if (mySky !== null) {
      await storeUserSession(mySky, [session]);
    }
    setIsLoading(false);
  };

  return (
    <>
      <Alert
        message="Warning"
        description="This is an advanced functionality. Make sure you know what you are doing! Once you publish a SkyTransfer
      link, any user of Skynet which know your userID will be able to
      discover and access the files you shared. Use with caution."
        type="warning"
      />
      <Divider orientation="left">
        Public a new SkyTransfer session link
      </Divider>
      <Form name="basic" onFinish={onFinish}>
        <Form.Item
          name="sessionName"
          rules={[{ required: true, message: 'Please add a SkyTransfer name' }]}
        >
          <Input placeholder="Session name" />
        </Form.Item>

        <Form.Item
          name="sessionLink"
          rules={[{ required: true, message: 'Please add a session link' }]}
        >
          <Input placeholder="SkyTransfer link" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Public
          </Button>
        </Form.Item>
      </Form>
      <Divider orientation="left">Public SkyTransfer sessions</Divider>
      <List
        bordered
        dataSource={userSessions}
        renderItem={(item) => (
          <List.Item>
            <a href={item.link}>{item.name}</a>
          </List.Item>
        )}
      />
    </>
  );
};

export default Account;
