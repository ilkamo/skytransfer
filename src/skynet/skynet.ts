import { ContentRecordDAC } from '@skynetlabs/content-record-library';
import { PublicSession } from './../models/session';
import { MySky, SkynetClient } from 'skynet-js';
import { ENCRYPTED_FILES_SKYDB_KEY_NAME } from '../config';
import { JsonCrypto } from '../crypto/json';
import { EncryptedFileReference } from '../models/encryption';
import { getEndpointInDefaultPortal } from '../portals';

const skynetClient = new SkynetClient(getEndpointInDefaultPortal());

const dataDomain = 'skytransfer.hns';
const sessionsPath = 'skytransfer.hns/publicSessions.json';

const contentRecord = new ContentRecordDAC();

export const storeEncryptedFiles = async (
  privateKey: string,
  encryptionKey: string,
  encryptedFiles: EncryptedFileReference[]
): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    if (encryptedFiles.length === 0) {
      return resolve(false);
    }

    const jsonCrypto = new JsonCrypto(encryptionKey);
    const encryptedFilesAsEncryptedString = jsonCrypto.encrypt(encryptedFiles);

    try {
      await skynetClient.db.setJSON(
        privateKey,
        ENCRYPTED_FILES_SKYDB_KEY_NAME,
        {
          data: encryptedFilesAsEncryptedString,
        }
      );
      return resolve(true);
    } catch (error) {
      return reject(error);
    }
  });
};

export const getEncryptedFiles = async (
  publicKey: string,
  encryptionKey: string
): Promise<EncryptedFileReference[]> => {
  return new Promise(async (resolve, reject) => {
    const jsonCrypto = new JsonCrypto(encryptionKey);
    let files: EncryptedFileReference[] = [];

    try {
      const { data } = await skynetClient.db.getJSON(
        publicKey,
        ENCRYPTED_FILES_SKYDB_KEY_NAME
      );

      if (data && data.data && typeof data.data === 'string') {
        const decryptedEncryptedFiles = jsonCrypto.decrypt(data.data);
        files = decryptedEncryptedFiles as EncryptedFileReference[];
      }

      return resolve(files);
    } catch (error) {
      return reject(error);
    }
  });
};

export const mySkyLogin = async (): Promise<MySky> => {
  try {
    const client = new SkynetClient();
    const mySky = await client.loadMySky(dataDomain, { debug: true });

    // @ts-ignore
    await mySky.loadDacs(contentRecord);

    const loggedIn = await mySky.checkLogin();
    if (!loggedIn) {
      if (!(await mySky.requestLoginAccess())) {
        throw Error('could not login');
      }
    }

    return mySky;
  } catch (e) {
    console.log('mySkyLogin error: ');
    console.error(e);
    throw e;
  }
};

export const getUserPublicSessions = async (
  mySky: MySky
): Promise<PublicSession[]> => {
  let sessions: PublicSession[] = [];

  try {
    const { data } = await mySky.getJSON(sessionsPath);

    if (data && 'sessions' in data) {
      sessions = data.sessions as PublicSession[];
    }
  } catch (e) {
    console.log('could not getUserSessions');
    console.error(e);
  }

  return sessions;
};

export const storeUserSession = async (
  mySky: MySky,
  newSessions: PublicSession[]
) => {
  try {
    let sessions = await getUserPublicSessions(mySky);
    let shouldUpdate = false;

    newSessions.forEach((n) => {
      if (
        sessions.findIndex((s) => s.link === n.link || s.id === n.id) === -1
      ) {
        sessions.push(n);
        shouldUpdate = true;
      }
    });

    if (shouldUpdate) {
      const { skylink } = await mySky.setJSON(sessionsPath, { sessions });

      await contentRecord.recordNewContent({
        skylink: skylink,
        metadata: {
          action: 'addedPublicSkyTransferSessions',
          newSessions: newSessions,
        },
      });
    }
  } catch (e) {
    console.log('could not storeUserSession:');
    console.error(e);
  }
};
