import './buckets.css';

import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { getMySky, getAllUserDecryptedBuckets } from '../../skynet/skynet';

import { Button, Divider, List, message, Row, Col } from 'antd';
import { Drawer, Typography, Modal } from 'antd';

import { genKeyPairAndSeed, MySky } from 'skynet-js';
import { IBuckets, IReadWriteBucketInfo } from '../../models/files/bucket';

import { User } from '../../features/user/user';

import {
  selectUser,
  login,
  deleteReadWriteBucket,
  deleteReadOnlyBucket,
} from '../../features/user/user-slice';
import { useDispatch, useSelector } from 'react-redux';
import { IUserState, UserStatus } from '../../models/user';

import {
  LoginOutlined,
  InboxOutlined,
  ProfileOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { BucketModal } from '../common/bucket-modal';

import { v4 as uuid } from 'uuid';
import { BucketIcon } from '../common/icons';
import {
  IBucketState,
  selectBucket,
  setUserKeys,
} from '../../features/bucket/bucket-slice';

const { Title } = Typography;

const generateNewBucketInfo = (): IReadWriteBucketInfo => {
  const tempBucketID = uuid();

  const bucketPrivateKey = genKeyPairAndSeed().privateKey;
  const bucketEncryptionKey = genKeyPairAndSeed().privateKey;

  const tempBucketInfo: IReadWriteBucketInfo = {
    bucketID: tempBucketID,
    privateKey: bucketPrivateKey,
    encryptionKey: bucketEncryptionKey,
  };

  return tempBucketInfo;
};

const Buckets = () => {
  const [isloading, setIsLoading] = useState(false);
  const [newBucketModalVisible, setNewBucketModalVisible] = useState(false);
  const [newBucketInfo, setNewBucketInfo] = useState<IReadWriteBucketInfo>(
    generateNewBucketInfo()
  );

  const [readOnlyDecryptedBuckets, setReadOnlyDecryptedBuckets] =
    useState<IBuckets>({});
  const [readWriteDecryptedBuckets, setReadWriteDecryptedBuckets] =
    useState<IBuckets>({});

  const userState: IUserState = useSelector(selectUser);
  const bucketState: IBucketState = useSelector(selectBucket);

  const dispatch = useDispatch();
  const history = useHistory();

  const init = async () => {
    setIsLoading(true);
    try {
      const mySky: MySky = await getMySky();
      const allDecryptedBuckets = await getAllUserDecryptedBuckets(
        mySky,
        userState.buckets
      );

      setReadOnlyDecryptedBuckets(allDecryptedBuckets.readOnly);
      setReadWriteDecryptedBuckets(allDecryptedBuckets.readWrite);
    } catch (error) {
      message.error(error.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (
      Object.values(userState.buckets.readOnly).length > 0 ||
      Object.values(userState.buckets.readWrite).length > 0
    ) {
      init();
    }
  }, [userState.buckets]);

  const [visibleDrawer, setVisibleDrawer] = useState(false);
  const showDrawer = () => {
    setVisibleDrawer(true);
  };

  const closeDrawer = () => {
    setVisibleDrawer(false);
  };

  const openReadWriteBucket = (bucketID: string) => {
    if (bucketID in userState.buckets.readWrite) {
      const readWriteBucketInfo = userState.buckets.readWrite[bucketID];

      dispatch(
        setUserKeys({
          bucketPrivateKey: readWriteBucketInfo.privateKey,
          bucketEncryptionKey: readWriteBucketInfo.encryptionKey,
        })
      );

      history.push('/');
    }
  };

  const openReadOnlyBucket = (bucketID: string) => {
    if (bucketID in userState.buckets.readOnly) {
      const readOnlyBucketInfo = userState.buckets.readOnly[bucketID];
      history.push(
        `/v2/${readOnlyBucketInfo.publicKey}/${readOnlyBucketInfo.encryptionKey}`
      );
    }
  };

  const deleteReadWriteBucketUsingModal = async (bucketID: string) => {
    const mySky = await getMySky();
    dispatch(deleteReadWriteBucket(mySky, bucketID));
  };

  const deleteReadOnlyBucketUsingModal = async (bucketID: string) => {
    const mySky = await getMySky();
    dispatch(deleteReadOnlyBucket(mySky, bucketID));
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
      content: `Once you unpin a bucket, you will lose access to all the files it contains (unless you have the link saved somewhere).`,
      okText: 'Unpin',
      cancelText: 'Cancel',
      onOk: onDeleteBucketClick,
    });
  };

  const userNotLogged = (): boolean => {
    return userState.status === UserStatus.NotLogged;
  };

  const userLoading = (): boolean => {
    return userState.status === UserStatus.Loading;
  };

  return (
    <div
      className="default-margin buckets page"
      style={{ textAlign: 'center' }}
    >
      {userNotLogged() || userLoading() ? (
        <>
          <Title style={{ textAlign: 'left' }} level={4}>
            Buckets
          </Title>
          <Divider />
          <BucketIcon />
          <p>
            Buckets are SkyTransfer's most advanced feature. Thanks to them you
            can manage your content like never before.
          </p>
          <Divider />
          <p>
            Sign in with MySky, access your buckets and unclock the power of
            SkyTransfer.
          </p>
          <Button
            loading={userState.status === UserStatus.Loading}
            disabled={userState.status === UserStatus.Loading}
            onClick={() => dispatch(login())}
            type="primary"
            icon={<LoginOutlined />}
            size="middle"
          >
            Sign in with MySky
          </Button>
          <Divider />
          <p>Continue as anonymous user and create an anonymous bucket.</p>
          <Button
            icon={<InboxOutlined />}
            size="middle"
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
        </>
      ) : (
        <>
          <Row>
            <Col span={12} style={{ textAlign: 'left' }}>
              <Title level={4}>Buckets</Title>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <Button
                icon={<ProfileOutlined />}
                type="ghost"
                size="middle"
                onClick={showDrawer}
              >
                Manage account
              </Button>
            </Col>
          </Row>
          <Divider className="default-margin" orientation="right" />
          <BucketIcon />
          <div style={{ textAlign: 'center' }}>
            <p>
              Welcome to the buckets section where you can access previously
              created buckets.
            </p>
            <p>
              Buckets are like folders in which files are stored. Before files
              can be uploaded, a bucket must first be created.
            </p>
            <Divider />
            <Button
              icon={<InboxOutlined />}
              size="middle"
              type="primary"
              onClick={() => setNewBucketModalVisible(true)}
            >
              Create bucket
            </Button>
          </div>
          <Divider orientation="left">Read write buckets</Divider>
          <List
            style={{ textAlign: 'left' }}
            loading={isloading || bucketState.bucketIsLoading}
            bordered
            itemLayout="horizontal"
            dataSource={Object.values(readWriteDecryptedBuckets)}
            renderItem={(item) => (
              <>
                <List.Item>
                  <List.Item.Meta
                    title={item.name}
                    description={item.description}
                  />
                  <Button
                    style={{ marginRight: '8px' }}
                    type="ghost"
                    size="middle"
                    onClick={() => openReadWriteBucket(item.uuid)}
                    key={`open-${item.uuid}`}
                  >
                    open
                  </Button>
                  <Button
                    danger
                    type="ghost"
                    size="middle"
                    onClick={() => {
                      deleteBucketConfirmModal(() =>
                        deleteReadWriteBucketUsingModal(item.uuid)
                      );
                    }}
                    key={`delete-${item.uuid}`}
                  >
                    unpin
                  </Button>
                </List.Item>
              </>
            )}
          />

          <Divider orientation="left">Read only buckets</Divider>
          <List
            style={{ textAlign: 'left' }}
            loading={isloading || bucketState.bucketIsLoading}
            bordered
            itemLayout="horizontal"
            dataSource={Object.values(readOnlyDecryptedBuckets)}
            renderItem={(item) => (
              <>
                <List.Item>
                  <List.Item.Meta
                    title={item.name}
                    description={item.description}
                  />
                  <Button
                    style={{ marginRight: '8px' }}
                    type="ghost"
                    size="middle"
                    onClick={() => openReadOnlyBucket(item.uuid)}
                    key={`open-${item.uuid}`}
                  >
                    open
                  </Button>
                  <Button
                    danger
                    type="ghost"
                    size="middle"
                    onClick={() => {
                      deleteBucketConfirmModal(() => {
                        deleteReadOnlyBucketUsingModal(item.uuid);
                      });
                    }}
                    key={`delete-${item.uuid}`}
                  >
                    unpin
                  </Button>
                </List.Item>
              </>
            )}
          />
        </>
      )}
      <BucketModal
        bucketInfo={newBucketInfo}
        visible={newBucketModalVisible}
        onCancel={() => setNewBucketModalVisible(false)}
        isLoggedUser={userState.status === UserStatus.Logged}
        modalTitle="Create new bucket"
        onDone={(bucketInfo) => {
          history.push('/');
        }}
        onError={(e) => {
          console.error(e);
          setNewBucketModalVisible(false);
        }}
      />
      <Drawer
        title="User profile"
        placement="right"
        onClose={closeDrawer}
        visible={visibleDrawer}
      >
        <User></User>
      </Drawer>
    </div>
  );
};

export default Buckets;
