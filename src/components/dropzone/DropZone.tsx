import './DropZone.css';

import { useState, useRef, useEffect } from 'react';
import { genKeyPairAndSeed } from 'skynet-js';
import { EncryptionType, FileEncrypted } from '../../models/encryption';
import FileUtils from '../../utils/file';

import {
  Button,
  List,
  Divider,
  Alert,
  message,
  Modal,
  Menu,
  Upload,
  Spin,
} from 'antd';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  CopyOutlined,
} from '@ant-design/icons';

const { Dragger } = Upload;

const SESSION_KEY_NAME = 'sessionKey';
const uploadEndpoint = 'https://ilkamo.hns.siasky.net/skynet/skyfile';

const useConstructor = (callBack = () => {}) => {
  const hasBeenCalled = useRef(false);
  if (hasBeenCalled.current) return;
  callBack();
  hasBeenCalled.current = true;
};

let interval = setTimeout(() => {}, 5000);

const fileUtils: FileUtils = new FileUtils();

const DropZone = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionPublicKey, setSessionPublicKey] = useState('');
  const [sessionPrivateKey, setSessionPrivateKey] = useState('');
  const [uploadedEncryptedFiles, setUploadedEncryptedFiles] = useState<
    FileEncrypted[]
  >([]);
  const [toStoreInSkyDBCount, setToStoreInSkyDBCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptionQueue, setEncryptionQueue] = useState<File[]>([]);

  const [encryptionKey, setEncryptionKey] = useState('');

  const publicKeyFromPrivateKey = (privateKey: string): string => {
    return privateKey.substr(privateKey.length - 64);
  };

  const initSession = async () => {
    const sessionKey = localStorage.getItem(SESSION_KEY_NAME);
    if (sessionKey) {
      setSessionPublicKey(publicKeyFromPrivateKey(sessionKey));
      setSessionPrivateKey(sessionKey);
      setEncryptionKey(fileUtils.generateEncryptionKey(sessionKey));

      const files = await fileUtils.getSessionEncryptedFiles(
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
      setEncryptionKey(fileUtils.generateEncryptionKey(privateKey));
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

  const downloadFile = async (encryptedFile: FileEncrypted) => {
    const file: File = await fileUtils.decryptFile(
      encryptionKey,
      encryptedFile
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

  const [uploadingFileList, setUploadingFileList] = useState([]);

  useEffect(() => {
    console.log(toStoreInSkyDBCount);
    console.log(uploadingFileList.length);
    
    if (uploadingFileList.length === 0 && toStoreInSkyDBCount === 0) {
      setUploading(false);
    }

    if (toStoreInSkyDBCount > 0 && uploadedEncryptedFiles.length > 0) {
      clearInterval(interval);
      interval = setTimeout(async () => {
        try {
          message.loading('Syncing files in SkyDB...');
          await fileUtils.storeSessionEncryptedFiles(
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

  const draggerConfig = {
    name: 'file',
    multiple: true,
    action: uploadEndpoint,
    fileList: uploadingFileList,
    directory: true,
    onChange(info) {
      setUploadCompleted(false);
      setUploading(true);
      setUploadingFileList(info.fileList.map((x) => x)); // Note: A new object must be used here!!!

      const { status } = info.file;
      if (status === 'uploading') {
        setEncryptionQueue((prev) =>
          prev.filter((f) => f.name !== info.file.name)
        );
      }

      if (status === 'done') {
        const tempFile = {
          skylink: info.file.response.skylink,
          encryptionType: EncryptionType.AES,
          fileName: info.file.name,
          mimeType: info.file.type,
          size: info.file.size,
        };

        message.success(`${info.file.name} file uploaded successfully.`);

        setUploadedEncryptedFiles((prev) => [...prev, tempFile]);
        setToStoreInSkyDBCount((prev) => prev + 1);
        setUploadingFileList((prev) =>
          prev.filter((f) => f.name !== info.file.name)
        );
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    beforeUpload(file, filelist): boolean | Promise<File> {
      setEncryptionQueue((prev) => [...prev, file]);
      return fileUtils.encryptFile(encryptionKey, file);
    },
    onRemove(file): boolean {
      setUploadingFileList((prev) => prev.filter((f) => f.name !== file.name));
      return true;
    },
  };

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

      <Dragger
        showUploadList={{
          showRemoveIcon: true,
        }}
        {...draggerConfig}
      >
        <p className="ant-upload-drag-icon">
          <CloudUploadOutlined /* style={{ color: '#27ae60' }} */ />
        </p>
        <p className="ant-upload-text">
          Drag & Drop files/folders here or click to upload
        </p>
        {isEncrypting ? <Spin tip="File encryption started. Wait ..." /> : ''}
        {/* <p className="ant-upload-hint">Your files will be encrypted before uploading</p> */}
      </Dragger>

      <div>
        <Divider orientation="left">Uploaded files</Divider>
        <List
          bordered={true}
          loading={uploading || loading}
          itemLayout="horizontal"
          dataSource={uploadedEncryptedFiles}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  onClick={() => {
                    message.loading(`Download and decryption started`);
                    downloadFile(item);
                  }}
                  type="link"
                  key="list-download"
                >
                  download
                </Button>,
              ]}
            >
              <List.Item.Meta
                description={fileUtils.fileSize(item.size)}
                title={item.fileName}
              />
            </List.Item>
          )}
        />
      </div>

      <Modal
        title="Upload completed"
        centered
        visible={uploadCompleted}
        okText="Copy link"
        cancelText="Continue"
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
          <Button
            key="link"
            onClick={() => {
              setUploadCompleted(false);
            }}
          >
            Continue
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

export default DropZone;
