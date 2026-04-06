import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { RolePermissionConfig } from '../types';

export const useRoleSettings = () => {
  const queryClient = useQueryClient();

  const { data: roles, isLoading: isQueryLoading } = useQuery<RolePermissionConfig[]>({
    queryKey: ['role_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ role, permissionKey, newValue }: { role: string, permissionKey: string, newValue: boolean }) => {
      const { data } = await supabase
        .from('role_permissions')
        .select('id')
        .ilike('role', role.trim())
        .maybeSingle();

      if (data) {
        await supabase
          .from('role_permissions')
          .update({ [permissionKey]: newValue })
          .eq('id', data.id);
      } else {
        await supabase
          .from('role_permissions')
          .insert({ role: role.toLowerCase(), [permissionKey]: newValue });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_settings'] });
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });

  return {
    roles: roles || [],
    handlePermissionChange: mutation.mutate,
    isLoading: isQueryLoading || mutation.isPending,
  };
};
