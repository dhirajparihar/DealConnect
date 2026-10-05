// Roles & Enums
export enum DealerRole {
  PLATFORM_ADMIN = 'platform_admin',
  OWNER = 'owner',
  MANAGER = 'manager',
  SALES = 'sales',
}

export enum DealerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum UserAuthStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OPTED_OUT = 'opted_out',
}

export enum RequirementStatus {
  NEW = 'new',
  SEARCHING = 'searching',
  MATCHED = 'matched',
  NOTIFIED = 'notified',
  INTERESTED = 'interested',
  CONTACTED = 'contacted',
  VISIT_SCHEDULED = 'visit_scheduled',
  NEGOTIATION = 'negotiation',
  SOLD = 'sold',
  NOT_INTERESTED = 'not_interested',
  PAUSED = 'paused',
  PURCHASED_ELSEWHERE = 'purchased_elsewhere',
  EXPIRED = 'expired',
  CLOSED = 'closed',
}

export enum RequirementPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum VehicleStatus {
  DRAFT = 'draft',
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  SOLD = 'sold',
  ARCHIVED = 'archived',
}

export enum FuelType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  CNG = 'cng',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid',
}

export enum TransmissionType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
}

export enum MatchStatus {
  NEW = 'new',
  NOTIFIED = 'notified',
  INTERESTED = 'interested',
  NOT_NOW = 'not_now',
  NOT_INTERESTED = 'not_interested',
  EXPIRED = 'expired',
}

export enum NotificationChannel {
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  EMAIL = 'email',
  PUSH = 'push',
}

export enum NotificationStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum FollowupStatus {
  OPEN = 'open',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

export enum FollowupType {
  CALL = 'call',
  WHATSAPP = 'whatsapp',
  TEST_DRIVE = 'test_drive',
  DEALERSHIP_VISIT = 'dealership_visit',
  NEGOTIATION = 'negotiation',
}

export enum OutboxEventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
  DEAD_LETTER = 'dead_letter',
}

// Score Breakdown Model
export interface MatchScoreBreakdown {
  make_model: number; // Max 30
  budget: number;     // Max 25
  year: number;       // Max 15
  fuel: number;       // Max 10
  transmission: number; // Max 10
  kilometers: number; // Max 5
  location: number;   // Max 5
  total: number;      // Max 100
}

// Entity Interfaces
export interface Dealer {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  status: DealerStatus;
  planId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  authStatus: UserAuthStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealerUser {
  dealerId: string;
  userId: string;
  role: DealerRole;
  status: string;
  createdAt: Date;
}

export interface Customer {
  id: string;
  dealerId: string;
  name: string;
  normalizedPhone: string;
  email: string | null;
  status: CustomerStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Requirement {
  id: string;
  dealerId: string;
  customerId: string;
  status: RequirementStatus;
  priority: RequirementPriority;
  source: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  preferences?: RequirementPreference;
}

export interface RequirementPreference {
  id: string;
  requirementId: string;
  make: string | null;
  model: string | null;
  variant: string | null;
  minYear: number | null;
  maxYear: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  fuel: FuelType | null;
  transmission: TransmissionType | null;
  maxKm: number | null;
  locationLat: number | null;
  locationLng: number | null;
  radiusKm: number | null;
  color: string | null;
  preferenceRules: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  dealerId: string;
  stockNumber: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  price: number;
  fuel: FuelType | null;
  transmission: TransmissionType | null;
  kilometers: number | null;
  locationLat: number | null;
  locationLng: number | null;
  status: VehicleStatus;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  soldAt: Date | null;
  media?: VehicleMedia[];
}

export interface VehicleMedia {
  id: string;
  dealerId: string;
  vehicleId: string;
  storageKey: string;
  mediaType: string;
  sortOrder: number;
  createdAt: Date;
  url?: string;
}

export interface Match {
  id: string;
  dealerId: string;
  requirementId: string;
  vehicleId: string;
  score: number;
  scoreBreakdown: MatchScoreBreakdown;
  status: MatchStatus;
  notifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  vehicle?: Vehicle;
  requirement?: Requirement;
}

export interface NotificationRecord {
  id: string;
  dealerId: string;
  customerId: string;
  matchId: string | null;
  channel: NotificationChannel;
  type: string;
  providerMessageId: string | null;
  status: NotificationStatus;
  idempotencyKey: string;
  attempts: number;
  scheduledAt: Date | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
}

export interface Followup {
  id: string;
  dealerId: string;
  customerId: string;
  requirementId: string | null;
  assignedUserId: string | null;
  type: FollowupType;
  dueAt: Date;
  status: FollowupStatus;
  notes: string | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface Activity {
  id: string;
  dealerId: string;
  customerId: string | null;
  requirementId: string | null;
  vehicleId: string | null;
  userId: string | null;
  activityType: string;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

export interface OutboxEvent {
  id: string;
  dealerId: string | null;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, any>;
  status: OutboxEventStatus;
  attempts: number;
  availableAt: Date;
  processedAt: Date | null;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  dealerId: string | null;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

// Request / Response Context
export interface RequestTenantContext {
  userId?: string;
  dealerId?: string;
  role?: DealerRole;
  requestId: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  requestId: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
    requestId: string;
  };
}
