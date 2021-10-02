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
import { Bucket, BucketInfo, Buckets } from '../models/files/bucket';

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
const privateBucketsPath = 'skytransfer.hns/privateBuckets.json';
// const privateBucketsPathFormat = 'skytransfer.hns/hiddenBucket/{bucketID}.json';

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
        bucket = jsonCrypto.decrypt(data.data) as Bucket;
      }

      return resolve(bucket);
    } catch (error) {
      return reject(error);
    }
  });
};

let mySkyInstance: MySky = null;

export const getMySky = async (): Promise<MySky> => {
  if (mySkyInstance) {
    return mySkyInstance;
  }

  const client = new SkynetClient(getMySkyDomain());
  return await client.loadMySky(dataDomain, { debug: true });
};

export async function getUserHiddenBuckets(mySky: MySky): Promise<Buckets> {
  let buckets: Buckets = {};

  const { data } = await mySky.getJSONEncrypted(privateBucketsPath);

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
    await mySky.setJSONEncrypted(privateBucketsPath, { buckets });
  } catch (error) {
    throw Error('content record error: ' + error.message);
  }
}
