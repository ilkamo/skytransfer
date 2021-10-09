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
    decryptChunkSize: MBSize * 4 + 17,
    encryptionType: EncryptionType.Xchacha20poly1305_4MB,
  },
  {
    encryptChunkSize: MBSize * 8,
    decryptChunkSize: MBSize * 8 + 17,
    encryptionType: EncryptionType.Xchacha20poly1305_8MB,
  },
  {
    encryptChunkSize: MBSize * 16,
    decryptChunkSize: MBSize * 16 + 17,
    encryptionType: EncryptionType.Xchacha20poly1305_16MB,
  },
  {
    encryptChunkSize: MBSize * 32,
    decryptChunkSize: MBSize * 32 + 17,
    encryptionType: EncryptionType.Xchacha20poly1305_32MB,
  },
  {
    encryptChunkSize: MBSize * 64,
    decryptChunkSize: MBSize * 64 + 17,
    encryptionType: EncryptionType.Xchacha20poly1305_64MB,
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
