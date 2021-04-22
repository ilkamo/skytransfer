export interface Session {
    id: string
    name: string
    key: string
    createdAt: number // timestamp
}

export interface Sessions {
    [sessionUUID: string]: Session
}
