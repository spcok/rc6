export interface HusbandryLog {
  id: string;

  animalId: string;
  date: string;
  type: 'FEED' | 'WEIGHT' | 'FLIGHT' | 'TRAINING' | 'TEMPERATURE';
  value: string;
  author: string;
}

export enum ShiftType {
  FULL_DAY = 'Full Day',
  MORNING = 'Morning',
  AFTERNOON = 'Afternoon',
  NIGHT = 'Night',
  CUSTOM = 'Custom'
}
export interface Shift {
  id: string;

  userId: string;
  userName: string; // denormalized for fast offline rendering
  userRole: string; // denormalized for filtering
  date: string; // YYYY-MM-DD
  shiftType: ShiftType;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  assignedArea?: string; // e.g. "Owls", "Mammals", "Site Maintenance"
  notes?: string;
  patternId?: string; // UUID linking a repeating block
  updatedAt?: string;
  isDeleted?: boolean;
}

export enum AnimalCategory {
  ALL = 'ALL',
  OWLS = 'OWLS',
  RAPTORS = 'RAPTORS',
  MAMMALS = 'MAMMALS',
  EXOTICS = 'EXOTICS'
}

export enum ConservationStatus {
  NE = 'NE',
  DD = 'DD',
  LC = 'LC',
  NT = 'NT',
  VU = 'VU',
  EN = 'EN',
  CR = 'CR',
  EW = 'EW',
  EX = 'EX'
}

export enum HazardRating {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum UserRole {
  VOLUNTEER = 'VOLUNTEER',
  KEEPER = 'KEEPER',
  SENIOR_KEEPER = 'SENIOR_KEEPER',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  GUEST = 'GUEST'
}

export enum HealthRecordType {
  OBSERVATION = 'OBSERVATION',
  MEDICATION = 'MEDICATION',
  SURGERY = 'SURGERY',
  VACCINATION = 'VACCINATION',
  EXAM = 'EXAM'
}

export enum HealthCondition {
  HEALTHY = 'HEALTHY',
  CONCERN = 'CONCERN',
  CRITICAL = 'CRITICAL',
  DECEASED = 'DECEASED'
}

export enum LogType {
  GENERAL = 'GENERAL',
  WEIGHT = 'WEIGHT',
  FEED = 'FEED',
  FLIGHT = 'FLIGHT',
  TRAINING = 'TRAINING',
  TEMPERATURE = 'TEMPERATURE',
  HEALTH = 'HEALTH',
  EVENT = 'EVENT',
  MISTING = 'MISTING',
  WATER = 'WATER',
  BIRTH = 'BIRTH'
}

export enum MovementType {
  TRANSFER = 'TRANSFER',
  ACQUISITION = 'ACQUISITION',
  DISPOSITION = 'DISPOSITION'
}

export enum TransferType {
  ARRIVAL = 'Arrival',
  DEPARTURE = 'Departure'
}

export enum TransferStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed'
}

export enum TimesheetStatus {
  ACTIVE = 'Active',
  COMPLETED = 'Completed'
}

export enum LeaveType {
  ANNUAL = 'Annual',
  SICK = 'Sick',
  UNPAID = 'Unpaid',
  OTHER = 'Other'
}

export enum HolidayStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  DECLINED = 'Declined'
}

export enum EntityType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP'
}

export interface Animal {
  id: string;

