import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useHistory } from 'react-router-dom';

import Utils from '../../utils/utils';
import { EncryptedFileReference } from '../../models/encryption';

import { Button, Empty, Divider, Menu, message, Tree, Spin, Alert } from 'antd';
import {
  PlusOutlined,
  CopyOutlined,
  ReloadOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { renderTree } from '../../utils/walker';
import AESFileDecrypt from '../crypto/decrypt';
import { SESSION_KEY_NAME } from '../../config';
import ActivityBar from '../uploader/activity-bar';

const useConstructor = (callBack = () => {}) => {
  const hasBeenCalled = useRef(false);
  if (hasBeenCalled.current) return;
  callBack();
  hasBeenCalled.current = true;
};

const FileList = () => {
  const { transferKey, encryptionKey } = useParams();
  const utils: Utils = new Utils();
  const [loading, setlLoading] = useState(true);
  const history = useHistory();

  const [loadedFiles, setLoadedFiles] = useState<EncryptedFileReference[]>([]);

  useConstructor(async () => {
    if (transferKey && transferKey.length === 128) {
      localStorage.setItem(SESSION_KEY_NAME, transferKey);
      history.push('/');
    }

    const files = await utils.getSessionEncryptedFiles(transferKey);
    if (!files) {
      setlLoading(false);
      return;
    }

    setLoadedFiles((prev) => [...prev, ...files]);
    setlLoading(false);
  });

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [decryptProgress, setDecryptProgress] = useState(0);

  const downloadFile = async (encryptedFile: EncryptedFileReference) => {
    const decrypt = new AESFileDecrypt(encryptedFile, encryptionKey);
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

  const canResumeSession = (): boolean => {
    const sessionKey = localStorage.getItem(SESSION_KEY_NAME);
    return sessionKey !== undefined;
  };

  const destroySession = () => {
    localStorage.removeItem(SESSION_KEY_NAME);
    history.push('/');
  };

  return (
    <div>
      <div className="container">
        <Menu className="default-margin" selectedKeys={[]} mode="horizontal">
          <Menu.Item
            onClick={destroySession}
            key="new-session"
            icon={<PlusOutlined />}
          >
            <a href="/" rel="noopener noreferrer">
              Start a SkyTransfer
            </a>
          </Menu.Item>
          <Menu.Item
            key="resume-session"
            disabled={!canResumeSession()}
            icon={<ReloadOutlined />}
          >
            <a href="/" rel="noopener noreferrer">
              Resume SkyTransfer
            </a>
          </Menu.Item>
          <Menu.Item key="about-us" disabled icon={<CopyOutlined />}>
            <a href="/" rel="noopener noreferrer">
              About SkyTransfer
            </a>
          </Menu.Item>
        </Menu>
        <div>
          <Divider orientation="left">Shared files</Divider>
          {loadedFiles.length > 0 ? (
            <div>
              <Alert
                message="Click on a file to start downloading"
                type="info"
              />
              <ActivityBar
                downloadProgress={downloadProgress}
                decryptProgress={decryptProgress}
                encryptProgress={0}
              />
              <Tree
                className="file-tree default-margin"
                showLine={true}
                defaultExpandAll={true}
                switcherIcon={<DownOutlined />}
                onSelect={(selectedKeys, info) => {
                  if (info.node.children && info.node.children.length !== 0) {
                    return; // folder
                  }

                  //{utils.fileSize(item.size)

                  const key: string = `${info.node.key}`;
                  const ff = loadedFiles.find(
                    (f) => f.uuid === key.split('_')[0]
                  );
                  if (ff) {
                    message.loading(`Download and decryption started`);
                    downloadFile(ff);
                  }
                }}
                treeData={renderTree(loadedFiles)}
              />
              <Button
                onClick={async () => {
                  message.loading(`Download and decryption started`);
                  for (const encyptedFile of loadedFiles) {
                    await downloadFile(encyptedFile);
                  }
                }}
              >
                Download all!
              </Button>
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="">
              {loading ? <Spin /> : <span>No shared data found</span>}
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileList;
