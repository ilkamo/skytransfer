import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import {
  encryptAndStoreBucket,
  getMySky,
  getUserHiddenBuckets,
  storeUserHiddenBucket,
} from '../../skynet/skynet';

import { Form, Input, Button, Divider, Spin, List, message } from 'antd';
import { Drawer, Typography, Modal } from 'antd';

import { v4 as uuid } from 'uuid';
import { genKeyPairAndSeed, MySky } from 'skynet-js';
import {
  Bucket,
  BucketInfo,
  Buckets as HiddenBuckets,
} from '../../models/files/bucket';

import { User } from '../../features/user/user';

import { selectUser, login, keySet } from '../../features/user/user-slice';
import { useDispatch, useSelector } from 'react-redux';
import { UserState, UserStatus } from '../../models/user';

import {
  LoginOutlined,
  InboxOutlined,
  ProfileOutlined,
  LoadingOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

const modalSpinner = <LoadingOutlined style={{ fontSize: 24 }} spin />;

const Buckets = () => {
  const [userHiddenBuckets, setUserHiddenBuckets] = useState<HiddenBuckets>({});
  const [isloading, setIsLoading] = useState(false);
  const [newBucketModalVisible, setNewBucketModalVisible] = useState(false);
  const user: UserState = useSelector(selectUser);
  const dispatch = useDispatch();
  const history = useHistory();

  const init = async () => {
    setIsLoading(true);
    try {
      const mySky: MySky = await getMySky();
      const hiddenBuckets = await getUserHiddenBuckets(mySky);
      setUserHiddenBuckets(hiddenBuckets);
    } catch (error) {
      message.error(error.message);
    }
    setIsLoading(false);
  };

  const isLoggedUser = user.status === UserStatus.Logged;

  useEffect(() => {
    if (isLoggedUser) {
      init();
    }
  }, [isLoggedUser]);

  const onSubmit = async (values: any) => {
    setIsLoading(true);
    const tempBucketID = uuid();

    const bucketPrivateKey = genKeyPairAndSeed().privateKey;
    const bucketEncryptionKey = genKeyPairAndSeed().privateKey;

    const tempBucketInfo: BucketInfo = {
      uuid: tempBucketID,
      name: values.bucketName,
      description: values.bucketDescription,
      created: Date.now(),
      privateKey: bucketPrivateKey,
      encryptionKey: bucketEncryptionKey,
    };

    const tempBucket: Bucket = {
      uuid: tempBucketID,
      name: values.bucketName,
      description: values.bucketDescription,
      files: {},
      created: Date.now(),
      modified: Date.now(),
    };

    setUserHiddenBuckets((p) => {
      p[tempBucketInfo.uuid] = tempBucketInfo;
      return p;
    });

    try {
      await encryptAndStoreBucket(
        bucketPrivateKey,
        bucketEncryptionKey,
        tempBucket
      );

      if (isLoggedUser) {
        const mySky: MySky = await getMySky();
        await storeUserHiddenBucket(mySky, tempBucketInfo);
      }
    } catch (error) {
      message.error(error.message);
    }

    dispatch(keySet({ bucketPrivateKey, bucketEncryptionKey }));

    setIsLoading(false);
    setNewBucketModalVisible(false);

    history.push('/');
  };

  const [visible, setVisible] = useState(false);
  const showDrawer = () => {
    setVisible(true);
  };
  const onClose = () => {
    setVisible(false);
  };

  const resolveBucketLink = (b: BucketInfo) => {
    return `https://${window.location.hostname}/#/${b.privateKey}/${b.encryptionKey}`;
  };

  const newDraftConfirmModal = (onNewDraftClick: () => void) => {
    Modal.confirm({
      title: 'Are you sure?',
      icon: <DeleteOutlined />,
      content: `By starting a new draft, all files you've uploaded will be lost if you don't have the draft link. Make sure you've saved the draft link before continuing.`,
      okText: 'New draft',
      cancelText: 'Cancel',
      onOk: onNewDraftClick,
    });
  };

  return (
    <>
      {user.status === UserStatus.NotLogged ? (
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
          <br />
          <br />
          <Button
            icon={<InboxOutlined />}
            size="large"
            type="primary"
            onClick={() =>
              newDraftConfirmModal(() => {
                setNewBucketModalVisible(true);
              })
            }
          >
            Create new bucket
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
              You can also create a new bucket which will be stored in your
              account.
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
            itemLayout="horizontal"
            dataSource={Object.values(userHiddenBuckets)}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <a href="#">edit</a>,
                  // TODO: this is just a test link. Change the link logic and pass only one key in the future??.
                  <a href={resolveBucketLink(item)} key={`${item.uuid}`}>
                    open
                  </a>,
                ]}
              >
                <List.Item.Meta
                  title={item.name}
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </>
      )}
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
  );
};

export default Buckets;
