import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orgSettingsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase } from '../../lib/dataMapping';
import { OrgProfileSettings } from '../../types';

// Enforce camelCase in the frontend default state
const DEFAULT_SETTINGS: OrgProfileSettings = {
  id: 'profile',
  orgName: 'Kent Owl Academy',
  logoUrl: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  zlaLicenseNumber: '',
  officialWebsite: '',
  adoptionPortal: '',
};

export function useOrgSettings() {
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery<OrgProfileSettings[]>({
    queryKey: ['orgSettings'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('org_settings').select('*');
        if (error) throw error;
        
        // ACL: Map snake_case to camelCase
        const mappedData: OrgProfileSettings[] = data.map((item: Record<string, unknown>) => mapToCamelCase<OrgProfileSettings>(item));
        
        // Single Draft Object Local Cache Sync
        for (const item of mappedData) {
          try {
            await orgSettingsCollection.update(item);
          } catch {
            await orgSettingsCollection.insert(item);
          }
        }
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving from local vault.");
        return await orgSettingsCollection.getAll();
      }
    }
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: OrgProfileSettings) => {
      // Payload Integrity: Map camelCase back to snake_case for Supabase
      const supabasePayload = {
        id: newSettings.id,
        org_name: newSettings.orgName,
        logo_url: newSettings.logoUrl,
        contact_email: newSettings.contactEmail,
        contact_phone: newSettings.contactPhone,
        address: newSettings.address,
        zla_license_number: newSettings.zlaLicenseNumber,
        official_website: newSettings.officialWebsite,
        adoption_portal: newSettings.adoptionPortal,
      };

      try {
        const { error } = await supabase.from('org_settings').upsert([supabasePayload]);
        if (error) throw error;
      } catch {
        console.warn("Offline: Updating settings locally.");
      }
      
      // Strict Adapter Single Draft Sync
      await orgSettingsCollection.update(newSettings);
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