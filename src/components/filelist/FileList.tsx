import { useRef, useState } from "react";
import {
  useParams
} from "react-router-dom";

import { useHistory } from "react-router-dom";

import FileUtils from '../../utils/file';
import { FileEncrypted } from './../../models/encryption';

import { Button, List, Divider, Menu, message } from 'antd';
import { PlusOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';

const useConstructor = (callBack = () => { }) => {
  const hasBeenCalled = useRef(false);
  if (hasBeenCalled.current) return;
  callBack();
  hasBeenCalled.current = true;
};

const SESSION_KEY_NAME = 'sessionKey';

const FileList = () => {
  const { sessionPublicKey, encryptionKey } = useParams();
  const fileUtils: FileUtils = new FileUtils();
  const [loading, setlLoading] = useState(true);

  const [loadedFiles, setLoadedFiles] = useState<FileEncrypted[]>([]);

  useConstructor(async () => {
    const files = await fileUtils.getSessionEncryptedFiles(sessionPublicKey);
    if (!files) {
      setlLoading(false);
      return;
    }
    setLoadedFiles((prev) => [...prev, ...files]);
    setlLoading(false);
  });

  const history = useHistory();

  const downloadFile = async (encryptedFile: FileEncrypted) => {
    const file: File = await fileUtils.decryptFile(encryptionKey, encryptedFile);

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
    return sessionKey !== undefined
  }

  const destroySession = () => {
    localStorage.removeItem(SESSION_KEY_NAME);
    history.push("/");
  }

  return (
    <div>
      <div className="container">
        <Menu className="default-margin" selectedKeys={[]} mode="horizontal">
          <Menu.Item onClick={destroySession} key="new-session" icon={<PlusOutlined />}>
            <a href="/" rel="noopener noreferrer">
              Start a SkyTransfer
            </a>
          </Menu.Item>
          <Menu.Item key="resume-session" disabled={!canResumeSession()} icon={<ReloadOutlined />}>
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
          <List
            bordered={true}
            loading={loading}
            itemLayout="horizontal"
            dataSource={loadedFiles}
            renderItem={item => (
              <List.Item
                actions={[
                  <Button type="link" key="list-download" onClick={() => {
                    message.loading(`Download and decryption started`);
                    downloadFile(item);
                  }}>download</Button>]}
              >
                <List.Item.Meta
                  description={fileUtils.fileSize(item.size)}
                  title={item.fileName}
                />
              </List.Item>
            )}
          />
        </div>
      </div>
    </div>

  );
}

export default FileList;