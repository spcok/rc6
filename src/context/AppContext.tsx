import React, { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { OrgProfileSettings } from '../types';
import { AppContext, AppContextType, DEFAULT_ORG_PROFILE } from './AppContext';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['org_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('id', 'profile')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return (data as OrgProfileSettings) || null;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const value: AppContextType = {
    orgProfile: {
      name: settings?.org_name || DEFAULT_ORG_PROFILE.name,
      logo_url: settings?.logo_url || DEFAULT_ORG_PROFILE.logo_url,
    },
    isLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
