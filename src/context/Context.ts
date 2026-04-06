import { createContext, useContext } from 'react';
import { OrgProfile, User, Shift } from '../types';
export interface AppContextType {
  db: unknown;
  foodOptions: string[];
  feedMethods: Record<string, string[]>;
  eventTypes: string[];
  activeShift: Shift | null;
  clockIn: (initials: string) => Promise<void>;
  clockOut: () => Promise<void>;
  orgProfile: OrgProfile;
  users: User[];
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppData = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppProvider');
  }
  return context;
};
