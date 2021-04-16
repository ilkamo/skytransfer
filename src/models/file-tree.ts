export interface FileNode {
    title: string
    key: string
    children?: FileNode[]
    isLeaf: boolean
}

export interface FileRelativePathInfo {
    [uid: string]: string
}