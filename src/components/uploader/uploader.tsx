import './uploader.css';

import { useState, useRef, useEffect } from 'react';
import { genKeyPairAndSeed } from 'skynet-js';
import {
  EncryptionType,
  EncryptedFileReference,
} from '../../models/encryption';
import Utils from '../../utils/utils';

import { isMobile } from 'react-device-detect';

import { v4 as uuid } from 'uuid';

import {
  Button,
  Alert,
  message,
  Modal,
  Menu,
  Upload,
  Spin,
  Tree,
  Empty,
} from 'antd';

import {
  CloudUploadOutlined,
  DeleteOutlined,
  CopyOutlined,
  DownOutlined,
} from '@ant-design/icons';

import { UploadFile } from 'antd/lib/upload/interface';

import { renderTree } from '../../utils/walker';
import { FileRelativePathInfo } from '../../models/file-tree';
import AESFileEncrypt from '../crypto/encrypt';
import AESFileDecrypt from '../crypto/decrypt';
import {
  MAX_PARALLEL_UPLOAD,
  SESSION_KEY_NAME,
  UPLOAD_ENDPOINT,
} from '../../config';

const { DirectoryTree } = Tree;
const { Dragger } = Upload;

const useConstructor = (callBack = () => {}) => {
  const hasBeenCalled = useRef(false);
  if (hasBeenCalled.current) return;
  callBack();
  hasBeenCalled.current = true;
};

const sleep = (ms): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

let timeoutID = setTimeout(() => {}, 5000);

let uploadCount = 0;

const utils: Utils = new Utils();

