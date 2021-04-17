import CryptoJS from "crypto-js";

import { EncryptedFileReference } from "../../models/encryption";
import { DECRYPT_CHUNK_SIZE as CHUNK_SIZE, SKYNET_CLIENT } from "./crypto";

export default class FileDecrypt {
    readonly encryptedFile: EncryptedFileReference;
    readonly encryptionKey: string;

    currentChunkStartByte: number;
    currentChunkFinalByte: number;

    parts: BlobPart[] = [];

    constructor(encryptedFile: EncryptedFileReference, encryptionKey: string) {
        this.encryptedFile = encryptedFile;
        this.encryptionKey = encryptionKey;

        this.currentChunkStartByte = 0;
        this.currentChunkFinalByte = CHUNK_SIZE > this.encryptedFile.size ? this.encryptedFile.size : CHUNK_SIZE;
    }

    async decrypt(): Promise<File> {
        const { data } = await SKYNET_CLIENT.getFileContent(this.encryptedFile.skylink);

        const totalChunks = Math.ceil(this.encryptedFile.size / CHUNK_SIZE);

        for (let i = 0; i < totalChunks; i++) {
            let chunkPart: BlobPart;

            if (i === totalChunks - 1) {
                chunkPart = await this.decryptBlob(
                    data.slice(i * CHUNK_SIZE, this.encryptedFile.size),
                );
            } else {
                chunkPart = await this.decryptBlob(
                    data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
                );
            }

            this.parts.push(chunkPart);
        }

        const fileEnc = new Blob(this.parts, { type: this.encryptedFile.mimeType });

        return new File([fileEnc], this.encryptedFile.fileName, { type: this.encryptedFile.mimeType });
    }

    private decryptBlob(encryptedData: Blob): BlobPart {
        var decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
        var typedArray = this.convertWordArrayToUint8Array(decrypted);

        return typedArray;
    }

    private convertWordArrayToUint8Array(wordArray) {
        const arrayOfWords = wordArray.hasOwnProperty("words") ? wordArray.words : [];
        const length = wordArray.hasOwnProperty("sigBytes") ? wordArray.sigBytes : arrayOfWords.length * 4;
        let uInt8Array = new Uint8Array(length), index = 0, word, i;
        for (i = 0; i < length; i++) {
            word = arrayOfWords[i];
            uInt8Array[index++] = word >> 24;
            uInt8Array[index++] = (word >> 16) & 0xff;
            uInt8Array[index++] = (word >> 8) & 0xff;
            uInt8Array[index++] = word & 0xff;
        }
        return uInt8Array;
    }
}
