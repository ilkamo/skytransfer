import {
  getEndpointInCurrentPortal,
  getEndpointInDefaultPortal,
} from './../portals';
import { MySky, SkynetClient } from 'skynet-js';
import { SKYTRANSFER_BUCKET, MAX_AXIOS_RETRIES } from '../config';
import { JsonCrypto } from '../crypto/json';
import { getMySkyDomain } from '../portals';
import axiosRetry from 'axios-retry';
import axios from 'axios';
import {
  Bucket,
  BucketInfo,
  Buckets,
  DecryptedBucket,
} from '../models/files/bucket';
import { UserProfileDAC } from '@skynethub/userprofile-library';

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
const hiddenBucketsPath = 'skytransfer.hns/hiddenBuckets.json';
// const hiddenBucketsPathFormat = 'skytransfer.hns/hiddenBucket/{bucketID}.json';

const userProfileRecord = new UserProfileDAC();

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
  const mySky = await client.loadMySky(dataDomain, { debug: true });

  // load DACs
  // @ts-ignore
  await mySky.loadDacs(userProfileRecord);

  const loggedIn = await mySky.checkLogin();
  if (!loggedIn) {
    if (!(await mySky.requestLoginAccess())) {
      throw Error('could not login');
    }
  }

  return mySky;
};

export async function getUserHiddenBuckets(mySky: MySky): Promise<Buckets> {
  let buckets: Buckets = {};

  const { data } = await mySky.getJSONEncrypted(hiddenBucketsPath);

  if (data && 'buckets' in data) {
    buckets = data.buckets as Buckets;
  }

  return buckets;
}

export async function storeUserHiddenBucket(
  mySky: MySky,
  newBucket: BucketInfo
) {
  let buckets = await getUserHiddenBuckets(mySky);

  if (newBucket.uuid in buckets) {
    throw Error('bucket already exists');
  }

  buckets[newBucket.uuid] = newBucket;
  try {
    await mySky.setJSONEncrypted(hiddenBucketsPath, { buckets });
  } catch (error) {
    throw Error('content record error: ' + error.message);
  }
}
