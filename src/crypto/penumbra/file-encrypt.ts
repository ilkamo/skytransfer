import { penumbra } from '@transcend-io/penumbra';
import { DEFAULT_ENCRYPTION_TYPE } from '../../config';
import { ChunkResolver } from '../chunk-resolver';

import { FileEncrypt } from '../crypto';

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
		) => void = () => { }
	): Promise<File> {
		// TODO: why is undefined???????
		console.log(penumbra);
		const [encrypted] = await penumbra.encrypt(null, {
			stream: this.file.stream(),
			size: this.file.size,
		});

		const options = await penumbra.getDecryptionInfo(encrypted);
		console.log(options);

		window.addEventListener(
			'penumbra-progress',
			(e) => {
				console.log(e);
			},
		);

		return this.file;
	}
}
