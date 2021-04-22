import { SkynetClient } from "skynet-js";
import { DEFAULT_DOMAIN, ENCRYPTED_FILES_SKYDB_KEY_NAME } from "../config";
import { JsonCrypto } from "../crypto/json";
import { EncryptedFileReference } from "../models/encryption";
import { Session, Sessions } from "../models/session";
import { v4 as uuid } from 'uuid';

const skynetClient = new SkynetClient(DEFAULT_DOMAIN);

const dataDomain = 'skytransfer.hns';
const sessionsPath = "skytransfer.hns/sessions.json";

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

// The encryption key should be derived from user private key.
// No needed when mysky will introduce hidden files.
export const getUserSessions = async (encryptionKey: string): Promise<Sessions> => {
    const mySky = await skynetClient.loadMySky(dataDomain);
    const loggedIn = await mySky.checkLogin();
    if (!loggedIn) {
        return;
    }

    const jsonCrypto = new JsonCrypto(encryptionKey);

    let sessions: Sessions = {};
    try {
        const { data } = await mySky.getJSON(sessionsPath);
        if (data.encryptedData && typeof data.encryptedData === "string") {
            sessions = jsonCrypto.decrypt(data.encryptedData);
        }
    } catch (e) {
        console.log("could not getUserSessions: " + e);
    }

    return sessions;
}

// The encryption key should be derived from user private key.
// No needed when mysky will introduce hidden files.
export const storeUserSession = async (
    encryptionKey: string,
    sessionName: string,
    sessionKey: string,
) => {
    try {
        const mySky = await skynetClient.loadMySky(dataDomain);
        const loggedIn = await mySky.checkLogin();
        if (!loggedIn) {
            return;
        }

        const jsonCrypto = new JsonCrypto(encryptionKey);

        let sessions: Sessions = {};
        sessions = await getUserSessions(encryptionKey);

        const sessionUUID = uuid();

        const newSession: Session = {
            id: sessionUUID,
            name: sessionName,
            key: sessionKey,
            createdAt: new Date().getTime(),
        }

        sessions[sessionUUID] = newSession;

        const encryptedSessions = jsonCrypto.encrypt(sessions);
        await mySky.setJSON(sessionsPath, { encryptedData: encryptedSessions });
    } catch (e) {
        console.log("could not storeUserSession: " + e);
    }
}
