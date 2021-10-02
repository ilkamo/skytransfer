import './buckets.css';

import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import {
  deleteUserHiddenBucket,
  getMySky,
  getUserHiddenBuckets,
} from '../../skynet/skynet';

import { Button, Divider, List, message, Card } from 'antd';
import { Drawer, Typography, Modal } from 'antd';

import { genKeyPairAndSeed, MySky } from 'skynet-js';
import {
  BucketInfo,
  Buckets as HiddenBuckets,
} from '../../models/files/bucket';

import { User } from '../../features/user/user';

import { selectUser, login, setUserKeys } from '../../features/user/user-slice';
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
import { BucketIcon } from '../common/icons';

const { Title } = Typography;
const { Meta } = Card;

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
    dispatch(setUserKeys(b.privateKey, b.encryptionKey));
    history.push('/');
  };

  const deleteBucket = async (b: BucketInfo) => {
    const mySky = await getMySky();
    await deleteUserHiddenBucket(mySky, b);
    setUserHiddenBuckets((p) => {
      const copy = { ...p };
      delete copy[b.uuid];
      return copy;
    });
  };

  const newDraftConfirmModal = (onNewDraftClick: () => void) => {
    Modal.confirm({
      title: 'Are you sure?',
      icon: <DeleteOutlined style={{ color: 'red' }} />,
      content: `By creating a new anonymous bucket, all files you've uploaded will be lost if you don't have the bucket link. Make sure you've saved the anonymous bucket link before continuing.`,
      okText: 'New bucket',
      cancelText: 'Cancel',
      onOk: onNewDraftClick,
    });
  };

  const deleteBucketConfirmModal = (onDeleteBucketClick: () => void) => {
    Modal.confirm({
      title: 'Are you sure?',
      icon: <DeleteOutlined style={{ color: 'red' }} />,
      content: `By deleting the bucket, all files you've uploaded into it will be lost.`,
      okText: 'Delete',
      cancelText: 'Cancel',
      onOk: onDeleteBucketClick,
    });
  };

  return (
    <>
      {user.status === UserStatus.NotLogged ? (
        <div
          className="default-margin buckets"
          style={{ fontSize: 14, textAlign: 'center' }}
        >
          <Card style={{ borderColor: '#bdc3c7' }} cover={<BucketIcon />}>
            <Meta
              title="Buckets"
              description="Buckets are Skytransfer's most advanced feature. Thanks to them you
      can manage your content as never before."
            />
          </Card>
          <Divider />
          <p>
            Sign in with MySky, access your buckets and unclock the power of
            Skytransfer.
          </p>
          <Button
            onClick={() => dispatch(login())}
            type="primary"
            icon={<LoginOutlined />}
            size="large"
          >
            Sign in with MySky
          </Button>
          <Divider />
          <p>Continue as anonymous user and create an anonymous bucket.</p>
          <Button
            icon={<InboxOutlined />}
            size="large"
            type="ghost"
            onClick={() =>
              newDraftConfirmModal(() => {
                setNewBucketInfo(generateNewBucketInfo());
                setNewBucketModalVisible(true);
              })
            }
          >
            Create anonymous bucket
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
                    onClick={() => {
                      deleteBucketConfirmModal(() => deleteBucket(item));
                    }}
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
