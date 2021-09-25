import { useEffect, useState } from 'react';
import {
  getMySky,
  getUserHiddenBuckets,
  storeUserHiddenBucket,
} from '../../skynet/skynet';

import { Form, Input, Button, Divider, Spin } from 'antd';

import { List, message } from 'antd';

import { v4 as uuid } from 'uuid';
import { genKeyPairAndSeed, MySky } from 'skynet-js';
import {
  BucketInfo,
  Buckets as HiddenBuckets,
} from '../../models/files/bucket';
import { deriveEncryptionKeyFromKey } from '../../crypto/crypto';

import { User } from '../../features/user/user';

import { selectUser } from '../../features/user/user-slice';
import { useSelector } from 'react-redux';
import { UserStatus } from '../../models/user';

const Buckets = () => {
  const [userHiddenBuckets, setUserHiddenBuckets] = useState<HiddenBuckets>({});
  const [isloading, setIsLoading] = useState(true);
  const user = useSelector(selectUser);

  const init = async () => {
    try {
      const mySky: MySky = await getMySky();
      const hiddenBuckets = await getUserHiddenBuckets(mySky);
      setUserHiddenBuckets(hiddenBuckets);
    } catch (error) {
      message.error(error.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user.status === UserStatus.Logged) {
      init();
    }
  }, [user]);

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
      const mySky: MySky = await getMySky();
      await storeUserHiddenBucket(mySky, tempBucket);
    } catch (error) {
      message.error(error.message);
    }

    setIsLoading(false);
  };

  return (
    <>
      <div className="default-margin" style={{ textAlign: 'center' }}>
        <User></User>
      </div>
      {user.status === UserStatus.NotLogged ? (
        <div className="default-margin" style={{ textAlign: 'center' }}>
          <Spin tip="Please login..." size="large" />
        </div>
      ) : (
        <>

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
                    href={`https://${window.location.hostname}/#/${item.key
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
