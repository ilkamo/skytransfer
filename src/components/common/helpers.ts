import { IEncryptedFile } from "../../models/files/encrypted-file";
import { WEB_WORKER_URL } from "../../config";
import { proxy, wrap } from "comlink";
import { WorkerApi } from "../../workers/worker";
import { message } from "antd";
import Xchacha20poly1305Decrypt from "../../crypto/xchacha20poly1305-decrypt";
import { uploadFile } from "../../skynet/skynet";
import Xchacha20poly1305Encrypt from "../../crypto/xchacha20poly1305-encrypt";
import { getEndpointInDefaultPortal } from "../../portals";

export const webWorkerDownload = async (
  encryptedFile: IEncryptedFile,
  setDecryptProgress,
  setDownloadProgress,
): Promise<string> => {
  const worker = new Worker(WEB_WORKER_URL);
  const service = wrap<WorkerApi>(worker);

  const url = await service.decryptFile(
    encryptedFile,
    getEndpointInDefaultPortal(),
    proxy(setDecryptProgress),
    proxy(setDownloadProgress)
  );
  if (url.startsWith('error')) {
    message.error(url);
    return;
  }

  return url;
}

export const simpleDownload = async (
  encryptedFile: IEncryptedFile,
  setDecryptProgress,
  setDownloadProgress,
): Promise<string> => {
  const decrypt = new Xchacha20poly1305Decrypt(encryptedFile, getEndpointInDefaultPortal());

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

  return window.URL.createObjectURL(file);
}

export const webWorkerUploader = async (options, fileKey, setEncryptProgress): Promise<File> => {
  const {onSuccess, onError, file, onProgress} = options;

  const uploadFileFunc = async (f) => {
    await uploadFile(f, fileKey, onProgress, onSuccess, onError);
  };

  const worker = new Worker(WEB_WORKER_URL);
  const service = wrap<WorkerApi>(worker);

  return service.encryptFile(
    file,
    fileKey,
    proxy(uploadFileFunc),
    proxy(setEncryptProgress)
  )
}

export const simpleUploader = async (options, fileKey, setEncryptProgress): Promise<File> => {
  const {onSuccess, onError, file, onProgress} = options;

  const fe = new Xchacha20poly1305Encrypt(file, fileKey);
  const encryptedFile = await fe.encrypt((completed, eProgress) => {
    setEncryptProgress(eProgress);
  })

  await uploadFile(encryptedFile, fileKey, onProgress, onSuccess, onError);

  return encryptedFile;
}

export const downloadFile = async (
  encryptedFile: IEncryptedFile,
  setDecryptProgress,
  setDownloadProgress,
) => {
  const fileName: string = encryptedFile.name;
  let fileUrl: string;

  if (window.Worker) {
    console.log("[Using web-workers]")
    fileUrl = await webWorkerDownload(encryptedFile, setDecryptProgress, setDownloadProgress);
  } else {
    fileUrl = await simpleDownload(encryptedFile, setDecryptProgress, setDownloadProgress);
  }

  const elem = window.document.createElement('a');
  elem.href = fileUrl;
  elem.download = fileName;
  document.body.appendChild(elem);
  elem.click();
  document.body.removeChild(elem);
};