import { EncryptionType } from "./models/encryption";

export const SKYTRANSFER_BUCKET = 'SKYTRANSFER_BUCKET';
export const BUCKET_PRIVATE_KEY_NAME = 'BUCKET_PRIVATE_KEY';
export const BUCKET_ENCRYPTION_KEY_NAME = 'BUCKET_ENCRYPTION_KEY';
export const MAX_PARALLEL_UPLOAD = 5;
export const MAX_AXIOS_RETRIES = 3;

// When the user uploads a tone of files to sync SkyDB periodically 
// in order to not lose the upload in case of errors.
// The intervalled sync is executed when:
// there are more than SKYDB_SYNC_FACTOR files to sync in SkyDB and 
// more than MIN_SKYDB_SYNC_FACTOR files to upload.
export const SKYDB_SYNC_FACTOR = 10;
export const MIN_SKYDB_SYNC_FACTOR = 5;

export const DEFAULT_ENCRYPTION_TYPE = EncryptionType.Xchacha20poly1305_16MB;
