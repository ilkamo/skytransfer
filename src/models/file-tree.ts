export interface FileNode {
    title: string
    key: string
    children?: FileNode[]
}

export interface FileRelativePathInfo {
    [uid: string]: string
}