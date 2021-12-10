import { EncryptionType } from './models/encryption';

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

export const DEFAULT_ENCRYPTION_TYPE = EncryptionType.Xchacha20poly1305_256MB;
export const WEB_WORKER_URL = './webworker.bundle.js';

export const TUS_CHUNK_SIZE = (1 << 22) * 10;
/**
 * The retry delays, in ms. Data is stored in skyd for up to 20 minutes, so the
 * total delays should not exceed that length of time.
 */
export const DEFAULT_TUS_RETRY_DELAYS = [0, 5000, 15000, 60000, 300000, 600000];
