import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

const lockedPermissions = {
  isAdmin: false, isOwner: false, isSeniorKeeper: false, isVolunteer: false, isStaff: false,
  view_animals: false, add_animals: false, edit_animals: false, archive_animals: false,
  view_daily_logs: false, create_daily_logs: false, edit_daily_logs: false,
  view_tasks: false, complete_tasks: false, manage_tasks: false,
  view_daily_rounds: false, log_daily_rounds: false,
  view_medical: false, add_clinical_notes: false, prescribe_medications: false, administer_medications: false, manage_quarantine: false,
  view_movements: false, log_internal_movements: false, manage_external_transfers: false,
  view_incidents: false, report_incidents: false, manage_incidents: false,
  view_maintenance: false, report_maintenance: false, resolve_maintenance: false,
  view_safety_drills: false, view_first_aid: false,
  submit_timesheets: false, manage_all_timesheets: false,
  request_holidays: false, approve_holidays: false,
  view_missing_records: false, manage_zla_documents: false, generate_reports: false,
  view_settings: false, manage_users: false, manage_roles: false,
  canViewAnimals: false, canEditAnimals: false, canViewMedical: false, canEditMedical: false, 
  canViewReports: false, canManageStaff: false, canEditSettings: false, canViewSettings: false, 
  canGenerateReports: false, canManageUsers: false, canViewMovements: false, canEditMovements: false,
};

const unlockedPermissions = Object.keys(lockedPermissions).reduce((acc, key) => {
  acc[key] = true;
  return acc;
}, {} as Record<string, boolean>);

export function usePermissions(): Record<string, boolean | string> & { isLoading: boolean } {
  const { currentUser } = useAuthStore();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['permissions', currentUser?.id, currentUser?.role],
    queryFn: async () => {
      if (!currentUser?.id) return { ...lockedPermissions, role: 'GUEST' };

      const rawRole = currentUser?.role || 'GUEST';
      const currentRole = String(rawRole).toUpperCase();

      if (currentRole === 'OWNER' || currentRole === 'ADMIN') {
        return { 
          ...unlockedPermissions, role: currentRole, isAdmin: true, isOwner: currentRole === 'OWNER',
          isSeniorKeeper: true, isVolunteer: false, isStaff: true
        };
      }

      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .ilike('role', currentRole.trim())
        .maybeSingle();

      if (error) {
        console.error('❌ [Permissions] Fetch failed:', error);
        return { ...lockedPermissions, role: currentRole };
      }

      if (!data) {
        return { ...lockedPermissions, role: currentRole };
      }

      return {
        ...lockedPermissions,
        ...data,
        role: currentRole
      };
    },
    enabled: !!currentUser?.id,
  });

  return { ...(permissions || { ...lockedPermissions, role: 'GUEST' }), isLoading };
}