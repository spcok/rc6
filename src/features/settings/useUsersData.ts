import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { User, RolePermissionConfig } from '../../types';
import { usersCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';

export function useUsersData() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: isLoadingUsers } = useLiveQuery((q) => q.from({ users: usersCollection }));

  // Note: Role permissions are not yet in a collection, keeping as is for now or refactoring if needed.
  // Assuming role_permissions is still fetched via supabase directly if not in database.ts
  const { data: rolePermissions = [], isLoading: isLoadingRoles } = useLiveQuery((q) => q.from({ role_permissions: usersCollection })); // Placeholder

  const isLoading = isLoadingUsers || isLoadingRoles;

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<User> }) => {
      const existing = users.find(u => u.id === id);
      if (existing) {
        await usersCollection.update({ ...existing, ...updates });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const existing = users.find(u => u.id === id);
      if (existing) {
        await usersCollection.update({ ...existing, is_deleted: true });
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

  // Role permissions mutation needs to be kept as is if not in database.ts
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
    users: users.filter(u => !u.is_deleted), 
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
