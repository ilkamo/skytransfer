import { SkynetClient } from 'skynet-js';
import CryptoJS from "crypto-js";
import { EncryptedFileReference } from "../../models/encryption";
import { DECRYPT_CHUNK_SIZE as CHUNK_SIZE, FileDecrypt } from "./crypto";
import { DEFAULT_DOMAIN } from "../../config";
import axios from "axios";


export default class AESFileDecrypt implements FileDecrypt {
    readonly encryptedFile: EncryptedFileReference;
    readonly encryptionKey: string;

    currentChunkStartByte: number;
    currentChunkFinalByte: number;

    skynetClient = new SkynetClient(DEFAULT_DOMAIN);

    parts: BlobPart[] = [];

    constructor(encryptedFile: EncryptedFileReference, encryptionKey: string) {
        this.encryptedFile = encryptedFile;
        this.encryptionKey = encryptionKey;

        this.currentChunkStartByte = 0;
        this.currentChunkFinalByte = CHUNK_SIZE > this.encryptedFile.encryptedSize ? this.encryptedFile.encryptedSize : CHUNK_SIZE;
    }

    async decrypt(
        onDecryptProgress: (
            completed: boolean,
            percentage: number,
        ) => void = () => { },
        onFileDownloadProgress: (
            completed: boolean,
            percentage: number,
        ) => void = () => { },
    ): Promise<File> {
        const url = await this.skynetClient.getSkylinkUrl(this.encryptedFile.skylink);

        let data: Blob;

        try {
            const response = await axios({
                method: 'get',
                url: url,
                responseType: "text",
                onDownloadProgress: progressEvent => {
                    const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                    onFileDownloadProgress(false, progress);
                }
            });

            onFileDownloadProgress(true, 100);
            data = response.data;
        } catch (error) {
            onFileDownloadProgress(true, 0);
        }

        const totalChunks = Math.ceil(this.encryptedFile.encryptedSize / CHUNK_SIZE);

        for (let i = 0; i < totalChunks; i++) {
            let chunkPart: BlobPart;

            if (i === totalChunks - 1) {
                chunkPart = await this.decryptBlob(
                    data.slice(i * CHUNK_SIZE, this.encryptedFile.encryptedSize),
                );
            } else {
                chunkPart = await this.decryptBlob(
                    data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
                );
            }

            const progress = Math.floor(i + 1 / totalChunks * 100);
            onDecryptProgress(false, progress);

            this.parts.push(chunkPart);
        }

        onDecryptProgress(true, 100);

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
