import { useRef, useState } from 'react';
import {
  getUserPublicSessions,
  mySkyLogin,
  storeUserSession,
} from '../../skynet/skynet';

import { Form, Input, Button, Divider, Alert, Spin } from 'antd';
import { PublicSession } from '../../models/session';

import { List, message } from 'antd';

import { v4 as uuid } from 'uuid';
import { MySky } from 'skynet-js';
import SessionManager from '../../session/session-manager';

const useConstructor = (callBack = () => {}) => {
  const hasBeenCalled = useRef(false);
  if (hasBeenCalled.current) return;
  callBack();
  hasBeenCalled.current = true;
};

let mySky: MySky = null;

const Publish = () => {
  const [userSessions, setUserSessions] = useState<PublicSession[]>([]);
  const [isLogged, setIsLogged] = useState(false);
  const [userID, setUserID] = useState('');
  const [isloading, setIsLoading] = useState(true);

  useConstructor(async () => {
    try {
      mySky = await mySkyLogin();
      setUserID(await mySky.userID());
      setIsLogged(true);
      setUserSessions(await getUserPublicSessions(mySky));
    } catch (error) {
      message.error(error.message);
      setIsLogged(false);
    }
    setIsLoading(false);
  });

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    const session: PublicSession = {
      id: uuid(),
      name: values.contentDescription,
      link: values.sessionLink,
      createdAt: new Date().getTime(),
    };

    setUserSessions((p) => [...p, session]);

    try {
      if (mySky === null) {
        mySky = await mySkyLogin();
      }

      await storeUserSession(mySky, session);
    } catch (error) {
      message.error(error.message);
    }

    setIsLoading(false);
  };

  const sessionLink = SessionManager.readOnlyLink;

  return (
    <>
      <Alert
        message="Warning - advanced functionality"
        description="Make sure you know what you are doing! Once you publish your files, any user of Skynet will be able to discover and access them. Use with caution."
        type="warning"
      />
      {isloading ? (
        <div className="default-margin" style={{ textAlign: 'center' }}>
          <Spin tip="Loading MySky stuff and interactions..." size="large" />
        </div>
      ) : (
        <>
          {userID && isLogged && (
            <div className="default-margin">
              <Divider orientation="left">MySky userID</Divider>
              <Input readOnly defaultValue={userID} />
            </div>
          )}
          <Divider className="default-margin" orientation="left">
            Publish files
          </Divider>
          <Form
            name="basic"
            onFinish={onSubmit}
            initialValues={{ sessionLink }}
          >
            <Form.Item
              name="contentDescription"
              rules={[
                {
                  required: true,
                  message: 'Please add a short content description',
                },
              ]}
            >
              <Input placeholder="Short content description" />
            </Form.Item>
            <Form.Item
              name="sessionLink"
              rules={[{ required: true, message: 'Please add a session link' }]}
            >
              <Input disabled readOnly placeholder="SkyTransfer link" />
            </Form.Item>
            <Form.Item style={{ textAlign: 'center' }}>
              <Button type="primary" htmlType="submit">
                Publish
              </Button>
            </Form.Item>
          </Form>
          <Divider orientation="left">Public discoverable files</Divider>
          <List
            loading={isloading}
            bordered
            dataSource={userSessions}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <a href={item.link} key={`${item.id}`}>
                    open
                  </a>,
                ]}
              >
                <List.Item.Meta title={item.name} />
              </List.Item>
            )}
          />
        </>
      )}
    </>
  );
};

export default Publish;
