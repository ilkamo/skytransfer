import CryptoJS from "crypto-js";

import { ENCRYPT_CHUNK_SIZE as CHUNK_SIZE, FileEncrypt } from "./crypto";

export default class AESFileEncrypt implements FileEncrypt {
    readonly file: File;
    readonly encryptionKey: string;

    currentChunkStartByte: number;
    currentChunkFinalByte: number;

    parts: BlobPart[] = [];

    constructor(file: File, encryptionKey: string) {
        this.file = file;
        this.encryptionKey = encryptionKey;

        this.currentChunkStartByte = 0;
        this.currentChunkFinalByte = CHUNK_SIZE > this.file.size ? this.file.size : CHUNK_SIZE;
    }

    async encrypt(
        onEncryptProgress: (
            completed: boolean,
            percentage: number,
        ) => void = () => { },
    ): Promise<File> {
        const totalChunks = Math.ceil(this.file.size / CHUNK_SIZE);

        for (let i = 0; i < totalChunks; i++) {
            let chunkPart: BlobPart;

            if (i === totalChunks - 1) {
                chunkPart = await this.encryptBlob(
                    this.file.slice(i * CHUNK_SIZE, this.file.size),
                );
            } else {
                chunkPart = await this.encryptBlob(
                    this.file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
                );
            }

            const progress = Math.floor(i + 1 / totalChunks * 100);
            onEncryptProgress(false, progress);

            this.parts.push(chunkPart);
        }

        onEncryptProgress(true, 100);

        const fileEnc = new Blob(this.parts, { type: this.file.type });

        return new File([fileEnc], this.file.name, { type: this.file.type });
    }

    private async encryptBlob(fileBlob: Blob): Promise<BlobPart> {
        const $this = this;
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async function (e) {
                const data = e.target.result;

                const wordArray = CryptoJS.lib.WordArray.create(data);
                const encrypted = CryptoJS.AES.encrypt(wordArray, $this.encryptionKey).toString();

                return resolve(encrypted);
            };

            reader.onerror = reject

            reader.readAsArrayBuffer(fileBlob);
        });
    }
}
