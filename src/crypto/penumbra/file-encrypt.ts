import { penumbra as penumbraFromLib } from '@transcend-io/penumbra';
import { DEFAULT_ENCRYPTION_TYPE } from '../../config';
import { ChunkResolver } from '../chunk-resolver';

import { FileEncrypt } from '../crypto';

const penumbra = window.self.penumbra || penumbraFromLib;

export default class PenumbraEncrypt implements FileEncrypt {
  private file: File;
  private encryptionKey: string;
  private chunkResolver: ChunkResolver;

  parts: BlobPart[] = [];

  constructor(file: File, encryptionKey: string) {
    this.file = file;
    this.encryptionKey = encryptionKey;
    this.chunkResolver = new ChunkResolver(DEFAULT_ENCRYPTION_TYPE);
  }

  get encryptChunkSize(): number {
    return this.chunkResolver.encryptChunkSize;
  }

  async encrypt(
    onEncryptProgress: (
      completed: boolean,
      percentage: number
    ) => void = () => {}
  ): Promise<File> {
    window.addEventListener('penumbra-progress', (e) =>
      console.log(e.type, (<any>e).detail)
    );
    window.addEventListener('penumbra-complete', (e) =>
      console.log(e.type, (<any>e).detail)
    );
    const [encrypted] = await penumbra.encrypt(null, {
      stream: this.file.stream(),
      size: this.file.size,
    });
    const options = await penumbra.getDecryptionInfo(encrypted);
    console.log(options);
    debugger;

    return this.file;
  }
}
