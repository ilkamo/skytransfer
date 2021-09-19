import {
  getEndpointInCurrentPortal,
  getEndpointInDefaultPortal,
} from './../portals';
import { PublicSession } from './../models/session';
import { MySky, SkynetClient } from 'skynet-js';
import { SKYTRANSFER_BUCKET, MAX_AXIOS_RETRIES } from '../config';
import { JsonCrypto } from '../crypto/json';
import { getMySkyDomain } from '../portals';
import axiosRetry from 'axios-retry';
import axios from 'axios';
import { Bucket, DecryptedBucket } from '../models/files/bucket';

const skynetSkyDBClient = new SkynetClient(getEndpointInDefaultPortal());

let endpointInCurrentPortal = getEndpointInCurrentPortal();
let skynetFileClient = new SkynetClient(getEndpointInCurrentPortal());

const getSkynetFileClientBasedOnPortal = (): SkynetClient => {
  if (endpointInCurrentPortal !== getEndpointInCurrentPortal()) {
    endpointInCurrentPortal = getEndpointInCurrentPortal();
    skynetFileClient = new SkynetClient(endpointInCurrentPortal);
  }

  return skynetFileClient;
};

const dataDomain = 'skytransfer.hns';
const sessionsPath = 'skytransfer.hns/publicSessions.json';

export const uploadFile = async (
  encryptedFile: File,
  fileKey: string,
  onProgress,
  onSuccess,
  onError
) => {
  try {
    const fileSkylink = await getSkynetFileClientBasedOnPortal().uploadFile(
      encryptedFile,
      {
        onUploadProgress: (p) => {
          onProgress({ percent: Math.floor(p * 100) }, encryptedFile);
        },
      }
    );
    onSuccess({
      data: fileSkylink,
      encryptedFileSize: encryptedFile.size,
      fileKey: fileKey,
    });
  } catch (e) {
    onError(e);
  }
};

export const downloadFile = async (
  skylink: string,
  onProgress,
  bytesRange?: string
): Promise<any> => {
  const url = await getSkynetFileClientBasedOnPortal().getSkylinkUrl(skylink);

  axiosRetry(axios, {
    retries: MAX_AXIOS_RETRIES,
    retryCondition: (_e) => true, // retry no matter what
  });

  return axios({
    method: 'get',
    url: url,
    headers: {
      Range: bytesRange,
    },
    responseType: 'text',
    onDownloadProgress: onProgress,
    withCredentials: true,
  });
};

export const encryptAndStoreBucket = async (
  privateKey: string,
  encryptionKey: string,
  bucket: Bucket
): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    const jsonCrypto = new JsonCrypto(encryptionKey);
    const encryptedBucket = jsonCrypto.encrypt(bucket);

    try {
      await skynetSkyDBClient.db.setJSON(privateKey, SKYTRANSFER_BUCKET, {
        data: encryptedBucket,
      });
      return resolve(true);
    } catch (error) {
      return reject(error);
    }
  });
};

export const getDecryptedBucket = async (
  publicKey: string,
  encryptionKey: string
): Promise<Bucket> => {
  return new Promise(async (resolve, reject) => {
    const jsonCrypto = new JsonCrypto(encryptionKey);
    let bucket: Bucket;

    try {
      const { data } = await skynetSkyDBClient.db.getJSON(
        publicKey,
        SKYTRANSFER_BUCKET
      );

      if (data && data.data && typeof data.data === 'string') {
        bucket = jsonCrypto.decrypt(data.data) as DecryptedBucket;
      }

      return resolve(bucket);
    } catch (error) {
      return reject(error);
    }
  });
};

export const mySkyLogin = async (): Promise<MySky> => {
  const client = new SkynetClient(getMySkyDomain());
  const mySky = await client.loadMySky(dataDomain);

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

  const bucket = await getDecryptedBucket(found[1], found[2]);
  if (Object.keys(bucket.files).length === 0) {
    throw new Error('nothing to store');
  }

  let sessions = await getUserPublicSessions(mySky);
  if (
    sessions.findIndex(
      (s) => s.link === newSession.link || s.id === newSession.id
    ) === -1
  ) {
    sessions.push(newSession);

    try {
      await mySky.setJSON(sessionsPath, { sessions });
    } catch (error) {
      throw Error('content record error: ' + error.message);
    }
  }
};
