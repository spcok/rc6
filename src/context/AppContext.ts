import { createContext, useContext } from 'react';

export interface AppContextType {
  orgProfile: {
    name: string;
    logo_url: string;
  };
  isLoading: boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const DEFAULT_ORG_PROFILE = {
  name: 'Kent Owl Academy',
  logo_url: '',
};

export const useAppData = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppProvider');
  }
  return context;
};
