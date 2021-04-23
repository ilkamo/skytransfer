export interface Session {
    id: string
    name: string
    key: string
    createdAt: number // timestamp
}

export interface PublicSession {
    id: string
    name: string
    link: string
    createdAt: number // timestamp
}
