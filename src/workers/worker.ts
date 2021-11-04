import { expose } from 'comlink';
import Xchacha20poly1305Encrypt from '../crypto/xchacha20poly1305-encrypt';
import { IEncryptedFile } from '../models/files/encrypted-file';
import Xchacha20poly1305Decrypt from '../crypto/xchacha20poly1305-decrypt';

const encryptFile = async (
  file: File,
  fileKey: string,
  uploadCallback,
  setEncryptProgressCallback
): Promise<File> => {
  const fe = new Xchacha20poly1305Encrypt(file, fileKey);
  const encryptedFile = await fe.encrypt((completed, eProgress) => {
    setEncryptProgressCallback(eProgress);
  });

  return Promise.resolve(uploadCallback(encryptedFile));
};

const decryptFile = async (
  encryptedFile: IEncryptedFile,
  portalUrl: string,
  setDecryptProgressCallback,
  setDownloadProgressCallback
): Promise<string> => {
  const decrypt = new Xchacha20poly1305Decrypt(encryptedFile, portalUrl);

  let file: File;
  try {
    file = await decrypt.decrypt(
      (completed, eProgress) => {
        setDecryptProgressCallback(eProgress);
      },
      (completed, dProgress) => {
        setDownloadProgressCallback(dProgress);
      }
    );
  } catch (error) {
    return `error: ${error.toString()}`;
  }

  if (!file) {
    return 'error: no file';
  }

  return Promise.resolve(URL.createObjectURL(file));
};

const workerApi = {
  encryptFile,
  decryptFile,
};

export type WorkerApi = typeof workerApi;

expose(workerApi);
