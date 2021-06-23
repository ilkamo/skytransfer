import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useHistory } from 'react-router-dom';
import { EncryptedFileReference } from '../../models/encryption';

import { Button, Empty, Divider, message, Tree, Spin } from 'antd';
import { DownloadOutlined, DownOutlined } from '@ant-design/icons';
import { renderTree } from '../../utils/walker';
import AESFileDecrypt from '../../crypto/file-decrypt';
import { SESSION_KEY_NAME } from '../../config';
import { getEncryptedFiles } from '../../skynet/skynet';

import { ActivityBars } from '../uploader/activity-bar';

import { DirectoryTreeLine } from '../common/directory-tree-line/directory-tree-line';

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
  const history = useHistory();

  const [loadedFiles, setLoadedFiles] = useState<EncryptedFileReference[]>([]);

  useConstructor(async () => {
    if (transferKey && transferKey.length === 128) {
      localStorage.setItem(SESSION_KEY_NAME, transferKey);
      history.push('/');
    }

    const files = await getEncryptedFiles(transferKey, encryptionKey);
    if (!files) {
      setlLoading(false);
      return;
    }

    setLoadedFiles((prev) => [...prev, ...files]);
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

  const downloadFile = async (encryptedFile: EncryptedFileReference) => {
    const decrypt = new AESFileDecrypt(encryptedFile, encryptionKey);
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

  return (
    <>
      <Divider orientation="left">Shared files</Divider>
      {loadedFiles.length > 0 ? (
        <>
          <div className="file-list">
            <DownloadActivityBar
              downloadProgress={downloadProgress}
              decryptProgress={decryptProgress}
            />
            <Divider />
            <DirectoryTree
              multiple
              showIcon={false}
              showLine
              className="file-tree default-margin"
              defaultExpandAll={true}
              switcherIcon={<DownOutlined className="directory-switcher" />}
              treeData={renderTree(loadedFiles)}
              selectable={false}
              titleRender={(node) => (
                <DirectoryTreeLine
                  disabled={false}
                  isLeaf={node.isLeaf}
                  name={node.title.toString()}
                  onDownloadClick={() => {
                    if (!node.isLeaf) {
                      return;
                    }
                    const key: string = `${node.key}`;
                    const toDownload = loadedFiles.find(
                      (f) => f.uuid === key.split('_')[0]
                    );
                    if (toDownload) {
                      message.loading(`Download and decryption started`);
                      downloadFile(toDownload);
                    }
                  }}
                />
              )}
            />
          </div>
          <div className="default-margin" style={{ textAlign: 'center' }}>
            <Button
              icon={<DownloadOutlined />}
              size="large"
              onClick={async () => {
                message.loading(`Download and decryption started`);
                for (const encyptedFile of loadedFiles) {
                  await downloadFile(encyptedFile);
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
    </>
  );
};

export default FileList;
