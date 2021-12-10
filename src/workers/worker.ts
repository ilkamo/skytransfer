import { expose } from 'comlink';
import Xchacha20poly1305Encrypt from '../crypto/xchacha20poly1305-encrypt';
import { IEncryptedFile } from '../models/files/encrypted-file';
import Xchacha20poly1305Decrypt from '../crypto/xchacha20poly1305-decrypt';
import { IEncryptionReaderResult } from '../models/encryption';
import { TUS_CHUNK_SIZE } from '../config';

let fileStream: ReadableStream;
let streamSize: number = 0;

const initEncryptionReader = async (
  file: File,
  fileKey: string,
  setEncryptProgressCallback
): Promise<void> => {
  const fe = new Xchacha20poly1305Encrypt(file, fileKey);
  await fe.encryptAndStream((completed, eProgress) => {
    setEncryptProgressCallback(eProgress);
  });

  streamSize = fe.getStreamSize();
  fileStream = await fe.getStream(TUS_CHUNK_SIZE);
};

const readChunk = async (): Promise<IEncryptionReaderResult> => {
  const reader = fileStream.getReader();
  const r = await reader.read();
  reader.releaseLock();

  return {
    value: r.value,
    done: r.done,
  };
};

const getStreamSize = (): number => {
  return streamSize;
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
  initEncryptionReader,
  readChunk,
  decryptFile,
  getStreamSize,
};

export type WorkerApi = typeof workerApi;

expose(workerApi);