const Uploader = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionPublicKey, setSessionPublicKey] = useState('');
  const [sessionPrivateKey, setSessionPrivateKey] = useState('');
  const [uploadedEncryptedFiles, setUploadedEncryptedFiles] = useState<
    EncryptedFileReference[]
  >([]);
  const [toStoreInSkyDBCount, setToStoreInSkyDBCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEncrypting, setIsEncrypting] = useState(false);

  const [encryptionKey, setEncryptionKey] = useState('');

  const publicKeyFromPrivateKey = (privateKey: string): string => {
    return privateKey.substr(privateKey.length - 64);
  };

  const initSession = async () => {
    const sessionKey = localStorage.getItem(SESSION_KEY_NAME);
    if (sessionKey) {
      setSessionPublicKey(publicKeyFromPrivateKey(sessionKey));
      setSessionPrivateKey(sessionKey);
      setEncryptionKey(utils.generateEncryptionKey(sessionKey));

      const files = await utils.getSessionEncryptedFiles(
        publicKeyFromPrivateKey(sessionKey)
      );
      if (!files) {
        setLoading(false);
        return;
      }

      setUploadedEncryptedFiles((prev) => [...prev, ...files]);
      setLoading(false);
    } else {
      const { publicKey, privateKey } = genKeyPairAndSeed();
      setSessionPublicKey(publicKey);
      setSessionPrivateKey(privateKey);
      setEncryptionKey(utils.generateEncryptionKey(privateKey));
      localStorage.setItem(SESSION_KEY_NAME, privateKey);
      setLoading(false);
    }
  };

  useConstructor(() => {
    initSession();
  });

  const getReadOnlyLink = () => {
    return `${window.location.hostname}/#/${sessionPublicKey}/${encryptionKey}`;
  };
  const getReadWriteLink = () => {
    return `${window.location.hostname}/#/${sessionPrivateKey}/${encryptionKey}`;
  };

  const copyReadOnlyLink = () => {
    navigator.clipboard.writeText(getReadOnlyLink());
    setUploadCompleted(false);
    message.info('SkyTransfer read only link copied');
  };

  const copyReadWriteLink = () => {
    navigator.clipboard.writeText(getReadWriteLink());
    setUploadCompleted(false);
    message.info('SkyTransfer read/write link copied');
  };

  const destroySession = () => {
    localStorage.removeItem(SESSION_KEY_NAME);
    window.location.reload();
  };

  const downloadFile = async (encryptedFile: EncryptedFileReference) => {
    const decrypt = new AESFileDecrypt(encryptedFile, encryptionKey);

    const file: File = await decrypt.decrypt();

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

  const [
    fileRelativePaths,
    setFileRelativePaths,
  ] = useState<FileRelativePathInfo>({});
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
          await utils.storeSessionEncryptedFiles(
            sessionPrivateKey,
            uploadedEncryptedFiles
          );

          message.success('Sync completed');
          setToStoreInSkyDBCount(0);
        } catch (error) {
          setErrorMessage('Could not sync session encrypted files: ' + error);
        }

        setUploadCompleted(true);
        setUploading(false);
      }, 5000);
    }
  }, [
    uploadingFileList,
    toStoreInSkyDBCount,
    uploadedEncryptedFiles,
    sessionPrivateKey,
  ]);

  useEffect(() => {
    if (encryptionQueue.length === 0) {
      setIsEncrypting(false);
    } else {
      setIsEncrypting(true);
    }
  }, [encryptionQueue]);

  const queueParallelUpload = (file: File): Promise<File> => {
    return new Promise(async (resolve) => {
      while (uploadCount > MAX_PARALLEL_UPLOAD) {
        await sleep(1000);
      }

      uploadCount++;

      const fe = new AESFileEncrypt(file, encryptionKey);
      resolve(fe.encrypt());
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
    openFileDialogOnClick: isMobile ? true : false,
    onChange(info) {
      setUploadCompleted(false);
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

        const relativePath = fileRelativePaths.hasOwnProperty(info.file.uid)
          ? fileRelativePaths[info.file.uid]
          : info.file.name;

        const tempFile: EncryptedFileReference = {
          uuid: uuid(),
          skylink: info.file.response.skylink,
          encryptionType: EncryptionType.AES,
          fileName: info.file.name,
          mimeType: info.file.type,
          relativePath: relativePath,

          size: info.file.size, // TODO: use original file size
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
    beforeUpload(file, filelist): boolean | Promise<File> {
      setEncryptionQueue((prev) => [...prev, file]);

      /* 
        This is a support structure for storing webkitRelativePath.
        This field is missing after file is encrypted because it is a read only prop.
      */
      setFileRelativePaths((prev) => {
        const temp = {};
        temp[file.uid] = file.webkitRelativePath
          ? file.webkitRelativePath
          : file.name;
        return { ...prev, ...temp };
      });

      return queueParallelUpload(file);
    },
    onRemove(file): boolean {
      setUploadingFileList((prev) => prev.filter((f) => f.uid !== file.uid));
      return true;
    },
  };

  const isLoading = uploading || loading;

  return (
    <div className="container">
      <Menu className="default-margin" selectedKeys={[]} mode="horizontal">
        <Menu.Item
          key="copy-read-write"
          onClick={copyReadWriteLink}
          icon={<CopyOutlined />}
        >
          Read/write link
        </Menu.Item>
        <Menu.Item
          key="copy-read-only"
          onClick={copyReadOnlyLink}
          icon={<CopyOutlined />}
        >
          Read only link
        </Menu.Item>
        <Menu.Item
          key="new-session"
          onClick={destroySession}
          icon={<DeleteOutlined />}
        >
          New session
        </Menu.Item>
        <Menu.Item key="about-us" disabled icon={<CopyOutlined />}>
          About SkyTransfer
        </Menu.Item>
      </Menu>
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

      <Dragger {...draggerConfig}>
        <p className="ant-upload-drag-icon">
          <CloudUploadOutlined /* style={{ color: '#27ae60' }} */ />
        </p>
        <p className="ant-upload-text">
          {isMobile ? (
            <span>Click here to upload</span>
          ) : (
            <span>Drag & Drop files/folders here to upload</span>
          )}
        </p>
        {isEncrypting ? (
          <Spin tip="File encryption/upload started. Please wait ..." />
        ) : (
          ''
        )}
        {/* <p className="ant-upload-hint">Your files will be encrypted before uploading</p> */}
      </Dragger>

      {isLoading && uploadedEncryptedFiles.length > 0 && (
        <div className="default-margin">
          <Spin tip="Loading...">
            <Alert
              message="Sync in progress"
              description="Processing, encrypting and uploading files. Wait..."
              type="info"
            />
          </Spin>
        </div>
      )}

      {uploadedEncryptedFiles.length > 0 ? (
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
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="">
          {loading ? <Spin /> : <span>No uploaded data</span>}
        </Empty>
      )}

      {!isLoading && uploadedEncryptedFiles.length > 0 && (
        <Button
          onClick={async () => {
            message.loading(`Download and decryption started`);
            for (const encyptedFile of uploadedEncryptedFiles) {
              await downloadFile(encyptedFile);
            }
          }}
        >
          Download all!
        </Button>
      )}

      <Modal
        title="Upload completed"
        centered
        visible={uploadCompleted}
        okText="Copy link"
        cancelText="Continue"
        onCancel={() => {
          setUploadCompleted(false);
        }}
        footer={[
          <Button
            key="read-write"
            type="primary"
            onClick={copyReadWriteLink}
            icon={<CopyOutlined />}
          >
            Read/Write
          </Button>,
          <Button
            key="read-only"
            type="primary"
            onClick={copyReadOnlyLink}
            icon={<CopyOutlined />}
          >
            Read only
          </Button>,
        ]}
      >
        <p>
          Your <strong>SkyTransfer</strong> is ready. Your files have been
          correctly encrytypted and uploaded on Skynet. Copy and share your
          SkyTransfer link or just continue uploading. When you share a
          read/write link, others can add files to your SkyTransfer. Read only
          links allow file download without editing.
        </p>
      </Modal>
    </div>
  );
};

export default Uploader;
