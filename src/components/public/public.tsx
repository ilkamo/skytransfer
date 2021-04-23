import { useRef, useState } from 'react';
import {
  getUserPublicSessions,
  mySkyLogin,
  storeUserSession,
} from '../../skynet/skynet';

import { Form, Input, Button, Divider, Alert, Spin } from 'antd';
import { PublicSession } from '../../models/session';

import { List } from 'antd';

import { v4 as uuid } from 'uuid';
import { MySky } from 'skynet-js';
import SessionManager from '../../session/session-manager';

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
      {isloading ? (
        <div className="default-margin" style={{ textAlign: 'center' }}>
          <Spin tip="Loading MySky session..." size="large" />
        </div>
      ) : (
        <>
          {userID && isLogged && (
            <div className="default-margin">
              <Divider orientation="left">MySky userID</Divider>
              <Input disabled readOnly defaultValue={userID} />
            </div>
          )}
          <Divider className="default-margin" orientation="left">
            Public a new SkyTransfer session link
          </Divider>
          <Form name="basic" onFinish={onFinish}>
            <Form.Item
              name="sessionName"
              rules={[
                { required: true, message: 'Please add a SkyTransfer name' },
              ]}
            >
              <Input placeholder="Session name" />
            </Form.Item>

            <Form.Item
              name="sessionLink"
              rules={[{ required: true, message: 'Please add a session link' }]}
            >
              <Input
                disabled
                readOnly
                defaultValue={SessionManager.readOnlyLink}
                placeholder="SkyTransfer link"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Public
              </Button>
            </Form.Item>
          </Form>
          <Divider orientation="left">Public SkyTransfer sessions</Divider>
          <List
            loading={isloading}
            bordered
            dataSource={userSessions}
            renderItem={(item) => (
              <List.Item
                title={item.name}
                actions={[
                  <a href={item.link} key={`${item.id}`}>
                    open
                  </a>,
                ]}
              />
            )}
          />
        </>
      )}
    </>
  );
};

export default Account;
