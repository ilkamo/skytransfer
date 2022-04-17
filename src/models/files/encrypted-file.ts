import { IFileData } from './file-data';

export interface IEncryptedFiles {
  [fileRelativePath: string]: IEncryptedFile;
}

export class IEncryptedFile {
  uuid: string;
  file: IFileData;
  created: number;
  name: string;
  modified: number;
  mimeType: string;
  history: IFileData[];
  version: number;
}
