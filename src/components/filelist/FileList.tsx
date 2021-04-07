import { useRef, useState } from "react";
import {
  useParams
} from "react-router-dom";

import FileUtils from '../../utils/file';
import { FileEncrypted } from './../../models/encryption';


import { Button, List, Divider } from 'antd';

const useConstructor = (callBack = () => { }) => {
  const hasBeenCalled = useRef(false);
  if (hasBeenCalled.current) return;
  callBack();
  hasBeenCalled.current = true;
};

const FileList = () => {
  const { sessionPublicKey, encryptionKey } = useParams();
  const fileUtils: FileUtils = new FileUtils();
  const [loading, setlLoading] = useState(true);

  const [loadedFiles, setLoadedFiles] = useState<FileEncrypted[]>([]);

  useConstructor(async () => {
    const files = await fileUtils.getSessionEncryptedFiles(sessionPublicKey);
    setLoadedFiles((prev) => [...prev, ...files]);
    setlLoading(false);
  });

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

  return (
    <div>
      <div className="container">
        {loadedFiles.length > 0 ? (
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
                    <Button type="link" key="list-download" onClick={() => { downloadFile(item) }}>download</Button>]}
                >
                  <List.Item.Meta
                    description={fileUtils.fileSize(item.size)}
                    title={item.fileName}
                  />
                </List.Item>
              )}
            />
          </div>
        ) : (
          ''
        )}
      </div>
    </div>

  );
}

export default FileList;