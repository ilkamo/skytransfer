import './uploader.css';

import { useEffect, useState } from 'react';

import { EncryptionType } from '../../models/encryption';

import { isMobile } from 'react-device-detect';

import { v4 as uuid } from 'uuid';

import {
  Alert,
  Badge,
  Button,
  Divider,
  Empty,
  message,
  Modal,
  Spin,
  Tree,
  Upload,
} from 'antd';

import {
  DownloadOutlined,
  DownOutlined,
  FolderAddOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';

import { UploadFile } from 'antd/lib/upload/interface';

import { renderTree } from '../../utils/walker';
import {
  DEFAULT_ENCRYPTION_TYPE,
  MAX_PARALLEL_UPLOAD,
  MIN_SKYDB_SYNC_FACTOR,
  SKYDB_SYNC_FACTOR,
} from '../../config';
import { TabsCards } from '../common/tabs-cards';
import { ActivityBars } from './activity-bar';

import {
  encryptAndStoreBucket,
  getDecryptedBucket,
  getMySky,
  uploadFile,
} from '../../skynet/skynet';
import { DraggerContent } from './dragger-content';
import { ShareModal } from '../common/share-modal';
import { DirectoryTreeLine } from '../common/directory-tree-line/directory-tree-line';
import { IEncryptedFile } from '../../models/files/encrypted-file';
import {
  DecryptedBucket,
  IBucket,
  IReadWriteBucketInfo,
} from '../../models/files/bucket';
import { IFileData } from '../../models/files/file-data';
import { genKeyPairAndSeed } from 'skynet-js';
import { ChunkResolver } from '../../crypto/chunk-resolver';

import { addReadWriteBucket, selectUser } from '../../features/user/user-slice';
import { useDispatch, useSelector } from 'react-redux';
import { publicKeyFromPrivateKey } from '../../crypto/crypto';
import { IUserState, UserStatus } from '../../models/user';
import { BucketModal } from '../common/bucket-modal';
import { BucketInformation } from '../common/bucket-information';
import {
  IBucketState,
  selectBucket,
  setUserKeys,
} from '../../features/bucket/bucket-slice';

import { proxy, wrap } from 'comlink';
import type { WorkerApi } from '../../workers/worker';

const { DirectoryTree } = Tree;
const { Dragger } = Upload;
const { DownloadActivityBar, UploadActivityBar } = ActivityBars;

const sleep = (ms): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

let uploadCount = 0;
let skydbSyncInProgress = false;

const generateRandomDecryptedBucket = (): DecryptedBucket => {
  const randName = (Math.random() + 1).toString(36).substring(7);
  return new DecryptedBucket({
    uuid: uuid(),
    name: `skytransfer-${randName}`,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    files: {},
    created: Date.now(),
    modified: Date.now(),
  });
};

const workerURL = '../../workers/worker.ts';

const Uploader = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [decryptedBucket, setDecryptedBucket] = useState<DecryptedBucket>();

  const [toStoreInSkyDBCount, setToStoreInSkyDBCount] = useState(0);
  const [toRemoveFromSkyDBCount, setToRemoveFromSkyDBCount] = useState(0);

  const [uploading, setUploading] = useState(false);
  const [showShareBucketModal, setShowShareBucketModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uidsOfErrorFiles, setUidsOfErrorFiles] = useState<string[]>([]);
  const [fileListToUpload, setFileListToUpload] = useState<UploadFile[]>([]);

  const [editBucketModalVisible, setEditBucketModalVisible] = useState(false);
  const [bucketInfo, setBucketInfo] = useState<IReadWriteBucketInfo>();

  const dispatch = useDispatch();

  const userState: IUserState = useSelector(selectUser);
  const bucketState: IBucketState = useSelector(selectBucket);

  const closeShareBucketModal = () => {
    setShowShareBucketModal(false);
  };

  const loadBucket = async () => {
    let bucket: IBucket = await getDecryptedBucket(
      publicKeyFromPrivateKey(bucketState.privateKey),
      bucketState.encryptionKey
    );

    let decryptedBucket = generateRandomDecryptedBucket();
    if (bucket) {
      decryptedBucket = new DecryptedBucket(bucket);
    } else {
      /* 
        Bucket can't be loaded and the reason could be a Skynet issue. 
        Generate a new set of keys in order to create a new bucket and be sure that no existing
        bucket will be overwritten.
      */
      const privateKey = genKeyPairAndSeed().privateKey;
      const encryptionKey = genKeyPairAndSeed().privateKey;
      await encryptAndStoreBucket(privateKey, encryptionKey, decryptedBucket);
      dispatch(
        setUserKeys({
          bucketPrivateKey: privateKey,
          bucketEncryptionKey: encryptionKey,
        })
      );
    }

    setBucketInfo({
      bucketID: decryptedBucket.uuid,
      privateKey: bucketState.privateKey,
      encryptionKey: bucketState.encryptionKey,
    });

    setDecryptedBucket(new DecryptedBucket(decryptedBucket));
    setLoading(false);
  };

  useEffect(() => {
    if (bucketState.encryptionKey !== null) {
      loadBucket();
    }
  }, [bucketState.encryptionKey]);

  const updateFilesInSkyDB = async () => {
    setLoading(true);
    skydbSyncInProgress = true;
    try {
      message.loading('Syncing files in SkyDB...');
      await encryptAndStoreBucket(
        bucketState.privateKey,
        bucketState.encryptionKey,
        decryptedBucket
      );

      message.success('Sync completed');
      setToStoreInSkyDBCount(0);
      setToRemoveFromSkyDBCount(0);
    } catch (error) {
      setErrorMessage('Could not sync session encrypted files: ' + error);
    }

    skydbSyncInProgress = false;
    setLoading(false);
  };

  const skyDBSyncer = async () => {
    const stillInProgressFilesCount =
      fileListToUpload.length - uidsOfErrorFiles.length;

    const intervalSkyDBSync =
      toStoreInSkyDBCount > SKYDB_SYNC_FACTOR &&
      stillInProgressFilesCount > MIN_SKYDB_SYNC_FACTOR;

    const uploadCompletedSkyDBSync =
      toStoreInSkyDBCount > 0 &&
      Object.keys(decryptedBucket.files).length > 0 &&
      stillInProgressFilesCount === 0;

    const fileListEditedSkyDBSync =
      toRemoveFromSkyDBCount > 0 && stillInProgressFilesCount === 0;

    if (stillInProgressFilesCount === 0 && toStoreInSkyDBCount === 0) {
      setUploading(false);
    }

    if (
      !skydbSyncInProgress &&
      (intervalSkyDBSync || uploadCompletedSkyDBSync || fileListEditedSkyDBSync)
    ) {
      await updateFilesInSkyDB();

      if (uploadCompletedSkyDBSync) {
        setShowShareBucketModal(true);
      }
    }
  };

  useEffect(() => {
    skyDBSyncer();
  });

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [decryptProgress, setDecryptProgress] = useState(0);
  const [encryptProgress, setEncryptProgress] = useState(0);

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

  useEffect(() => {
    if (encryptProgress === 100) {
      setTimeout(() => {
        setEncryptProgress(0);
      }, 500);
    }
  }, [encryptProgress]);

  const downloadFile = async (encryptedFile: IEncryptedFile) => {
    const worker = new Worker(new URL(workerURL));
    const service = wrap<WorkerApi>(worker);

    const url = await service.decryptFile(
      encryptedFile,
      proxy(setDecryptProgress),
      proxy(setDownloadProgress)
    );
    if (url.startsWith('error')) {
      message.error(url);
      return;
    }

    const elem = window.document.createElement('a');
    elem.href = url;
    elem.download = encryptedFile.name;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
  };

  const queueParallelEncryption = (options): Promise<File> => {
    return new Promise(async (resolve) => {
      while (uploadCount > MAX_PARALLEL_UPLOAD) {
        await sleep(1000);
      }

      uploadCount++;

      const { onSuccess, onError, file, onProgress } = options;

      const uploadFileFunc = async (f) => {
        await uploadFile(f, fileKey, onProgress, onSuccess, onError);
      };

      const worker = new Worker(new URL(workerURL));
      const service = wrap<WorkerApi>(worker);

      const fileKey = genKeyPairAndSeed().privateKey;
      resolve(
        service.encryptFile(
          file,
          fileKey,
          proxy(uploadFileFunc),
          proxy(setEncryptProgress)
        )
      );
    });
  };

  const queueAndUploadFile = async (options) => {
    await queueParallelEncryption(options);
  };

  const draggerConfig = {
    name: 'file',
    multiple: true,
    fileList: fileListToUpload,
    directory: !isMobile,
    showUploadList: {
      showRemoveIcon: true,
    },
    customRequest: queueAndUploadFile,
    openFileDialogOnClick: true,
    onChange(info) {
      setShowShareBucketModal(false);
      setUploading(true);

      setFileListToUpload(info.fileList.map((x) => x)); // Note: A new object must be used here!!!

      const { status } = info.file;

      // error | success | done | uploading | removed
      switch (status) {
        case 'removed': {
          if (
            uidsOfErrorFiles.findIndex((uid) => uid === info.file.uid) === -1
          ) {
            uploadCount--;
          }
          setUidsOfErrorFiles((p) => p.filter((uid) => uid !== info.file.uid));
          setFileListToUpload((prev) =>
            prev.filter((f) => f.uid !== info.file.uid)
          );
          break;
        }
        case 'error': {
          uploadCount--;
          setUidsOfErrorFiles((p) => [...p, info.file.uid]);
          message.error(`${info.file.name} file upload failed.`);
          break;
        }
        case 'done': {
          const relativePath = info.file.originFileObj.webkitRelativePath
            ? info.file.originFileObj.webkitRelativePath
            : info.file.name;

          const cr = new ChunkResolver(DEFAULT_ENCRYPTION_TYPE);

          const tempFileData: IFileData = {
            uuid: uuid(),
            size: info.file.size,
            chunkSize: cr.decryptChunkSize,
            encryptionType: EncryptionType[DEFAULT_ENCRYPTION_TYPE],
            url: info.file.response.data.skylink,
            key: info.file.response.fileKey,
            hash: '', // TODO: add hash
            ts: Date.now(),
            encryptedSize: info.file.response.encryptedFileSize,
            relativePath: relativePath,
          };

          if (decryptedBucket.encryptedFileExists(relativePath)) {
            setDecryptedBucket((p) => {
              const f = p.files[relativePath];
              f.modified = Date.now();
              f.name = info.file.name;
              f.file = tempFileData;
              f.history.push(tempFileData);
              f.version++;

              return p;
            });
          } else {
            const encryptedFile: IEncryptedFile = {
              uuid: uuid(),
              file: tempFileData,
              created: Date.now(),
              name: info.file.name,
              modified: Date.now(),
              mimeType: info.file.type,
              history: [tempFileData],
              version: 0,
            };

            setDecryptedBucket((p) => {
              p.files[relativePath] = encryptedFile;
              p.modified = Date.now();
              return p;
            });
          }

          message.success(`${info.file.name} file uploaded successfully.`);

          setToStoreInSkyDBCount((prev) => prev + 1);
          uploadCount--;
          setFileListToUpload((prev) =>
            prev.filter((f) => f.uid !== info.file.uid)
          );
          break;
        }
      }
    },
  };

  const deleteConfirmModal = (filename: string, onDeleteClick: () => void) => {
    Modal.confirm({
      title: 'Warning',
      icon: <QuestionCircleOutlined />,
      content: `File ${filename} will be deleted. Are you sure?`,
      okText: 'Delete',
      cancelText: 'Cancel',
      onOk: onDeleteClick,
    });
  };

  const loaderIcon = (
    <LoadingOutlined style={{ fontSize: 24, color: '#20bf6b' }} spin />
  );

  const getFileBy = (key: string): IEncryptedFile => {
    for (let path in decryptedBucket.files) {
      if (decryptedBucket.files[path].uuid === key.split('_')[0]) {
        return decryptedBucket.files[path];
      }
    }
  };

  const bucketHasFiles =
    decryptedBucket &&
    decryptedBucket.files &&
    Object.keys(decryptedBucket.files).length > 0;

  const pinBucket = async (bucketID: string) => {
    const mySky = await getMySky();
    dispatch(
      addReadWriteBucket(mySky, {
        privateKey: bucketState.privateKey,
        encryptionKey: bucketState.encryptionKey,
        bucketID,
      })
    );

    // TODO: Handle errors from skynet methods
  };

  const isUserLogged = (): boolean => {
    return userState.status === UserStatus.Logged;
  };

  const isBucketPinned = (bucketID: string): boolean => {
    return isUserLogged() && bucketID in userState.buckets.readWrite;
  };

  const isLoading = uploading || loading;
  return (
    <div className="page">
      {errorMessage ? (
        <Alert
          className="error-message"
          message={errorMessage}
          type="error"
          showIcon
        />
      ) : (
        ''
      )}

      {decryptedBucket && decryptedBucket.files && (
        <>
          {isBucketPinned(decryptedBucket.uuid) && (
            <Badge.Ribbon text="Pinned" color="green" />
          )}
          <BucketInformation
            bucket={decryptedBucket}
            onEdit={() => setEditBucketModalVisible(true)}
          />
        </>
      )}

      <TabsCards
        tabType="line"
        values={[
          {
            name: 'Upload file(s)',
            content: (
              <div style={{ paddingBottom: '4px' }}>
                <Dragger
                  className="drop-container"
                  {...draggerConfig}
                  directory={false}
                  multiple
                  disabled={uploading}
                >
                  <DraggerContent
                    onlyClickable={isMobile}
                    draggableMessage="Drag & Drop file(s) to upload"
                  />
                  <UploadActivityBar encryptProgress={encryptProgress} />
                </Dragger>
              </div>
            ),
          },
          {
            name: 'Upload directory',
            content: (
              <div style={{ paddingBottom: '4px' }}>
                <Dragger
                  className="drop-container"
                  {...draggerConfig}
                  directory={true}
                  disabled={uploading}
                >
                  <DraggerContent
                    onlyClickable={isMobile}
                    draggableMessage="Drag & Drop directory here to upload"
                  />
                  <UploadActivityBar encryptProgress={encryptProgress} />
                </Dragger>
              </div>
            ),
          },
        ]}
      />

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

      {bucketInfo && decryptedBucket && (
        <BucketModal
          bucket={decryptedBucket}
          bucketInfo={bucketInfo}
          visible={editBucketModalVisible}
          onCancel={() => setEditBucketModalVisible(false)}
          isLoggedUser={isUserLogged()}
          modalTitle="Edit bucket"
          onDone={(bucketInfo, bucket) => {
            setBucketInfo(bucketInfo);
            setDecryptedBucket((p) => {
              p.description = bucket.description;
              p.name = bucket.name;
              p.modified = bucket.modified;
              return p;
            });
            setEditBucketModalVisible(false);
          }}
          onError={(e) => {
            console.error(e);
            setEditBucketModalVisible(false);
          }}
        />
      )}

      {bucketHasFiles ? (
        <div className="file-list default-margin">
          <DownloadActivityBar
            decryptProgress={decryptProgress}
            downloadProgress={downloadProgress}
          />
          {isLoading && (
            <div style={{ textAlign: 'center' }}>
              <Spin style={{ marginRight: '8px' }} indicator={loaderIcon} />
              Sync in progress...
            </div>
          )}
          <Divider>{decryptedBucket.name}</Divider>
          <DirectoryTree
            multiple
            showIcon={false}
            showLine
            className="file-tree default-margin"
            disabled={isLoading}
            defaultExpandAll={true}
            switcherIcon={<DownOutlined className="directory-switcher" />}
            treeData={renderTree(decryptedBucket.files)}
            selectable={false}
            titleRender={(node) => {
              const key: string = `${node.key}`;
              const encryptedFile = getFileBy(key);
              return encryptedFile ? (
                <DirectoryTreeLine
                  disabled={isLoading}
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
                  onDeleteClick={() => {
                    deleteConfirmModal(node.title.toString(), () => {
                      setDecryptedBucket((p) => {
                        for (let path in decryptedBucket.files) {
                          if (
                            decryptedBucket.files[path].uuid ===
                            key.split('_')[0]
                          ) {
                            delete decryptedBucket.files[path];
                          }
                        }
                        return p;
                      });
                      setToRemoveFromSkyDBCount((prev) => prev + 1);
                    });
                  }}
                />
              ) : (
                ''
              );
            }}
          />
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="">
          {loading ? <Spin /> : <span>No uploaded data</span>}
        </Empty>
      )}

      {!isLoading && bucketHasFiles && (
        <div style={{ textAlign: 'center' }}>
          <Button
            icon={<DownloadOutlined />}
            size="middle"
            type="primary"
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
      )}
      <ShareModal
        title="Share bucket"
        visible={showShareBucketModal}
        onCancel={() => {
          setShowShareBucketModal(false);
        }}
        header={
          <p>
            Copy the link and share the bucket or just continue uploading. When
            you share the bucket draft (writeable), others can edit it.
          </p>
        }
        shareLinkOnClick={closeShareBucketModal}
        shareDraftLinkOnClick={closeShareBucketModal}
      />
    </div>
  );
};

export default Uploader;
