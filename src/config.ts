import { EncryptionType } from "./models/encryption";

export const DEFAULT_DOMAIN = 'https://skytransfer.hns.siasky.net';

export const UPLOAD_ENDPOINT = `${DEFAULT_DOMAIN}/skynet/skyfile`;
export const ENCRYPTED_FILES_SKYDB_KEY_NAME = 'ENCRYPTED_FILES';
export const SESSION_KEY_NAME = 'transferSessionKey';
export const MAX_PARALLEL_UPLOAD = 5;
export const MAX_AXIOS_RETRIES = 3;

// When the user uploads a tone of files is good to sync SkyDB periodically 
// in order to not lose the upload in case of errors.
// The intervalled sync is executed when:
// there are more than SKYDB_SYNC_FACTOR files to sync in SkyDB and 
// more than MIN_SKYDB_SYNC_FACTOR files to upload.
export const SKYDB_SYNC_FACTOR = 10;
export const MIN_SKYDB_SYNC_FACTOR = 5;

export const DEFAULT_ENCRYPTION_TYPE = EncryptionType.AES_32MB;
