import { createContext, useContext } from 'react';

export const LayoutContext = createContext<{ isSidebarCollapsed: boolean }>({ isSidebarCollapsed: false });

export function useLayoutContext() {
  return useContext(LayoutContext);
}
