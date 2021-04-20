import { StateContext } from './state';

export enum ActionType {
    READ_ONLY = 'Read only',
    READ_WRITE = 'Read write',
}

export type Action = { type: ActionType.READ_ONLY } | { type: ActionType.READ_WRITE };

export const reducer = (state: StateContext, action: Action) => {
    switch (action.type) {
        case ActionType.READ_ONLY:
            return { ...state, isReadOnlySession: true };
        case ActionType.READ_WRITE:
            return { ...state, isReadOnlySession: false };
        default:
            throw new Error('Not among actions');
    }
};