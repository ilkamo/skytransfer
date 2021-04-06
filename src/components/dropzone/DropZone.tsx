import { useState, useEffect, useRef } from 'react';
import { SkynetClient, genKeyPairAndSeed } from 'skynet-js';
import { EncryptionType, FileEncrypted } from '../../models/encryption';
import FileUtils from '../../utils/file';

import './DropZone.css';

const SESSION_KEY_NAME = 'sessionKey';
const skynetClient = new SkynetClient('https://siasky.net');

const useConstructor = (callBack = () => { }) => {
  const hasBeenCalled = useRef(false);
  if (hasBeenCalled.current) return;
  callBack();
  hasBeenCalled.current = true;
};

const DropZone = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [validFiles, setValidFiles] = useState([]);
  const [unsupportedFiles, setUnsupportedFiles] = useState([]);
  const [sessionPublicKey, setSessionPublicKey] = useState('');
  const [sessionPrivateKey, setSessionPrivateKey] = useState('');
  const [uploadedEncryptedFiles, setUploadedEncryptedFiles] = useState<FileEncrypted[]>([]);
  const [sessionInterval, setSessionInterval] = useState(
    setTimeout(() => { }, 0)
  );
  const [uploading, setUploading] = useState(false);

  const fileUtils: FileUtils = new FileUtils();
  const [encryptionKey, setEncryptionKey] = useState('');

  useEffect(() => {
    setEncryptionKey(fileUtils.generateEncryptionKey(sessionPrivateKey));
  }, [sessionPrivateKey]);

  const publicKeyFromPrivateKey = (privateKey: string): string => {
    return privateKey.substr(privateKey.length - 64);
  };

  const initSession = async () => {
    const sessionKey = localStorage.getItem(SESSION_KEY_NAME);
    if (sessionKey) {
      setSessionPublicKey(publicKeyFromPrivateKey(sessionKey));
      setSessionPrivateKey(sessionKey);
    } else {
      const { publicKey, privateKey } = genKeyPairAndSeed();
      setSessionPublicKey(publicKey);
      setSessionPrivateKey(privateKey);
      localStorage.setItem(SESSION_KEY_NAME, privateKey);
    }
  };

  useConstructor(() => {
    initSession();
  });

  const dragOver = (e) => {
    e.preventDefault();
  };

  const dragEnter = (e) => {
    e.preventDefault();
  };

  const dragLeave = (e) => {
    e.preventDefault();
  };

  const fileDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length) {
      handleFiles(files);
    }
  };

  const validateFile = (file) => {
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/x-icon',
    ];
    if (validTypes.indexOf(file.type) === -1) {
      return false;
    }
    return true;
  };

  const handleFiles = (files) => {
    for (let i = 0; i < files.length; i++) {
      if (validateFile(files[i])) {
        // add to an array so we can display the name of file
        setSelectedFiles((prevArray) => [...prevArray, files[i]]);
      } else {
        files[i]['invalid'] = true;
        setSelectedFiles((prevArray) => [...prevArray, files[i]]);
        setErrorMessage('File type not permitted');
        setUnsupportedFiles((prevArray) => [...prevArray, files[i]]);
      }
    }
  };

  const fileSize = (size) => {
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fileType = (fileName) => {
    return (
      fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length) ||
      fileName
    );
  };

  useEffect(() => {
    let filteredArray = selectedFiles.reduce((file, current) => {
      const x = file.find((item) => item.name === current.name);
      if (!x) {
        return file.concat([current]);
      } else {
        return file;
      }
    }, []);
    setValidFiles([...filteredArray]);
  }, [selectedFiles]);

  const removeFile = (name) => {
    // find the index of the item
    // remove the item from array

    const validFileIndex = validFiles.findIndex((e) => e.name === name);
    validFiles.splice(validFileIndex, 1);
    // update validFiles array
    setValidFiles([...validFiles]);
    const selectedFileIndex = selectedFiles.findIndex((e) => e.name === name);
    selectedFiles.splice(selectedFileIndex, 1);
    // update selectedFiles array
    setSelectedFiles([...selectedFiles]);

    const unsupportedFileIndex = unsupportedFiles.findIndex(
      (e) => e.name === name
    );
    if (unsupportedFileIndex !== -1) {
      unsupportedFiles.splice(unsupportedFileIndex, 1);
      // update unsupportedFiles array
      setUnsupportedFiles([...unsupportedFiles]);
    }
  };

  const fileInputRef = useRef(null);

  const fileInputClicked = () => {
    fileInputRef.current.click();
  };

  const uploadFiles = async () => {
    const uploaded: FileEncrypted[] = [];
    setUploading(true);

    for (let i = 0; i < validFiles.length; i++) {
      try {
        const result = await fileUtils.encryptFile(encryptionKey, validFiles[i]);
        const { skylink } = await skynetClient.uploadFile(result);

        const tempFile = {
          skylink: skylink,
          encryptionType: EncryptionType.AES,
          fileName: validFiles[i].name,
          mimeType: validFiles[i].type,
          size: validFiles[i].size
        }

        setUploadedEncryptedFiles((prevArray) => [...prevArray, tempFile]);
        uploaded.push(tempFile);
      } catch (error) {
        console.log('Could not upload file: ' + error);
      }
    }

    clearTimeout(sessionInterval);
    setSessionInterval(
      setTimeout(async () => {
        if (uploaded.length === 0) {
          setUploading(false);
          return;
        }

        try {
          await fileUtils.storeSessionEncryptedFiles(sessionPrivateKey, uploaded);
        } catch (error) {
          console.log('Could not store session encrypted files: ' + error);
        }

        setUploading(false);
      }, 2000)
    );
  };

  const filesSelected = () => {
    if (fileInputRef.current.files.length) {
      handleFiles(fileInputRef.current.files);
    }
  };

  return (
    <div className="container">
      {unsupportedFiles.length === 0 && validFiles.length ? (
        <button
          disabled={uploading}
          className="file-upload-btn"
          onClick={() => uploadFiles()}
        >
          Upload Files
        </button>
      ) : (
        ''
      )}
      {unsupportedFiles.length ? (
        <p>Please remove all unsupported files.</p>
      ) : (
        ''
      )}
      <div
        className="drop-container"
        onDragOver={dragOver}
        onDragEnter={dragEnter}
        onDragLeave={dragLeave}
        onDrop={fileDrop}
        onClick={fileInputClicked}
      >
        <div className="drop-message">
          <div className="upload-icon"></div>
          Drag & Drop files here or click to upload
        </div>
        <input
          ref={fileInputRef}
          className="file-input"
          type="file"
          multiple
          onChange={filesSelected}
        />
      </div>
      <div className="file-display-container">
        {validFiles.map((data, i) => (
          <div className="file-status-bar" key={i}>
            <div>
              {/* <div className="file-type-logo"></div> */}
              {/* <div className="file-type">{fileType(data.name)}</div> */}
              <span className={`file-name ${data.invalid ? 'file-error' : ''}`}>
                {data.name}
              </span>
              <span className="file-size">({fileSize(data.size)})</span>{' '}
              {data.invalid && (
                <span className="file-error-message">({errorMessage})</span>
              )}
            </div>
            <div className="file-remove" onClick={() => removeFile(data.name)}>
              X
            </div>
          </div>
        ))}
      </div>
      <a href={`/${sessionPublicKey}/${encryptionKey}`}>link</a>
    </div>
  );
};
export default DropZone;
