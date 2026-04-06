import { createRouter, createRoute, createRootRoute, redirect, Outlet } from '@tanstack/react-router';
import { AuthGuard } from './components/auth/AuthGuard';
import Layout from './components/layout/Layout';
import LoginScreen from './features/auth/LoginScreen';

// Physical File Map Imports
import DashboardContainer from './features/dashboard/DashboardContainer';
import AnimalsList from './features/animals/AnimalsList';
import AnimalProfile from './features/animals/AnimalProfile';
import MedicalRecords from './features/medical/MedicalRecords';
import Movements from './features/logistics/Movements';
import FlightRecords from './features/logistics/FlightRecords';
import StaffRota from './features/staff/StaffRota';
import Timesheets from './features/staff/Timesheets';
import Holidays from './features/staff/Holidays';
import MissingRecords from './features/compliance/MissingRecords';
import ReportsDashboard from './features/reports/ReportsDashboard';
import HelpSupport from './features/help/HelpSupport';
import SettingsLayout from './features/settings/SettingsLayout';
import DailyLog from './features/husbandry/DailyLog';
import DailyRounds from './features/husbandry/DailyRounds';
import Tasks from './features/husbandry/Tasks';
import FeedingSchedule from './features/husbandry/FeedingSchedule';
import SiteMaintenance from './features/safety/tabs/SiteMaintenance';
import FirstAid from './features/safety/tabs/FirstAid';
import Incidents from './features/safety/tabs/Incidents';
import SafetyDrills from './features/safety/tabs/SafetyDrills';

// Settings Tabs (Preserved for SettingsLayout functionality)
import OrgProfile from './features/settings/tabs/OrgProfile';
import Directory from './features/settings/tabs/Directory';
import OperationalLists from './features/settings/tabs/OperationalLists';
import SystemHealth from './features/settings/tabs/SystemHealth';
import AccessControl from './features/settings/tabs/AccessControl';
import ZLADocuments from './features/settings/tabs/ZLADocuments';
import BugReports from './features/settings/tabs/BugReports';
import Intelligence from './features/settings/tabs/Intelligence';
import Changelog from './features/settings/tabs/Changelog';

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginScreen,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  loader: () => {
    return {};
  },
  component: () => (
    <AuthGuard>
      <Layout />
    </AuthGuard>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/dashboard',
  component: DashboardContainer,
});

// Animals
const animalsRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/animals',
});

const animalsIndexRoute = createRoute({
  getParentRoute: () => animalsRoute,
  path: '/',
  component: AnimalsList,
});

const animalProfileRoute = createRoute({
  getParentRoute: () => animalsRoute,
  path: '/$id',
  component: AnimalProfile,
});

// Husbandry Layout (Pathless)
const husbandryRoute = createRoute({
  getParentRoute: () => authRoute,
  id: 'husbandry-layout',
});

const dailyLogRoute = createRoute({
  getParentRoute: () => husbandryRoute,
  path: '/daily-log',
  component: DailyLog,
});

const dailyRoundsRoute = createRoute({
  getParentRoute: () => husbandryRoute,
  path: '/daily-rounds',
  component: DailyRounds,
});

const tasksRoute = createRoute({
  getParentRoute: () => husbandryRoute,
  path: '/tasks',
  component: Tasks,
});

const feedingScheduleRoute = createRoute({
  getParentRoute: () => husbandryRoute,
  path: '/feeding-schedule',
  component: FeedingSchedule,
});

// Medical
const medicalRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/medical',
  component: MedicalRecords,
});

// Logistics Layout (Pathless)
const logisticsRoute = createRoute({
  getParentRoute: () => authRoute,
  id: 'logistics-layout',
});

const movementsRoute = createRoute({
  getParentRoute: () => logisticsRoute,
  path: '/movements',
  component: Movements,
});

const flightsRoute = createRoute({
  getParentRoute: () => logisticsRoute,
  path: '/flights',
  component: FlightRecords,
});

