import { useRef, useState } from 'react';
import {
  getUserHiddenBuckets,
  mySkyLogin,
  storeUserHiddenBucket,
} from '../../skynet/skynet';

import { Form, Input, Button, Divider, Spin } from 'antd';

import { List, message } from 'antd';

import { v4 as uuid } from 'uuid';
import { MySky } from 'skynet-js';
import SessionManager from '../../session/session-manager';
import {
  BucketInfo,
  Buckets as HiddenBuckets,
} from '../../models/files/bucket';

import { UserProfileDAC } from '@skynethub/userprofile-library';

const useConstructor = (callBack = () => {}) => {
  const hasBeenCalled = useRef(false);
  if (hasBeenCalled.current) return;
  callBack();
  hasBeenCalled.current = true;
};

let mySky: MySky = null;
const userProfileRecord = new UserProfileDAC();

const Buckets = () => {
  const [userHiddenBuckets, setUserHiddenBuckets] = useState<HiddenBuckets>({});
  const [isLogged, setIsLogged] = useState(false);
  const [userID, setUserID] = useState('');
  const [isloading, setIsLoading] = useState(true);
  // const [profileName, setProfileName] = useState('');

  useConstructor(async () => {
    try {
      mySky = await mySkyLogin();
      setUserID(await mySky.userID());

      // @ts-ignore
      await mySky.loadDacs(userProfileRecord);

      // @ts-ignore
      let userProfile = await userProfileRecord.getProfile(
        await mySky.userID()
      );
      console.log(userProfile);

      setIsLogged(true);
      const hiddenBuckets = await getUserHiddenBuckets(mySky);
      debugger; // TODO: remove me
      setUserHiddenBuckets(hiddenBuckets);
    } catch (error) {
      message.error(error.message);
      setIsLogged(false);
    }
    setIsLoading(false);
  });

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    const tempBucketID = uuid(); // TODO: use the real uuid

    const tempBucket: BucketInfo = {
      uuid: tempBucketID,
      name: values.bucketName,
      description: values.bucketDescription,
      created: Date.now(),
      key: SessionManager.sessionPrivateKey,
    };

    setUserHiddenBuckets((p) => {
      p[tempBucket.uuid] = tempBucket;
      return p;
    });

    try {
      if (mySky === null) {
        mySky = await mySkyLogin();
      }

      await storeUserHiddenBucket(mySky, tempBucket);
    } catch (error) {
      message.error(error.message);
    }

    setIsLoading(false);
  };

  return (
    <>
      {isloading ? (
        <div className="default-margin" style={{ textAlign: 'center' }}>
          <Spin tip="Loading MySky stuff..." size="large" />
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
            Create a new private bucket
          </Divider>
          <Form name="basic" onFinish={onSubmit}>
            <Form.Item
              name="bucketName"
              rules={[
                {
                  required: true,
                  message: 'Please add the bucket name',
                },
              ]}
            >
              <Input placeholder="Bucket name" />
            </Form.Item>
            <Form.Item
              name="bucketDescription"
              rules={[
                {
                  required: true,
                  message: 'Please add a short bucket description',
                },
              ]}
            >
              <Input placeholder="Bucket description" />
            </Form.Item>
            <Form.Item style={{ textAlign: 'center' }}>
              <Button type="primary" htmlType="submit">
                Save bucket
              </Button>
            </Form.Item>
          </Form>
          <Divider orientation="left">Your private buckets</Divider>
          <List
            loading={isloading}
            bordered
            dataSource={Object.values(userHiddenBuckets)}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <a href={item.name} key={`${item.uuid}`}>
                    open
                  </a>,
                ]}
              >
                <b>{item.name}</b>
                <b>{item.description}</b>
                <List.Item.Meta title={item.name} />
                <List.Item.Meta description={item.description} />
              </List.Item>
            )}
          />
        </>
      )}
    </>
  );
};

export default Buckets;
