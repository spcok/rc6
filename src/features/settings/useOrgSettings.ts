import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orgSettingsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { OrgProfileSettings } from '../../types';

const DEFAULT_SETTINGS: OrgProfileSettings = {
  id: 'profile',
  org_name: 'Kent Owl Academy',
  logo_url: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  zla_license_number: '',
  official_website: '',
  adoption_portal: '',
};

export function useOrgSettings() {
  const queryClient = useQueryClient();

  // 1. FETCH SETTINGS (Online-First)
  const { data: settings = [], isLoading } = useQuery<OrgProfileSettings[]>({
    queryKey: ['orgSettings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('org_settings').select('*');
        if (error) throw error;
        
        // Refresh local vault
        data.forEach(item => orgSettingsCollection.update(item.id, () => item as OrgProfileSettings).catch(() => orgSettingsCollection.insert(item as OrgProfileSettings)));
        
        return data as OrgProfileSettings[];
      } catch {
        console.warn("Network unreachable. Serving from local vault.");
        return await orgSettingsCollection.getAll();
      }
    }
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: OrgProfileSettings) => {
      try {
        const { error } = await supabase.from('org_settings').upsert([newSettings]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Updating settings locally.");
      }
      await orgSettingsCollection.update(newSettings.id, () => newSettings);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orgSettings'] })
  });

  return { 
    settings: settings[0] || DEFAULT_SETTINGS, 
    isLoading, 
    saveSettings: saveSettingsMutation.mutateAsync,
    isMutating: saveSettingsMutation.isPending
  };
}
