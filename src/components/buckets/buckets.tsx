import { useRef, useState } from 'react';
import {
  getUserHiddenBuckets,
  mySkyLogin,
  storeUserHiddenBucket,
} from '../../skynet/skynet';

import { Form, Input, Button, Divider, Spin } from 'antd';

import { List, message } from 'antd';

import { v4 as uuid } from 'uuid';
import { genKeyPairAndSeed, MySky } from 'skynet-js';
import SessionManager from '../../session/session-manager';
import {
  BucketInfo,
  Buckets as HiddenBuckets,
} from '../../models/files/bucket';
import { deriveEncryptionKeyFromKey } from '../../crypto/crypto';

const useConstructor = (callBack = () => {}) => {
  const hasBeenCalled = useRef(false);
  if (hasBeenCalled.current) return;
  callBack();
  hasBeenCalled.current = true;
};

import { User } from '../../features/user/user';

let mySky: MySky = null;

const Buckets = () => {
  const [userHiddenBuckets, setUserHiddenBuckets] = useState<HiddenBuckets>({});
  const [isLogged, setIsLogged] = useState(false);
  const [userID, setUserID] = useState('');
  const [isloading, setIsLoading] = useState(true);
  // const [profileName, setProfileName] = useState('');

  useConstructor(async () => {
    // try {
    //   setIsLogged(true);
    //   const hiddenBuckets = await getUserHiddenBuckets(mySky);
    //   setUserHiddenBuckets(hiddenBuckets);
    // } catch (error) {
    //   message.error(error.message);
    //   setIsLogged(false);
    // }
    // setIsLoading(false);
  });

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    const tempBucketID = uuid();

    const tempBucket: BucketInfo = {
      uuid: tempBucketID,
      name: values.bucketName,
      description: values.bucketDescription,
      created: Date.now(),
      key: genKeyPairAndSeed().privateKey,
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
      <User></User>
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
                  // TODO: this is just a test link. Change the link logic and pass only one key in the future??.
                  <a
                    href={`https://${window.location.hostname}/#/${
                      item.key
                    }/${deriveEncryptionKeyFromKey(item.key)}`}
                    key={`${item.uuid}`}
                  >
                    open
                  </a>,
                ]}
              >
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
