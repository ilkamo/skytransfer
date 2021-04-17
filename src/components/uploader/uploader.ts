import FileUtils from "../../utils/file";

export default class Uploader {
    static chunkSize = 1048576 // 1MB
    static uploadUrl = 'https://ilkamo.hns.siasky.net/skynet/skyfile';

    readonly request: XMLHttpRequest;
    readonly file: File;
    readonly encryptionKey: string;

    currentChunkStartByte: number;
    currentChunkFinalByte: number;

    fileUtils = new FileUtils();

    constructor(file: File, encryptionKey: string) {
        this.request = new XMLHttpRequest();
        this.request.overrideMimeType('application/octet-stream');

        this.file = file;
        this.encryptionKey = encryptionKey;
        this.currentChunkStartByte = 0;
        this.currentChunkFinalByte = Uploader.chunkSize > this.file.size ? this.file.size : Uploader.chunkSize;
    }

    async uploadEncryptedFile() {
        this.request.open('POST', Uploader.uploadUrl, true);

        let chunk: Blob = this.file.slice(this.currentChunkStartByte, this.currentChunkFinalByte);

        chunk = await this.fileUtils.encryptFile(this.encryptionKey, chunk)

        this.request.setRequestHeader('Content-Range', `bytes ${this.currentChunkStartByte}-${this.currentChunkFinalByte}/${this.file.size}`);

        this.request.onload = () => {
            const remainingBytes = this.file.size - this.currentChunkFinalByte;

            if (this.currentChunkFinalByte === this.file.size) {
                console.log('completed');
                return;
            } else if (remainingBytes < Uploader.chunkSize) {
                this.currentChunkStartByte = this.currentChunkFinalByte;
                this.currentChunkFinalByte = this.currentChunkStartByte + remainingBytes;
            }
            else {
                this.currentChunkStartByte = this.currentChunkFinalByte;
                this.currentChunkFinalByte = this.currentChunkStartByte + Uploader.chunkSize;
            }

            this.uploadEncryptedFile();
        }

        const formData = new FormData();
        formData.append('file', chunk, this.file.name);
        console.log("sending chunck");
        this.request.send(formData);
    }
}