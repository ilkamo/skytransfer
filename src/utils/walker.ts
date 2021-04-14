// let paths = ["About.vue","Categories/Index.vue","Categories/Demo.vue","Categories/Flavors.vue","Categories/Types/Index.vue","Categories/Types/Other.vue"];

import { EncryptedFileReference } from '../models/encryption';
import { FileNode } from '../models/file-tree'

export function renderTree(paths: EncryptedFileReference[]): FileNode[] {
    let result: FileNode[] = [];
    let level = { result };

    paths.forEach(f => {
        f.relativePath.split('/').reduce((r, name, i, a) => {
            if (!r[name]) {
                r[name] = { result: [] };
                // uuid of the encrypted file is passed as part of the key in order to have a reference to the file and allow download
                r.result.push({ title: name, key: `${f.uuid}_${name}_${i}`, children: r[name].result })
            }

            return r[name];
        }, level)
    })

    return result;
}