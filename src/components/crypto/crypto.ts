import { SkynetClient } from 'skynet-js';

export const ENCRYPT_CHUNK_SIZE = 1048576 * 4  // 4MB
export const DECRYPT_CHUNK_SIZE = 5592448  // Find how to calculate it automatically from ENCRYPT_CHUNK_SIZE

export const SKYNET_CLIENT = new SkynetClient("https://ilkamo.hns.siasky.net");