import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import {
  deleteUserHiddenBucket,
  getMySky,
  getUserHiddenBuckets,
} from '../../skynet/skynet';

import { Button, Divider, List, message } from 'antd';
import { Drawer, Typography, Modal } from 'antd';

import { genKeyPairAndSeed, MySky } from 'skynet-js';
import {
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
  DeleteOutlined,
} from '@ant-design/icons';
import { BucketModal } from '../common/bucket-modal';

import { v4 as uuid } from 'uuid';

const { Title } = Typography;

const generateNewBucketInfo = (): BucketInfo => {
  const tempBucketID = uuid();

  const bucketPrivateKey = genKeyPairAndSeed().privateKey;
  const bucketEncryptionKey = genKeyPairAndSeed().privateKey;

  const tempBucketInfo: BucketInfo = {
    uuid: tempBucketID,
    name: '',
    description: '',
    created: Date.now(),
    modified: Date.now(),
    privateKey: bucketPrivateKey,
    encryptionKey: bucketEncryptionKey,
  };

  return tempBucketInfo;
};

const Buckets = () => {
  const [userHiddenBuckets, setUserHiddenBuckets] = useState<HiddenBuckets>({});
  const [isloading, setIsLoading] = useState(false);
  const [newBucketModalVisible, setNewBucketModalVisible] = useState(false);
  const [newBucketInfo, setNewBucketInfo] = useState<BucketInfo>(
    generateNewBucketInfo()
  );
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

  useEffect(() => {
    if (user.status === UserStatus.Logged) {
      init();
    }
  }, [user]);

  const [visible, setVisible] = useState(false);
  const showDrawer = () => {
    setVisible(true);
  };
  const onClose = () => {
    setVisible(false);
  };

  const openBucket = (b: BucketInfo) => {
    dispatch(
      keySet({
        bucketPrivateKey: b.privateKey,
        bucketEncryptionKey: b.encryptionKey,
      })
    );
    history.push('/');
  };

  const deleteBucket = async (b: BucketInfo) => {
    const mySky = await getMySky();
    deleteUserHiddenBucket(mySky, b);
    setUserHiddenBuckets((p) => {
      delete p[b.uuid];
      return p;
    });
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
                setNewBucketInfo(generateNewBucketInfo());
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
                  <Button
                    type="link"
                    onClick={() => openBucket(item)}
                    key={`${item.uuid}`}
                  >
                    open
                  </Button>,
                  <Button
                    danger
                    type="link"
                    onClick={() => deleteBucket(item)}
                    key={`${item.uuid}`}
                  >
                    delete
                  </Button>,
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
      <BucketModal
        bucketInfo={newBucketInfo}
        visible={newBucketModalVisible}
        onCancel={() => setNewBucketModalVisible(false)}
        isLoggedUser={user.status === UserStatus.Logged}
        modalTitle="Create new bucket"
        onDone={(bucketInfo) => {
          setUserHiddenBuckets((p) => {
            p[bucketInfo.uuid] = bucketInfo;
            return p;
          });
          setNewBucketModalVisible(false);
          history.push('/');
        }}
        onError={(e) => {
          console.error(e);
          setNewBucketModalVisible(false);
        }}
      />
    </>
  );
};

export default Buckets;
