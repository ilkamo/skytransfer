import _sodium from 'libsodium-wrappers';
import { DEFAULT_ENCRYPTION_TYPE } from '../../config';
import { ChunkResolver } from '../chunk-resolver';
import { v4 as uuid } from 'uuid';

import { FileEncrypt } from '../crypto';

export default class LibSodiumEncrypt implements FileEncrypt {
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
		await _sodium.ready;
		const sodium = _sodium;

		// const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
		// console.log(salt);

		const key = sodium.crypto_pwhash(
			32,
			'test',
			new Uint8Array([205, 67, 127, 1, 224, 165, 214, 180, 138, 199, 11, 200, 105, 139, 223, 45]),
			sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
			sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
			sodium.crypto_pwhash_ALG_ARGON2ID13,
		);

		let res = sodium.crypto_secretstream_xchacha20poly1305_init_push(key);
		let [state_out] = [res.state, res.header];

		console.log([res.state, res.header]);
		

		const totalChunks = Math.ceil(this.file.size / this.encryptChunkSize);

		for (let i = 0; i < totalChunks; i++) {
			let chunkPart: BlobPart;

			if (i === totalChunks - 1) {
				chunkPart = sodium.crypto_secretstream_xchacha20poly1305_push(
					state_out,
					new Uint8Array(await this.file.slice(i * this.encryptChunkSize, this.file.size).arrayBuffer()),
					null,
					sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL,
				);
			} else {
				chunkPart = sodium.crypto_secretstream_xchacha20poly1305_push(
					state_out,
					new Uint8Array(await this.file.slice(
						i * this.encryptChunkSize,
						(i + 1) * this.encryptChunkSize
					).arrayBuffer(),
					),
					null,
					sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE,
				);
			}

			const progress = Math.floor(((i + 1) / totalChunks) * 100);
			onEncryptProgress(false, progress);

			this.parts.push(chunkPart);
		}

		onEncryptProgress(true, 100);

		// The returned file name is a random uuid() in order to not expose the file name to the portal.
		// The correct information is stored in the EncryptedFileReference.
		return new File(this.parts, `skytransfer-${uuid()}`, {
			type: 'text/plain',
		});
	}
}