// Staff Layout (Pathless)
const staffRoute = createRoute({
  getParentRoute: () => authRoute,
  id: 'staff-layout',
});

const rotaRoute = createRoute({
  getParentRoute: () => staffRoute,
  path: '/staff-rota',
  component: StaffRota,
});

const timesheetsRoute = createRoute({
  getParentRoute: () => staffRoute,
  path: '/staff-timesheets',
  component: Timesheets,
});

const holidaysRoute = createRoute({
  getParentRoute: () => staffRoute,
  path: '/staff-holidays',
  component: Holidays,
});

// Reports Layout (Pathless)
const reportsRoute = createRoute({
  getParentRoute: () => authRoute,
  id: 'reports-layout',
});

const reportsDashboardRoute = createRoute({
  getParentRoute: () => reportsRoute,
  path: '/reports',
  component: ReportsDashboard,
});

const complianceRoute = createRoute({
  getParentRoute: () => reportsRoute,
  path: '/compliance',
  component: MissingRecords,
});

// Help
const helpRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/help',
  component: HelpSupport,
});

// Safety Layout (Pathless)
const safetyRoute = createRoute({
  getParentRoute: () => authRoute,
  id: 'safety-layout',
});

const maintenanceRoute = createRoute({
  getParentRoute: () => safetyRoute,
  path: '/site-maintenance',
  component: SiteMaintenance,
});

const incidentsRoute = createRoute({
  getParentRoute: () => safetyRoute,
  path: '/incidents',
  component: Incidents,
});

const firstAidRoute = createRoute({
  getParentRoute: () => safetyRoute,
  path: '/first-aid',
  component: FirstAid,
});

const drillsRoute = createRoute({
  getParentRoute: () => safetyRoute,
  path: '/safety-drills',
  component: SafetyDrills,
});

// Settings
const settingsRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/settings',
  component: SettingsLayout,
});

const settingsIndexRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/settings/organization' });
  },
});

const settingsOrgRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/organization',
  component: OrgProfile,
});

const settingsDirectoryRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/directory',
  component: Directory,
});

const settingsListsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/lists',
  component: OperationalLists,
});

const settingsHealthRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/health',
  component: SystemHealth,
});

const settingsAccessRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/access',
  component: AccessControl,
});

const settingsZlaRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/zla',
  component: ZLADocuments,
});

const settingsBugsRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/bugs',
  component: BugReports,
});

const settingsIntelligenceRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/intelligence',
  component: Intelligence,
});

const settingsChangelogRoute = createRoute({
  getParentRoute: () => settingsRoute,
  path: '/changelog',
  component: Changelog,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  authRoute.addChildren([
    indexRoute,
    dashboardRoute,
    animalsRoute.addChildren([animalsIndexRoute, animalProfileRoute]),
    husbandryRoute.addChildren([
      dailyLogRoute,
      dailyRoundsRoute,
      tasksRoute,
      feedingScheduleRoute,
    ]),
    medicalRoute,
    logisticsRoute.addChildren([
      movementsRoute,
      flightsRoute,
    ]),
    staffRoute.addChildren([
      rotaRoute,
      timesheetsRoute,
      holidaysRoute,
    ]),
    reportsRoute.addChildren([
      reportsDashboardRoute,
      complianceRoute,
    ]),
    helpRoute,
    safetyRoute.addChildren([
      maintenanceRoute,
      incidentsRoute,
      firstAidRoute,
      drillsRoute,
    ]),
    settingsRoute.addChildren([
      settingsIndexRoute,
      settingsOrgRoute,
      settingsDirectoryRoute,
      settingsListsRoute,
      settingsHealthRoute,
      settingsAccessRoute,
      settingsZlaRoute,
      settingsBugsRoute,
      settingsIntelligenceRoute,
      settingsChangelogRoute,
    ]),
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: () => <div className="p-8 text-center text-slate-500 font-bold">404 - Page Not Found</div>
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
