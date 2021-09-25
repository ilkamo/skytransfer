import { useEffect, useState } from 'react';
import {
  getMySky,
  getUserHiddenBuckets,
  storeUserHiddenBucket,
} from '../../skynet/skynet';

import { Form, Input, Button, Divider, Spin, List, message } from 'antd';
import { Drawer, Typography, Modal } from 'antd';

import { v4 as uuid } from 'uuid';
import { genKeyPairAndSeed, MySky } from 'skynet-js';
import {
  BucketInfo,
  Buckets as HiddenBuckets,
} from '../../models/files/bucket';
import { deriveEncryptionKeyFromKey } from '../../crypto/crypto';

import { User } from '../../features/user/user';

import { selectUser, login } from '../../features/user/user-slice';
import { useDispatch, useSelector } from 'react-redux';
import { UserStatus } from '../../models/user';

import {
  LoginOutlined,
  InboxOutlined,
  ProfileOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

const modalSpinner = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const Buckets = () => {
  const [userHiddenBuckets, setUserHiddenBuckets] = useState<HiddenBuckets>({});
  const [isloading, setIsLoading] = useState(true);
  const [newBucketModalVisible, setNewBucketModalVisible] = useState(false);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

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
    setNewBucketModalVisible(false);
  };

  const [visible, setVisible] = useState(false);
  const showDrawer = () => {
    setVisible(true);
  };
  const onClose = () => {
    setVisible(false);
  };

  return (
    <>
      {user.status !== UserStatus.NotLogged ? (
        <div
          className="default-margin"
          style={{ fontSize: 16, textAlign: 'center' }}
        >
          <p>You are not logged. Login and access your buckets.</p>
          <Button
            onClick={() => dispatch(login())}
            type="primary"
            icon={<LoginOutlined />}
            size="large"
          >
            Sign in with MySky
          </Button>
        </div>
      ) : (
        <>
          <Drawer
            title="User profile"
            placement="right"
            onClose={onClose}
            visible={visible}
          >
            <User></User>
          </Drawer>
          <Title level={3}>Your Buckets</Title>
          <Divider className="default-margin" orientation="right"></Divider>
          <div style={{ fontSize: 16 }}>
            <p>
              Welcome to the buckets section. Here you can access previously
              created buckets.
            </p>
            <p>
              You can also create a new bucket which will be stored in your account.
            </p>
          </div>
          <div className="default-margin" style={{ textAlign: 'center' }}>
            <Button
              style={{ marginRight: 10 }}
              icon={<ProfileOutlined />}
              size="large"
              type="primary"
              onClick={showDrawer}
            >
              Manage account
            </Button>
            <Button
              icon={<InboxOutlined />}
              size="large"
              type="primary"
              onClick={() => setNewBucketModalVisible(true)}
            >
              Create bucket
            </Button>
          </div>
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

          <Modal
            title="Vertically centered modal dialog"
            centered
            visible={newBucketModalVisible}
            onCancel={() => setNewBucketModalVisible(false)}
            okButtonProps={{ form: 'create-bucket', htmlType: 'submit' }}
          >
            <Form name="create-bucket" onFinish={onSubmit}>
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
                <Input.TextArea placeholder="Bucket description" />
              </Form.Item>
            </Form>
            {isloading && (
              <div className="default-margin" style={{ textAlign: 'center' }}>
                <Spin indicator={modalSpinner} tip="Creating the bucket..." />
              </div>
            )}
          </Modal>
        </>
      )}
    </>
  );
};

export default Buckets;
