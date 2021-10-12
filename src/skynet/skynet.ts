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
  IAllBuckets,
  IBucket,
  IBuckets,
  IBucketsInfo,
  IReadOnlyBucketInfo,
  IReadOnlyBucketsInfo,
  IReadWriteBucketInfo,
  IReadWriteBucketsInfo,
} from '../models/files/bucket';
import { publicKeyFromPrivateKey } from '../crypto/crypto';

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
const privateReadWriteUserBucketsPath = 'skytransfer.hns/userBuckets.json';
const privateReadOnlyUserBucketsPath =
  'skytransfer.hns/userReadOnlyBuckets.json';

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
    responseType: 'blob',
    onDownloadProgress: onProgress,
    withCredentials: true,
  });
};

export const encryptAndStoreBucket = async (
  privateKey: string,
  encryptionKey: string,
  bucket: IBucket
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
): Promise<IBucket> => {
  return new Promise(async (resolve, reject) => {
    const jsonCrypto = new JsonCrypto(encryptionKey);
    let bucket: IBucket;

    try {
      const { data } = await skynetSkyDBClient.db.getJSON(
        publicKey,
        SKYTRANSFER_BUCKET
      );

      if (data && data.data && typeof data.data === 'string') {
        bucket = jsonCrypto.decrypt(data.data) as IBucket;
      }

      if (!bucket) {
        console.log("could not fetch bucket!!");
        console.log(data);
        console.log(`publicKey: ${publicKey}`);
        console.log(`encryptionKey: ${encryptionKey}`);
      }

      return resolve(bucket);
    } catch (error) {
      console.error(error);
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

export async function getUserReadWriteHiddenBuckets(
  mySky: MySky
): Promise<IReadWriteBucketsInfo> {
  let buckets: IReadWriteBucketsInfo = {};

  const { data } = await mySky.getJSONEncrypted(
    privateReadWriteUserBucketsPath
  );

  if (data && 'buckets' in data) {
    buckets = data.buckets as IReadWriteBucketsInfo;
  }

  return buckets;
}

export async function getAllUserHiddenBuckets(
  mySky: MySky
): Promise<IBucketsInfo> {
  const readOnly: IReadOnlyBucketsInfo = await getUserReadOnlyHiddenBuckets(
    mySky
  );
  const readWrite: IReadWriteBucketsInfo = await getUserReadWriteHiddenBuckets(
    mySky
  );

  return { readOnly, readWrite };
}

export async function getAllUserDecryptedBuckets(
  mySky: MySky,
  buckets: IBucketsInfo
): Promise<IAllBuckets> {
  let readOnly: IBuckets = {};
  let readWrite: IBuckets = {};

  await Promise.all(
    Object.values(buckets.readOnly).map(async (b) => {
      const dBucket = await getDecryptedBucket(b.publicKey, b.encryptionKey);
      if (dBucket) {
        readOnly[dBucket.uuid] = dBucket;
      }
    })
  );

  await Promise.all(
    Object.values(buckets.readWrite).map(async (b) => {
      const dBucket = await getDecryptedBucket(
        publicKeyFromPrivateKey(b.privateKey),
        b.encryptionKey
      );
      if (dBucket) {
        readWrite[dBucket.uuid] = dBucket;
      }
    })
  );

  return { readOnly, readWrite };
}

export async function getUserReadOnlyHiddenBuckets(
  mySky: MySky
): Promise<IReadOnlyBucketsInfo> {
  let buckets: IReadOnlyBucketsInfo = {};

  const { data } = await mySky.getJSONEncrypted(privateReadOnlyUserBucketsPath);

  if (data && 'buckets' in data) {
    buckets = data.buckets as IReadOnlyBucketsInfo;
  }

  return buckets;
}

export async function storeUserReadWriteHiddenBucket(
  mySky: MySky,
  newBucket: IReadWriteBucketInfo
) {
  let buckets = await getUserReadWriteHiddenBuckets(mySky);

  buckets[newBucket.bucketID] = newBucket;
  try {
    await mySky.setJSONEncrypted(privateReadWriteUserBucketsPath, { buckets });
  } catch (error) {
    throw Error('could not storeUserReadWriteHiddenBucket: ' + error.message);
  }
}

export async function storeUserReadOnlyHiddenBucket(
  mySky: MySky,
  newBucket: IReadOnlyBucketInfo
) {
  let buckets = await getUserReadOnlyHiddenBuckets(mySky);

  buckets[newBucket.bucketID] = newBucket;
  try {
    await mySky.setJSONEncrypted(privateReadOnlyUserBucketsPath, { buckets });
  } catch (error) {
    throw Error('could not storeUserReadOnlyHiddenBucket: ' + error.message);
  }
}

export async function deleteUserReadWriteHiddenBucket(
  mySky: MySky,
  bucketID: string
) {
  let buckets = await getUserReadWriteHiddenBuckets(mySky);
  if (bucketID in buckets) {
    delete buckets[bucketID];
    try {
      await mySky.setJSONEncrypted(privateReadWriteUserBucketsPath, {
        buckets,
      });
    } catch (error) {
      throw Error(
        'could not deleteUserReadWriteHiddenBucket: ' + error.message
      );
    }
  }
}

export async function deleteUserReadOnlyHiddenBucket(
  mySky: MySky,
  bucketID: string
) {
  let buckets = await getUserReadOnlyHiddenBuckets(mySky);
  if (bucketID in buckets) {
    delete buckets[bucketID];
    try {
      await mySky.setJSONEncrypted(privateReadOnlyUserBucketsPath, { buckets });
    } catch (error) {
      throw Error('could not deleteUserReadOnlyHiddenBucket: ' + error.message);
    }
  }
}
