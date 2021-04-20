import React, { useContext, useReducer } from 'react';

import { reducer, Action } from './reducer';

export interface StateContext {
  isReadOnlySession: boolean;
}
export interface Store {
  state: StateContext;
  dispatch?: React.Dispatch<Action>;
}

const defaultState: StateContext = { isReadOnlySession: false };

export const ctx = React.createContext<Store>({ state: defaultState });

export const useStateContext = () => useContext(ctx);

export const ApplicationStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, defaultState);
  return <ctx.Provider value={{ state, dispatch }} children={children} />;
};

export default ApplicationStateProvider;
