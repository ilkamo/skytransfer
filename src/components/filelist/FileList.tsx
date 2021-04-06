import { useRef, useState } from "react";
import {
  useParams
} from "react-router-dom";

import FileUtils from '../../utils/file';
import { FileEncrypted } from './../../models/encryption';

const useConstructor = (callBack = () => { }) => {
  const hasBeenCalled = useRef(false);
  if (hasBeenCalled.current) return;
  callBack();
  hasBeenCalled.current = true;
};

const FileList = () => {
  const { sessionPublicKey, encryptionKey } = useParams();
  const fileUtils: FileUtils = new FileUtils();

  const [loadedFiles, setLoadedFiles] = useState<FileEncrypted[]>([]);

  useConstructor(async () => {
    const files = await fileUtils.getSessionEncryptedFiles(sessionPublicKey);
    setLoadedFiles((prev) => [...prev, ...files])
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
      <ul className="files">
        {loadedFiles.map((data, i) => (
          <li className="file-status-bar" onClick={() => { downloadFile(data) }} key={i}>{data.fileName}</li>
        ))}
      </ul>
    </div>

  );
}

export default FileList;