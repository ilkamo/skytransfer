import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useHistory } from 'react-router-dom';

import { Button, Empty, Divider, message, Tree, Spin } from 'antd';
import { DownloadOutlined, DownOutlined } from '@ant-design/icons';
import { renderTree } from '../../utils/walker';
import AESFileDecrypt from '../../crypto/file-decrypt';
import { SESSION_KEY_NAME } from '../../config';
import { getDecryptedBucket } from '../../skynet/skynet';

import { ActivityBars } from '../uploader/activity-bar';

import { DirectoryTreeLine } from '../common/directory-tree-line/directory-tree-line';
import { Bucket, DecryptedBucket } from '../../models/files/bucket';
import { EncryptedFile } from '../../models/files/encrypted-file';

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

  const [decryptedBucket, setDecryptedBucket] = useState<Bucket>();

  useConstructor(async () => {
    if (transferKey && transferKey.length === 128) {
      localStorage.setItem(SESSION_KEY_NAME, transferKey);
      history.push('/');
    }

    const bucket: Bucket = await getDecryptedBucket(transferKey, encryptionKey);
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

  const downloadFile = async (encryptedFile: EncryptedFile) => {
    const decrypt = new AESFileDecrypt(encryptedFile);
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

  const getFileBy = (key: string): EncryptedFile => {
    for (let path in decryptedBucket.files) {
      if (decryptedBucket.files[path].uuid === key.split('_')[0]) {
        return decryptedBucket.files[path];
      }
    }

    throw Error('could not find the file');
  };

  const bucketHasFiles =
    decryptedBucket && Object.keys(decryptedBucket.files).length > 0;

  return (
    <>
      <Divider orientation="left">Shared files</Divider>
      {bucketHasFiles ? (
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
              size="large"
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
    </>
  );
};

export default FileList;
