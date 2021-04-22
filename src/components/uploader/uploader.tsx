import './uploader.css';

import { useState, useRef, useEffect } from 'react';

import {
  EncryptionType,
  EncryptedFileReference,
} from '../../models/encryption';

import { isMobile } from 'react-device-detect';

import { v4 as uuid } from 'uuid';

import { Button, Alert, message, Modal, Upload, Spin, Tree, Empty, Divider } from 'antd';

import {
  CloudUploadOutlined,
  DownloadOutlined,
  DownOutlined,
  LoadingOutlined,
} from '@ant-design/icons';

import { UploadFile } from 'antd/lib/upload/interface';

import { renderTree } from '../../utils/walker';
import AESFileEncrypt from '../../crypto/file-encrypt';
import AESFileDecrypt from '../../crypto/file-decrypt';
import { MAX_PARALLEL_UPLOAD, UPLOAD_ENDPOINT } from '../../config';
import { TabsCards } from '../common/tabs-cards';
import QR from './qr';
import { ActivityBars } from './activity-bar';

import axios from 'axios';

import SessionManager from '../../session/session-manager';
import { useStateContext } from '../../state/state';
import { ActionType } from '../../state/reducer';
import { deriveEncryptionKeyFromKey } from '../../crypto/crypto';


import { getEncryptedFiles, storeEncryptedFiles } from '../../skynet/skynet';

const { DirectoryTree } = Tree;
const { Dragger } = Upload;
const { DownloadActivityBar, UploadActivityBar } = ActivityBars;

const useConstructor = (callBack = () => { }) => {
  const hasBeenCalled = useRef(false);
  if (hasBeenCalled.current) return;
  callBack();
  hasBeenCalled.current = true;
};

const sleep = (ms): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

let timeoutID = setTimeout(() => { }, 5000);

let uploadCount = 0;

