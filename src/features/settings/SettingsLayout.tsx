import React from 'react';
import { useNavigate, Outlet, useLocation } from '@tanstack/react-router';
import { 
  ShieldCheck, Users, FileText, Brain, 
  List, Building, Bug,
  History, Activity
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';

const SettingsLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = usePermissions();

  const tabs = [
    { id: 'organization', label: 'Organisation Profile', icon: Building, permission: 'view_settings' },
    { id: 'directory', label: 'Directory', icon: Users, permission: 'manage_users' },
    { id: 'lists', label: 'Operational Lists', icon: List, permission: 'view_settings' },
    { id: 'health', label: 'System Health', icon: Activity, permission: 'view_settings' },
    { id: 'access', label: 'Access Control', icon: ShieldCheck, permission: 'manage_roles' },
    { id: 'zla', label: 'ZLA Documents', icon: FileText, permission: 'manage_zla_documents' },
    { id: 'bugs', label: 'Bug Reports', icon: Bug, permission: 'manage_incidents' },
    { id: 'intelligence', label: 'Intelligence', icon: Brain, permission: 'view_settings' },
    { id: 'changelog', label: 'Changelog', icon: History, permission: 'view_settings' },
  ];

  const visibleTabs = tabs.filter(t => !t.permission || permissions[t.permission as keyof typeof permissions]);

  const currentTab = location.pathname.split('/').pop() || 'organization';

  return (
    <div className="p-2 md:p-4 max-w-[1920px] mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">System Settings</h1>
      <div className="flex gap-6">
        <nav className="w-64 space-y-1">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate({ to: `/settings/${t.id}` })}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                currentTab === t.id 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <t.icon size={18} />
              {t.label}
            </button>
          ))}
        </nav>
        <main className="flex-1 bg-slate-50 p-2 md:p-4 rounded-2xl border border-slate-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SettingsLayout;
