import { ContentRecordDAC } from '@skynetlabs/content-record-library';
import { PublicSession } from './../models/session';
import { MySky, SkynetClient } from 'skynet-js';
import { ENCRYPTED_FILES_SKYDB_KEY_NAME } from '../config';
import { JsonCrypto } from '../crypto/json';
import { EncryptedFileReference } from '../models/encryption';
import { getEndpointInDefaultPortal, getMySkyDomain } from '../portals';

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
  const client = new SkynetClient(getMySkyDomain());
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
};

export const getUserPublicSessions = async (
  mySky: MySky
): Promise<PublicSession[]> => {
  let sessions: PublicSession[] = [];

  const { data } = await mySky.getJSON(sessionsPath);

  if (data && 'sessions' in data) {
    sessions = data.sessions as PublicSession[];
  }

  return sessions;
};

export const storeUserSession = async (
  mySky: MySky,
  newSession: PublicSession
) => {
  const linkRegex = /#\/(\w{64})\/(\w{128})/i;
  const found = newSession.link.match(linkRegex);
  if (!found || found.length !== 3) {
    throw new Error('could not get info from session link');
  }

  const files = await getEncryptedFiles(found[1], found[2]);
  if (files.length === 0) {
    throw new Error('nothing to store');
  }

  let sessions = await getUserPublicSessions(mySky);
  if (
    sessions.findIndex(
      (s) => s.link === newSession.link || s.id === newSession.id
    ) === -1
  ) {
    sessions.push(newSession);

    const { dataLink } = await mySky.setJSON(sessionsPath, { sessions });
    const sessionsDataLink = dataLink;

    try {
      const {
        dataLink,
      } = await mySky.setJSON(`skytransfer.hns/${newSession.id}.json`, {
        newSession,
      });
      await contentRecord.recordNewContent({
        skylink: dataLink,
        metadata: {
          action: 'SkyTransferPublished',
          session: newSession,
        },
      });

      for (const file of files) {
        try {
          await contentRecord.recordInteraction({
            skylink: sessionsDataLink,
            metadata: {
              action: 'SkyTransferFilePublished',
              session: newSession,
              filename: file.fileName,
            },
          });
        } catch (error) {
          console.log('Something wrong with recordInteraction');
          console.error(error);
        }
      }
    } catch (error) {
      throw Error('content record error: ' + error.message);
    }
  }
};
