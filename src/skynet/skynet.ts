import { PublicSession } from './../models/session';
import { MySky, SkynetClient } from "skynet-js";
import { DEFAULT_DOMAIN, ENCRYPTED_FILES_SKYDB_KEY_NAME } from "../config";
import { JsonCrypto } from "../crypto/json";
import { EncryptedFileReference } from "../models/encryption";

const skynetClient = new SkynetClient(DEFAULT_DOMAIN);

const dataDomain = 'skytransfer.hns';
const sessionsPath = "skytransfer.hns/publicSessions.json";

export const storeEncryptedFiles = async (
    privateKey: string,
    encryptionKey: string,
    encryptedFiles: EncryptedFileReference[],
): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
        if (encryptedFiles.length === 0) {
            return resolve(false);
        }

        const jsonCrypto = new JsonCrypto(encryptionKey);
        const encryptedFilesAsEncryptedString = jsonCrypto.encrypt(encryptedFiles);

        try {
            await skynetClient.db.setJSON(
                privateKey,
                ENCRYPTED_FILES_SKYDB_KEY_NAME,
                {
                    data: encryptedFilesAsEncryptedString,
                },
            );
            return resolve(true);
        } catch (error) {
            return reject(error);
        }
    });
}

export const getEncryptedFiles = async (
    publicKey: string,
    encryptionKey: string,
): Promise<EncryptedFileReference[]> => {
    return new Promise(async (resolve, reject) => {
        const jsonCrypto = new JsonCrypto(encryptionKey);
        let files: EncryptedFileReference[] = [];

        try {
            const { data } = await skynetClient.db.getJSON(
                publicKey,
                ENCRYPTED_FILES_SKYDB_KEY_NAME,
            );

            if (data && data.data && typeof data.data === "string") {
                const decryptedEncryptedFiles = jsonCrypto.decrypt(data.data);
                files = decryptedEncryptedFiles as EncryptedFileReference[];
            }

            return resolve(files);
        } catch (error) {
            return reject(error);
        }
    });
}

export const mySkyLogin = async (): Promise<MySky> => {
    try {
        const client = new SkynetClient("https://siasky.net");
        const mySky = await client.loadMySky(dataDomain);
        const loggedIn = await mySky.checkLogin();
        if (!loggedIn) {
            if (!await mySky.requestLoginAccess()) {
                throw Error("could not login");
            }
        }
        return mySky;
    } catch (e) {
        console.log("mySkyLogin error: ");
        console.error(e);
        throw e;
    }
}

export const getUserPublicSessions = async (): Promise<PublicSession[]> => {
    let sessions: PublicSession[] = [];

    try {
        const mySky = await mySkyLogin();
        const { data } = await mySky.getJSON(sessionsPath);
        sessions = data.sessions as PublicSession[];
    } catch (e) {
        console.log("could not getUserSessions");
        console.error(e);
    }

    return sessions;
}

export const storeUserSession = async (
    newSessions: PublicSession[],
) => {
    try {
        const mySky = await mySkyLogin();

        let sessions = await getUserPublicSessions();
        sessions = [...sessions, ...newSessions];

        await mySky.setJSON(sessionsPath, { sessions });
    } catch (e) {
        console.log("could not storeUserSession:");
        console.error(e);
    }
}
