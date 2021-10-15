export interface IFileNode {
  title: string;
  key: string;
  children?: IFileNode[];
  isLeaf: boolean;
}
