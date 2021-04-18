import { SkynetClient } from "skynet-js";

const DEFAULT_DOMAIN = "https://ilkamo.hns.siasky.net";

export const UPLOAD_ENDPOINT = `${DEFAULT_DOMAIN}/skynet/skyfile`;
export const SKYNET_CLIENT = new SkynetClient(DEFAULT_DOMAIN);
export const ENCRYPTED_FILES_SKYDB_KEY_NAME = "ENCRYPTED_FILES";
export const SESSION_KEY_NAME = 'sessionKey';
export const MAX_PARALLEL_UPLOAD = 5;