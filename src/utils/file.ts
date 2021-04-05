import { EncryptionType, FileEncrypted } from './../models/encryption';
import { SkynetClient, genKeyPairFromSeed } from "skynet-js";
import CryptoJS from "crypto-js";

const skynetClient = new SkynetClient("https://siasky.net");

const ENCRYPTED_FILES_SKYDB_KEY_NAME = "ENCRYPTED_FILES";

class FileUtils {
    private cryptoKey: string;
    private sessionPrivateKey: string;

    constructor(sessionPrivateKey: string) {
        this.sessionPrivateKey = sessionPrivateKey;
        const { privateKey } = genKeyPairFromSeed(`${sessionPrivateKey}-aes-encrypt`);
        this.cryptoKey = privateKey;
    }

    public async encryptFile(file: File): Promise<File> {
        return new Promise((resolve, reject) => {
            const $this = this;
            const reader = new FileReader();

            reader.onload = async function (e) {
                const data = e.target.result;

                const wordArray = CryptoJS.lib.WordArray.create(data);
                const encrypted = CryptoJS.AES.encrypt(wordArray, $this.cryptoKey).toString();

                const fileEnc = new Blob([encrypted]);

                return resolve(new File([fileEnc], file.name));
            };

            reader.onerror = reject

            reader.readAsArrayBuffer(file);
        });
    }

    public async decryptFileFromSkylink(skylink: string): Promise<File> {
        const { data, metadata } = await skynetClient.getFileContent(skylink);
        return this.decryptFile(data, metadata.filename);
    }

    private decryptFile(encryptedData: Blob, filename: string): File {
        var decrypted = CryptoJS.AES.decrypt(encryptedData, this.cryptoKey);
        var typedArray = this.convertWordArrayToUint8Array(decrypted);

        return new File([typedArray], filename);
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

    public async storeSessionEncryptedFiles(fileSkylinks: string[]): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            const encryptedFiles: FileEncrypted[] = [];
            fileSkylinks.forEach((s) => {
                encryptedFiles.push({
                    skylink: s,
                    encryptionType: EncryptionType.AES
                })
            })

            if (encryptedFiles.length == 0) {
                return resolve(false);
            }
            try {
                await skynetClient.db.setJSON(
                    this.sessionPrivateKey,
                    ENCRYPTED_FILES_SKYDB_KEY_NAME,
                    encryptedFiles,
                    undefined,
                    {
                        timeout: 5,
                    },
                );
                return resolve(true);
            } catch (error) {
                return reject(error);
            }
        });
    }
}

export default FileUtils;