import { FileData } from "./file-data";

export interface EncryptedFiles {
  [fileRelativePath: string]: EncryptedFile;
}

export class EncryptedFile {
  uuid: string;
  file: FileData;
  created: number;
  name: string;
  modified: number;
  mimeType: string;
  history: FileData[];
  version: number;
}