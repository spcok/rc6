import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, RolePermissionConfig } from '../../types';
import { usersCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase } from '../../lib/dataMapping';

export function useUsersData() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('is_deleted', false).limit(2500);
        if (error) throw error;
        
        const mappedData: User[] = data.map((item: Record<string, unknown>) => mapToCamelCase<User>(item));
        
        for (const item of mappedData) {
          try {
            await usersCollection.update(item);
          } catch {
            await usersCollection.insert(item);
          }
        }
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving from local vault.");
        return await usersCollection.getAll();
      }
    }
  });

  const { data: rolePermissions = [], isLoading: isLoadingRoles } = useQuery<RolePermissionConfig[]>({
    queryKey: ['role_permissions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_permissions').select('*');
      if (error) throw error;
      return (data as RolePermissionConfig[]) || [];
    }
  });

  const isLoading = isLoadingUsers || isLoadingRoles;

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<User> }) => {
      const existing = users.find(u => u.id === id);
      if (existing) {
        const updated = { ...existing, ...updates };
        await usersCollection.update(updated);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const existing = users.find(u => u.id === id);
      if (existing) {
        await usersCollection.update({ ...existing, isDeleted: true });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const addUserMutation = useMutation({
    mutationFn: async (userData: { email: string; password?: string; profileData: Partial<User> }) => {
      const { data, error } = await supabase.functions.invoke('create-staff-account', {
        body: userData
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const newUser = data.user as User;
      await usersCollection.insert(newUser);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const updateRolePermissionsMutation = useMutation({
    mutationFn: async ({ role, updates }: { role: string, updates: Partial<RolePermissionConfig> }) => {
      const { error } = await supabase
        .from('role_permissions')
        .update(updates)
        .eq('id', role.toLowerCase());
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['role_permissions'] }),
  });

  return { 
    users: users.filter(u => !u.isDeleted), 
    rolePermissions, 
    isLoading, 
    deleteUser: deleteUserMutation.mutateAsync, 
    addUser: addUserMutation.mutateAsync,
    updateUser: (id: string, updates: Partial<User>) => updateUserMutation.mutateAsync({ id, updates }), 
    updateRolePermissions: (role: string, updates: Partial<RolePermissionConfig>) => updateRolePermissionsMutation.mutateAsync({ role, updates }),
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['role_permissions'] });
    }
  };
}