  entityType?: EntityType | null;
  parentMobId?: string;
  censusCount?: number | null;
  name: string;
  species: string;
  latinName?: string | null;
  category: AnimalCategory;
  location: string;
  imageUrl?: string;
  hazardRating: HazardRating;
  isVenomous: boolean;
  weightUnit: 'g' | 'oz' | 'lbs_oz' | 'kg';
  dob?: string;
  isDobUnknown?: boolean;
  sex?: 'Male' | 'Female' | 'Unknown';
  microchipId?: string;
  dispositionStatus?: 'Active' | 'Transferred' | 'Deceased' | 'Missing' | 'Stolen';
  originLocation?: string;
  destinationLocation?: string;
  transferDate?: string;
  ringNumber?: string;
  hasNoId?: boolean;
  redListStatus?: ConservationStatus;
  description?: string;
  specialRequirements?: string;
  criticalHusbandryNotes?: string[];
  targetDayTempC?: number;
  targetNightTempC?: number;
  targetHumidityMinPercent?: number;
  targetHumidityMaxPercent?: number;
  mistingFrequency?: string;
  acquisitionDate?: string;
  origin?: string;
  sireId?: string;
  damId?: string;
  flyingWeightG?: number;
  winterWeightG?: number;
  displayOrder?: number;
  archived?: boolean;
  archiveReason?: string;
  archivedAt?: string;
  archiveType?: 'Disposition' | 'Death' | 'Euthanasia' | 'Missing' | 'Stolen';
  dateOfDeath?: string | null;
  dispositionDate?: string | null;
  isQuarantine?: boolean;
  distributionMapUrl?: string;
  waterTippingTemp?: number;
  ambientTempOnly?: boolean;
  acquisitionType?: 'BORN' | 'TRANSFERRED_IN' | 'RESCUE' | 'UNKNOWN';
  isBoarding?: boolean;
  createdAt?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface LogEntry {
  id: string;

  animalId: string;
  logType: LogType;
  logDate: string;
  value: string;
  notes?: string;
  userInitials?: string;
  weightGrams?: number;
  weight?: number;
  weightUnit?: 'g' | 'kg' | 'oz' | 'lbs' | 'lbs_oz';
  healthRecordType?: string;
  // Temperature fields
  baskingTempC?: number;
  coolTempC?: number;
  temperatureC?: number;
  createdAt?: string;
  createdBy?: string;
  integritySeal?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export type DailyLog = LogEntry;

export interface Task {
  id: string;

  animalId?: string;
  title: string;
  notes?: string;
  dueDate: string;
  completed: boolean;
  type?: LogType;
  recurring?: boolean;
  assignedTo?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface UserPermissions {
  dashboard: boolean;
  dailyLog: boolean;
  tasks: boolean;
  medical: boolean;
  movements: boolean;
  safety: boolean;
  maintenance: boolean;
  settings: boolean;
  flightRecords: boolean;
  feedingSchedule: boolean;
  attendance: boolean;
  holidayApprover: boolean;
  attendanceManager: boolean;
  missingRecords: boolean;
  reports: boolean;
  rounds: boolean;
  view_archived_records?: boolean;
  userManagement?: boolean;
}

export interface UserProfile {
  id: string;

  email: string;
  name: string;
  role: UserRole;
  initials: string;
  pin?: string;
  jobPosition?: string;
  permissions?: Partial<UserPermissions>;
  signatureData?: string;
  integritySeal?: string;
}

export interface RolePermissionConfig {
  id?: string;
  role: UserRole;
  // Animals
  viewAnimals: boolean;
  addAnimals: boolean;
  editAnimals: boolean;
  archiveAnimals: boolean;
  // Husbandry
  viewDailyLogs: boolean;
  createDailyLogs: boolean;
  editDailyLogs: boolean;
  viewTasks: boolean;
  completeTasks: boolean;
  manageTasks: boolean;
  viewDailyRounds: boolean;
  logDailyRounds: boolean;
  // Medical
  viewMedical: boolean;
  addClinicalNotes: boolean;
  prescribeMedications: boolean;
  administerMedications: boolean;
  manageQuarantine: boolean;
  // Logistics
  viewMovements: boolean;
  logInternalMovements: boolean;
  manageExternalTransfers: boolean;
  // Safety
  viewIncidents: boolean;
  reportIncidents: boolean;
  manageIncidents: boolean;
  viewMaintenance: boolean;
  reportMaintenance: boolean;
  resolveMaintenance: boolean;
  viewSafetyDrills: boolean;
  viewFirstAid: boolean;
  // Staff
  submitTimesheets: boolean;
  manageAllTimesheets: boolean;
  requestHolidays: boolean;
  approveHolidays: boolean;
  // Compliance & Admin
  viewMissingRecords: boolean;
  viewArchivedRecords: boolean;
  manageZlaDocuments: boolean;
  generateReports: boolean;
  viewSettings: boolean;
  manageUsers: boolean;
  manageRoles: boolean;
}

export type User = UserProfile;

export interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  address?: string;
}

export interface ZLADocument {
  id: string;
  name: string;
  category: string;
  file_url: string;
  upload_date: Date;
}

export interface OrgProfileSettings {
  id: string;
  orgName: string;
  logoUrl?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  zlaLicenseNumber: string;
  officialWebsite?: string;
  adoptionPortal?: string;
}

export interface OrgProfile {
  name: string;
  logoUrl: string;
  adoptionPortal?: string;
}

export interface ClinicalNote {
  id: string;

  animalId: string;
  animalName: string;
  date: string;
  noteType: string;
  noteText: string;
  recheckDate?: string;
  staffInitials: string;
  attachmentUrl?: string;
  thumbnailUrl?: string;
  diagnosis?: string;
  bcs?: number;
  weightGrams?: number;
  weight?: number;
  weightUnit?: 'g' | 'kg' | 'oz' | 'lbs' | 'lbs_oz';
  treatmentPlan?: string;
  integritySeal?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  createdAt?: string;
}

export interface MARChart {
  id: string;

  animalId: string;
  animalName: string;
  medication: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Completed';
  instructions: string;
  administeredDates: string[];
  staffInitials: string;
  integritySeal?: string;
  updatedAt?: string;
  isDeleted?: boolean;
  createdAt?: string;
}

export interface QuarantineRecord {
  id: string;

  animalId: string;
  animalName: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Cleared';
  isolationNotes: string;
  staffInitials: string;
  updatedAt?: string;
  isDeleted?: boolean;
  createdAt?: string;
}

export interface InternalMovement {
  id: string;

  animalId: string;
  animalName: string;
  logDate: string;
  movementType: MovementType;
  sourceLocation: string;
  destinationLocation: string;
  notes?: string;
  createdBy: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface Transfer {
  id: string;

  animalId: string;
  animalName: string;
  transferType: TransferType;
  date: string;
  institution: string;
  transportMethod: string;
  citesArticle10Ref: string;
  status: TransferStatus;
  notes?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface Timesheet {
  id: string;

  staffName: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  notes?: string;
  status: TimesheetStatus;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface Holiday {
  id: string;

  staffName: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  status: HolidayStatus;
  notes?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface SafetyDrill {
  id: string;

  date: string;
  title: string;
  location: string;
  priority: string;
  status: string;
  description: string;
  timestamp: number;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface MaintenanceLog {
  id: string;

  enclosureId: string;
  taskType: 'UV Replacement' | 'Structural Repair' | 'General';
  description: string;
  status: 'Pending' | 'Completed';
  dateLogged: string;
  dateCompleted?: string;
  integritySeal?: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface FirstAidLog {
  id: string;

  date: string;
  staffId: string;
  incidentDescription: string;
  treatmentProvided: string;
  createdAt: string;
  
  personName: string;
  type: 'Injury' | 'Illness' | 'Near Miss';
  location: string;
  outcome: 'Returned to Work' | 'Restricted Duties' | 'Monitoring' | 'Sent Home' | 'GP Visit' | 'Hospital' | 'Ambulance Called' | 'Refused Treatment' | 'None';
  
  updatedAt?: string;
  isDeleted?: boolean;
}

export enum IncidentType {
  INJURY = 'Injury',
  ILLNESS = 'Illness',
  NEAR_MISS = 'Near Miss',
  FIRE = 'Fire',
  OTHER = 'Other'
}

export enum IncidentSeverity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface DailyRound {
  id: string;

  date: string;
  shift: 'Morning' | 'Evening';
  section: string;
  checkData?: Record<string, unknown>;
  status: 'Completed' | 'Pending' | 'completed' | 'pending';
  completedBy: string;
  completedAt?: string;
  updatedAt?: string;
  notes?: string;
}

export interface Incident {
  id: string;

  date: string;
  time: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  location: string;
  status: string;
  reportedBy: string;
  
  reporterId: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted?: boolean;
}

export interface SyncQueueItem {
  id?: number;
  tableName: string;
  recordId: string;
  operation: 'upsert' | 'delete';
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
  status: 'pending' | 'failed' | 'quarantined';
  priority: number;
  retryCount: number;
  errorLog?: string;
}

export interface OperationalList {
  id: string;

  type: 'food_type' | 'feed_method' | 'location' | 'event';
  category: AnimalCategory;
  value: string;
  isDeleted?: boolean;
  updatedAt?: string;
}

export interface SignContent {
    diet: string[];
    habitat: string[];
    didYouKnow: string[];
    speciesBrief?: string;
    wildOrigin?: string;
    speciesStats: {
        lifespanWild: string;
        lifespanCaptivity: string;
        wingspan: string;
        weight: string;
    };
}

export type OrganisationProfile = OrgProfile;

export interface MissingRecord {
  id: string;
  animalId: string;
  animalName: string;
  animalCategory: string;
  alertType: 'Missing Weight' | 'Missing Feed' | 'Overdue Checkup' | 'Missing Details';
  daysOverdue: number;
  severity: 'High' | 'Medium';
  category: 'Husbandry' | 'Health' | 'Details';
  missingFields?: string[];
  date: string;
  isDeleted?: boolean;
}

export interface TimeLogEntry {
  id: string;
  staffName: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
  notes?: string;
  status: TimesheetStatus;
}

