import { EncryptionType } from '../models/encryption';

interface Encryption {
  encryptChunkSize: number;
  decryptChunkSize: number;
  encryptionType: EncryptionType;
}

const MBSize = 1048576;

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
  {
    encryptChunkSize: MBSize * 128,
    decryptChunkSize: MBSize * 128 + 17,
    encryptionType: EncryptionType.Xchacha20poly1305_128MB,
  },
  {
    encryptChunkSize: MBSize * 256,
    decryptChunkSize: MBSize * 256 + 17,
    encryptionType: EncryptionType.Xchacha20poly1305_256MB,
  },
  {
    encryptChunkSize: MBSize * 512,
    decryptChunkSize: MBSize * 512 + 17,
    encryptionType: EncryptionType.Xchacha20poly1305_512MB,
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
