import { EncryptedFileReference } from '../models/encryption';
import { FileNode } from '../models/file-tree';

export function renderTree(paths: EncryptedFileReference[]): FileNode[] {
  let result: FileNode[] = [];
  let level = { result };

  paths.forEach((f) => {
    f.relativePath.split('/').reduce((r, name, i, a) => {
      if (!r[name]) {
        r[name] = { result: [] };
        // uuid of the encrypted file is passed as part of the key in order to have a reference to the file and allow download
        r.result.push({
          title: name,
          key: `${f.uuid}_${name}_${i}`,
          children: r[name].result,
          isLeaf: false,
        });
      }

      return r[name];
    }, level);
  });

  calculateLeaf(result);

  return result;
}

function calculateLeaf(fileNode: FileNode[]) {
  fileNode.forEach((e) => {
    if (e.children.length > 0) {
      calculateLeaf(e.children);
    } else {
      delete e.children;
      e.isLeaf = true;
    }
  });
}
