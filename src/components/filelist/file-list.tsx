import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useHistory } from 'react-router-dom';

import { Button, Empty, Divider, message, Tree, Spin, Badge } from 'antd';
import {
  DownloadOutlined,
  DownOutlined,
  FolderAddOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { renderTree } from '../../utils/walker';
import Xchacha20poly1305Decrypt from '../../crypto/xchacha20poly1305-decrypt';
import { getDecryptedBucket, getMySky } from '../../skynet/skynet';

import { ActivityBars } from '../uploader/activity-bar';

import { DirectoryTreeLine } from '../common/directory-tree-line/directory-tree-line';
import { IBucket, DecryptedBucket } from '../../models/files/bucket';
import { IEncryptedFile } from '../../models/files/encrypted-file';

import { useDispatch, useSelector } from 'react-redux';
import { BucketInformation } from '../common/bucket-information';
import {
  IBucketState,
  selectBucket,
  setUserKeys,
} from '../../features/bucket/bucket-slice';
import { ShareModal } from '../common/share-modal';
import { addReadOnlyBucket, selectUser } from '../../features/user/user-slice';
import { IUserState, UserStatus } from '../../models/user';

const { DownloadActivityBar } = ActivityBars;

const { DirectoryTree } = Tree;

const useConstructor = (callBack = () => {}) => {
  const hasBeenCalled = useRef(false);
  if (hasBeenCalled.current) return;
  callBack();
  hasBeenCalled.current = true;
};

const FileList = () => {
  const { transferKey, encryptionKey } = useParams();
  const [loading, setlLoading] = useState(true);
  const [showShareBucketModal, setShowShareBucketModal] = useState(false);
  const history = useHistory();
  const dispatch = useDispatch();

  const [decryptedBucket, setDecryptedBucket] = useState<IBucket>();

  const userState: IUserState = useSelector(selectUser);
  const bucketState: IBucketState = useSelector(selectBucket);

  useConstructor(async () => {
    if (transferKey && transferKey.length === 128) {
      dispatch(
        setUserKeys({
          bucketPrivateKey: transferKey,
          bucketEncryptionKey: encryptionKey,
        })
      );
      history.push('/');
    }

    // transferKey is a publicKey
    const bucket: IBucket = await getDecryptedBucket(
      transferKey,
      encryptionKey
    );
    if (!bucket) {
      setlLoading(false);
      return;
    }

    setDecryptedBucket(new DecryptedBucket(bucket));
    setlLoading(false);
  });

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [decryptProgress, setDecryptProgress] = useState(0);

  useEffect(() => {
    if (downloadProgress === 100) {
      setTimeout(() => {
        setDownloadProgress(0);
      }, 500);
    }
  }, [downloadProgress]);

  useEffect(() => {
    if (decryptProgress === 100) {
      setTimeout(() => {
        setDecryptProgress(0);
      }, 500);
    }
  }, [decryptProgress]);

  const downloadFile = async (encryptedFile: IEncryptedFile) => {
    const decrypt = new Xchacha20poly1305Decrypt(encryptedFile);
    let file: File;
    try {
      file = await decrypt.decrypt(
        (completed, eProgress) => {
          setDecryptProgress(eProgress);
        },
        (completed, dProgress) => {
          setDownloadProgress(dProgress);
        }
      );
    } catch (error) {
      message.error(error.message);
    }

    if (!file) {
      return;
    }

    var elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(file);
    elem.download = file.name;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
  };

  const getFileBy = (key: string): IEncryptedFile => {
    for (let path in decryptedBucket.files) {
      if (decryptedBucket.files[path].uuid === key.split('_')[0]) {
        return decryptedBucket.files[path];
      }
    }

    throw Error('could not find the file');
  };

  const bucketHasFiles =
    decryptedBucket &&
    decryptedBucket.files &&
    Object.keys(decryptedBucket.files).length > 0;

  const closeShareBucketModal = () => {
    setShowShareBucketModal(false);
  };

  const pinBucket = async (bucketID: string) => {
    if (!bucketHasFiles) {
      message.error('Could not pin an empty bucket. Please upload some files.');
      return;
    }

    const mySky = await getMySky();
    dispatch(
      addReadOnlyBucket(mySky, {
        publicKey: transferKey,
        encryptionKey: encryptionKey,
        bucketID,
      })
    );
  };

  const isUserLogged = (): boolean => {
    return userState.status === UserStatus.Logged;
  };

  const isBucketPinned = (bucketID: string): boolean => {
    return isUserLogged() && bucketID in userState.buckets.readOnly;
  };

  return (
    <div className="page">
      {decryptedBucket && decryptedBucket.files && (
        <>
          {isBucketPinned(decryptedBucket.uuid) && (
            <Badge.Ribbon text="Pinned" color="green" />
          )}
          <BucketInformation bucket={decryptedBucket} />
        </>
      )}

      <div style={{ textAlign: 'center' }}>
        <Button
          style={{ marginTop: '20px' }}
          type="ghost"
          size="middle"
          onClick={() => setShowShareBucketModal(true)}
          icon={<ShareAltOutlined />}
        >
          Share bucket
        </Button>
        {decryptedBucket && isUserLogged() && (
          <Button
            style={{ marginTop: '20px' }}
            disabled={
              isBucketPinned(decryptedBucket.uuid) ||
              bucketState.bucketIsLoading
            }
            loading={bucketState.bucketIsLoading}
            type="ghost"
            size="middle"
            onClick={() => pinBucket(decryptedBucket.uuid)}
            icon={<FolderAddOutlined />}
          >
            {isBucketPinned(decryptedBucket.uuid)
              ? 'Already pinned'
              : 'Pin bucket'}
          </Button>
        )}
      </div>

      <Divider orientation="left">Shared files</Divider>
      {bucketHasFiles ? (
        <>
          <div className="file-list">
            <DownloadActivityBar
              downloadProgress={downloadProgress}
              decryptProgress={decryptProgress}
            />
            <Divider>{decryptedBucket.name}</Divider>
            <DirectoryTree
              multiple
              showIcon={false}
              showLine
              className="file-tree default-margin"
              defaultExpandAll={true}
              switcherIcon={<DownOutlined className="directory-switcher" />}
              treeData={renderTree(decryptedBucket.files)}
              selectable={false}
              titleRender={(node) => {
                const key: string = `${node.key}`;
                const encryptedFile = getFileBy(key);
                return encryptedFile ? (
                  <DirectoryTreeLine
                    disabled={false}
                    isLeaf={node.isLeaf}
                    name={node.title.toString()}
                    updatedAt={encryptedFile.created}
                    onDownloadClick={() => {
                      if (!node.isLeaf) {
                        return;
                      }
                      if (encryptedFile) {
                        message.loading(`Download and decryption started`);
                        downloadFile(encryptedFile);
                      }
                    }}
                  />
                ) : (
                  ''
                );
              }}
            />
          </div>
          <div className="default-margin" style={{ textAlign: 'center' }}>
            <Button
              icon={<DownloadOutlined />}
              size="middle"
              onClick={async () => {
                message.loading(`Download and decryption started`);
                for (const encyptedFile in decryptedBucket.files) {
                  const file = decryptedBucket.files[encyptedFile];
                  await downloadFile(file);
                }
              }}
            >
              Download all files
            </Button>
          </div>
        </>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="">
          {loading ? <Spin /> : <span>No shared data found</span>}
        </Empty>
      )}
      <ShareModal
        title="Share bucket"
        visible={showShareBucketModal}
        onCancel={() => {
          setShowShareBucketModal(false);
        }}
        header={<p>Copy the link and share the bucket.</p>}
        shareLinkOnClick={closeShareBucketModal}
        shareDraftLinkOnClick={closeShareBucketModal}
      />
    </div>
  );
};

export default FileList;
