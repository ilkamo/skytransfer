import { EncryptionType } from '../models/encryption';

interface Encryption {
  encryptChunkSize: number;
  decryptChunkSize: number;
  encryptionType: EncryptionType;
}

const MBSize = 1048576;

// https://blog.jim-nielsen.com/2020/export-to-html-from-javascript-using-blob-urls/
// There are different types of chunk size encryptChunkSize/decryptChunkSize because of how js works with bytes.
// During encryption, file is splitted in chunks of encryptChunkSize.
// Once the file is encrypted, its size is bigger (additional 33%) of overhead.
// During the decription, this information if needed to correctly decrypt the chunks.
const encryptions: Encryption[] = [
  {
    encryptChunkSize: MBSize * 4,
    decryptChunkSize: 5592448,
    encryptionType: EncryptionType.AES_4MB,
  },
  {
    encryptChunkSize: MBSize * 8,
    decryptChunkSize: 11184856,
    encryptionType: EncryptionType.AES_8MB,
  },
  {
    encryptChunkSize: MBSize * 16,
    decryptChunkSize: 22369664,
    encryptionType: EncryptionType.AES_16MB,
  },
  {
    encryptChunkSize: MBSize * 32,
    decryptChunkSize: 44739288,
    encryptionType: EncryptionType.AES_32MB,
  },
  {
    encryptChunkSize: MBSize * 64,
    decryptChunkSize: 89478528,
    encryptionType: EncryptionType.AES_64MB,
  },
];

export class ChunkResolver {
  private encryptionType: EncryptionType;

  constructor(encryptionType: EncryptionType) {
    this.encryptionType = encryptionType;
  }

  get encryptChunkSize(): number {
    const found = encryptions.find(
      (e) => e.encryptionType === this.encryptionType
    ).encryptChunkSize;
    return found ? found : encryptions[0].encryptChunkSize;
  }

  get decryptChunkSize(): number {
    const found = encryptions.find(
      (e) => e.encryptionType === this.encryptionType
    ).decryptChunkSize;
    return found ? found : encryptions[0].decryptChunkSize;
  }
}