const Uploader = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedEncryptedFiles, setUploadedEncryptedFiles] = useState<
    EncryptedFileReference[]
  >([]);
  const [toStoreInSkyDBCount, setToStoreInSkyDBCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showUploadCompletedModal, setShowUploadCompletedModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [uploadingInProgress, setUploadingInProgress] = useState(false);

  const { dispatch } = useStateContext();

  const initSession = async () => {
    const files = await getEncryptedFiles(
      SessionManager.sessionPublicKey,
      deriveEncryptionKeyFromKey(SessionManager.sessionPrivateKey),
    );
    if (!files) {
      setLoading(false);
      return;
    }

    dispatch({
      type: ActionType.READ_WRITE,
    });

    setUploadedEncryptedFiles((prev) => [...prev, ...files]);
    setLoading(false);
  };

  useConstructor(() => {
    initSession();
  });

  const copyReadOnlyLink = () => {
    navigator.clipboard.writeText(SessionManager.readOnlyLink);
    setUploadingInProgress(false);
    setShowUploadCompletedModal(false);
    message.info('SkyTransfer read only link copied');
  };

  const copyReadWriteLink = () => {
    navigator.clipboard.writeText(SessionManager.readWriteLink);
    setUploadingInProgress(false);
    setShowUploadCompletedModal(false);
    message.info('SkyTransfer read/write link copied');
  };

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

  const downloadFile = async (encryptedFile: EncryptedFileReference) => {
    const decrypt = new AESFileDecrypt(
      encryptedFile,
      deriveEncryptionKeyFromKey(SessionManager.sessionPrivateKey),
    );

    const file: File = await decrypt.decrypt(
      (completed, eProgress) => {
        setDecryptProgress(eProgress);
      },
      (completed, dProgress) => {
        setDownloadProgress(dProgress);
      }
    );

    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(file, encryptedFile.fileName);
    } else {
      var elem = window.document.createElement('a');
      elem.href = window.URL.createObjectURL(file);
      elem.download = file.name;
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);
    }
  };

  const [uploadingFileList, setUploadingFileList] = useState<UploadFile[]>([]);
  const [encryptionQueue, setEncryptionQueue] = useState<UploadFile[]>([]);

  useEffect(() => {
    if (uploadingFileList.length === 0 && toStoreInSkyDBCount === 0) {
      setUploading(false);
    }

    if (
      toStoreInSkyDBCount > 0 &&
      uploadedEncryptedFiles.length > 0 &&
      uploadingFileList.length === 0
    ) {
      clearInterval(timeoutID);
      timeoutID = setTimeout(async () => {
        try {
          message.loading('Syncing files in SkyDB...');
          await storeEncryptedFiles(
            SessionManager.sessionPrivateKey,
            deriveEncryptionKeyFromKey(SessionManager.sessionPrivateKey),
            uploadedEncryptedFiles,
          );

          message.success('Sync completed');
          setToStoreInSkyDBCount(0);
        } catch (error) {
          setErrorMessage('Could not sync session encrypted files: ' + error);
        }

        setShowUploadCompletedModal(true);
        setUploading(false);
      }, 5000);
    }
  }, [uploadingFileList, toStoreInSkyDBCount, uploadedEncryptedFiles]);

  useEffect(() => {
    setIsEncrypting(encryptionQueue.length !== 0);
  }, [encryptionQueue]);

  const queueParallelEncryption = (file: File): Promise<File> => {
    return new Promise(async (resolve) => {
      while (uploadCount > MAX_PARALLEL_UPLOAD) {
        await sleep(1000);
      }

      uploadCount++;

      const fe = new AESFileEncrypt(
        file,
        deriveEncryptionKeyFromKey(SessionManager.sessionPrivateKey),
      );
      resolve(
        fe.encrypt((completed, eProgress) => {
          setEncryptProgress(eProgress);
        })
      );
    });
  };

  const uploadFile = async (options) => {
    const { onSuccess, onError, file, onProgress } = options;

    setEncryptionQueue((prev) => [...prev, file]);
    const encryptedFile = await queueParallelEncryption(file);

    const formData = new FormData();
    formData.append('file', encryptedFile);

    const config = {
      headers: { 'content-type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        onProgress({ percent: (e.loaded / e.total) * 100 }, encryptedFile);
      },
    };

    axios
      .post(UPLOAD_ENDPOINT, formData, config)
      .then((res) => {
        onSuccess({
          data: res.data,
          encryptedFileSize: encryptedFile.size,
        });
      })
      .catch((err) => {
        onError(err);
      });
  };

  const draggerConfig = {
    name: 'file',
    multiple: true,
    action: UPLOAD_ENDPOINT,
    fileList: uploadingFileList,
    directory: !isMobile,
    showUploadList: {
      showRemoveIcon: true,
    },
    customRequest: uploadFile,
    openFileDialogOnClick: true,
    onChange(info) {
      setUploadingInProgress(true);
      setShowUploadCompletedModal(false);
      setUploading(true);
      setUploadingFileList(info.fileList.map((x) => x)); // Note: A new object must be used here!!!

      const { status } = info.file;

      // error | success | done | uploading | removed
      if (
        status === 'error' ||
        status === 'success' ||
        status === 'done' ||
        status === 'removed'
      ) {
        uploadCount--;
      }

      if (status === 'uploading') {
        setEncryptionQueue((prev) =>
          prev.filter((f) => f.uid !== info.file.uid)
        );
      }

      if (status === 'done') {
        const uploadedFile = info.fileList.find((f) => f.uid === info.file.uid);
        if (!uploadedFile) {
          message.error(
            `${info.file.name} "something really bad happened, contact the developer`
          );
        }

        const relativePath = info.file.originFileObj.webkitRelativePath
          ? info.file.originFileObj.webkitRelativePath
          : info.file.name;

        const tempFile: EncryptedFileReference = {
          uuid: uuid(),
          skylink: info.file.response.data.skylink,
          encryptionType: EncryptionType.AES,
          fileName: info.file.name,
          mimeType: info.file.type,
          relativePath: relativePath,
          size: info.file.size,
          encryptedSize: info.file.response.encryptedFileSize,
        };

        message.success(`${info.file.name} file uploaded successfully.`);

        setUploadedEncryptedFiles((prev) => [...prev, tempFile]);
        setToStoreInSkyDBCount((prev) => prev + 1);
        setUploadingFileList((prev) =>
          prev.filter((f) => f.uid !== info.file.uid)
        );
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onRemove(file): boolean {
      setUploadingFileList((prev) => prev.filter((f) => f.uid !== file.uid));
      return true;
    },
  };

  const loaderIcon = <LoadingOutlined style={{ fontSize: 24, color: "#20bf6b" }} spin />;

  const isLoading = uploading || loading;

  return (
    <>
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

      <TabsCards
        tabType="line"
        values={[
          {
            name: 'Upload file(s)',
            content: (
              <Dragger className="drop-container" {...draggerConfig} directory={false} multiple disabled={uploadingInProgress}>
                <div className="ant-upload-drag-icon logo">SkyTransfer</div>
                <p className="ant-upload-drag-icon">
                  <CloudUploadOutlined style={{ color: '#20bf6b' }} />
                </p>
                <p className="ant-upload-text">
                  {isMobile ? (
                    <span>Click here to upload</span>
                  ) : (
                    <span>Drag & Drop file(s) to upload</span>
                  )}
                </p>
                {isEncrypting ? (
                  <Spin tip="File encryption/upload started. Please wait ..." />
                ) : (
                  ''
                )}
                <UploadActivityBar
                  encryptProgress={encryptProgress}
                />
              </Dragger>
            ),
          },
          {
            name: 'Upload directory',
            content: (
              <Dragger className="drop-container" {...draggerConfig} directory={true} disabled={uploadingInProgress}>
                <div className="ant-upload-drag-icon logo">SkyTransfer</div>
                <p className="ant-upload-drag-icon">
                  <CloudUploadOutlined style={{ color: '#20bf6b' }} />
                </p>
                <p className="ant-upload-text">
                  {isMobile ? (
                    <span>Click here to upload</span>
                  ) : (
                    <span>Drag & Drop directory here to upload</span>
                  )}
                </p>
                {isEncrypting ? (
                  <Spin tip="File encryption/upload started. Please wait ..." />
                ) : (
                  ''
                )}
                <UploadActivityBar
                  encryptProgress={encryptProgress}
                />
              </Dragger>
            ),
          },
        ]}
      />

      {uploadedEncryptedFiles.length > 0 ? (
        <div className="file-list default-margin">
          <DownloadActivityBar
            decryptProgress={decryptProgress}
            downloadProgress={downloadProgress}
          />
          {
            isLoading && (
              <div style={{ textAlign: 'center' }}>
                <Spin style={{ marginRight: "8px" }} indicator={loaderIcon} />Sync in progress...
              </div>
            )
          }
          <Divider>Uploaded files</Divider>
          <DirectoryTree
            multiple
            showIcon={false}
            showLine
            className="file-tree default-margin"
            disabled={isLoading}
            defaultExpandAll={true}
            switcherIcon={<DownOutlined className="directory-switcher" />}
            onSelect={(selectedKeys, info) => {
              if (info.node.children && info.node.children.length !== 0) {
                return; // it is a folder
              }

              /* 
                TODO: use utils.fileSize(item.size) to add more file info
              */

              const key: string = `${info.node.key}`;
              const ff = uploadedEncryptedFiles.find(
                (f) => f.uuid === key.split('_')[0]
              );
              if (ff) {
                message.loading(`Download and decryption started`);
                downloadFile(ff);
              }
            }}
            treeData={renderTree(uploadedEncryptedFiles)}
          />
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="">
          {loading ? <Spin /> : <span>No uploaded data</span>}
        </Empty>
      )}

      {!isLoading && uploadedEncryptedFiles.length > 0 && (
        <div style={{ textAlign: 'center' }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size="large"
            onClick={async () => {
              message.loading(`Download and decryption started`);
              for (const encyptedFile of uploadedEncryptedFiles) {
                await downloadFile(encyptedFile);
              }
            }}
          >
            Download all files
          </Button>
        </div>
      )}

      <Modal
        title="Upload completed"
        centered
        visible={showUploadCompletedModal}
        cancelText="Continue"
        onCancel={() => {
          setShowUploadCompletedModal(false);
          setUploadingInProgress(false);
        }}
        footer={null}
      >
        <p>
          Your <strong>SkyTransfer</strong> is ready. Your files have been
          correctly encrytypted and uploaded on Skynet. Copy and share your
          SkyTransfer link or just continue uploading. When you share a
          read/write link, others can add files to your SkyTransfer. Read only
          links allow file download without editing.
        </p>

        <TabsCards
          values={[
            {
              name: 'Read-write link',
              content: (
                <QR
                  qrValue={SessionManager.readWriteLink}
                  linkOnClick={copyReadWriteLink}
                />
              ),
            },
            {
              name: 'Read-only link',
              content: (
                <QR
                  qrValue={SessionManager.readOnlyLink}
                  linkOnClick={copyReadOnlyLink}
                />
              ),
            },
          ]}
        />
      </Modal>
    </>
  );
};

export default Uploader;
