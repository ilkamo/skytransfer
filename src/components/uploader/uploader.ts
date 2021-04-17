import FileUtils from "../../utils/file";

export default class FileUploader {
    static chunkSize = 1048576 // 1MB
    static uploadUrl = 'https://ilkamo.hns.siasky.net/skynet/skyfile';

    readonly request: XMLHttpRequest;
    readonly file: File;
    readonly encryptionKey: string;

    currentChunkStartByte: number;
    currentChunkFinalByte: number;

    readonly options;

    fileUtils = new FileUtils();

    constructor(file: File, encryptionKey: string, options) {
        this.request = new XMLHttpRequest();
        this.request.overrideMimeType('application/octet-stream');

        this.file = file;
        this.encryptionKey = encryptionKey;
        this.options = options;

        this.currentChunkStartByte = 0;
        this.currentChunkFinalByte = FileUploader.chunkSize > this.file.size ? this.file.size : FileUploader.chunkSize;
    }

    async upload() {
        this.request.open('POST', FileUploader.uploadUrl, true);

        let chunk: Blob = this.file.slice(this.currentChunkStartByte, this.currentChunkFinalByte);

        chunk = await this.fileUtils.encryptFile(this.encryptionKey, chunk)

        this.request.setRequestHeader('Content-Range', `bytes ${this.currentChunkStartByte}-${this.currentChunkFinalByte}/${this.file.size}`);

        this.request.onload = () => {
            const remainingBytes = this.file.size - this.currentChunkFinalByte;

            if (this.currentChunkFinalByte === this.file.size) {
                this.options.onSuccess("ok")
                console.log('completed');
                return;
            } else if (remainingBytes < FileUploader.chunkSize) {
                this.currentChunkStartByte = this.currentChunkFinalByte;
                this.currentChunkFinalByte = this.currentChunkStartByte + remainingBytes;
            }
            else {
                this.currentChunkStartByte = this.currentChunkFinalByte;
                this.currentChunkFinalByte = this.currentChunkStartByte + FileUploader.chunkSize;
            }

            this.upload();
        }

        this.request.onerror = (e) => {
            this.options.onError(e);
        }

        const formData = new FormData();
        formData.append('file', chunk, this.file.name);
        console.log("sending chunck");
        this.request.send(formData);
    }
}