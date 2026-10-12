// ==============================================================================
// FCS CRM AUTOMOTIVO & GESTÃO DE LOJAS — DEFINIÇÃO DE TIPOS TYPESCRIPT
// Compatível com Supabase e Modelo Oficial v2.0 (17 tabelas fcs_)
// ==============================================================================

// 1. FCS PROFILES
export type FCSProfileStatus = 'active' | 'suspended' | 'pending';

export interface FCSProfile {
  id: string; // FK auth.users.id
  full_name: string;
  phone: string | null;
  avatar_path: string | null;
  status: FCSProfileStatus;
  role?: 'user' | 'super_admin';
  cpf?: string | null;
  created_at: string;
  updated_at: string;
}

// 2. FCS DEALERS
export type FCSDealerStatus = 'pending' | 'active' | 'suspended' | 'rejected';
export type FCSSubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled';
export type FCSDocumentType = 'cpf' | 'cnpj';

export interface FCSDealer {
  id: string;
  legal_name: string;
  trade_name: string;
  document_number: string;
  document_type: FCSDocumentType;
  owner_user_id: string | null;
  email: string | null;
  phone: string | null;
  status: FCSDealerStatus;
  subscription_status: FCSSubscriptionStatus;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

// 3. FCS STORES
export type FCSStoreStatus = 'active' | 'inactive' | 'suspended' | 'pending_approval';

export interface FCSStore {
  id: string;
  dealer_id: string;
  name: string;
  slug: string;
  document_number: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  street: string | null;
  address_number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  logo_path: string | null;
  description: string | null;
  opening_hours: Record<string, string> | null;
  status: FCSStoreStatus;
  created_at: string;
  updated_at: string;
}

// 4. FCS MEMBERSHIPS
export type FCSMembershipRole = 'lojista' | 'admin_loja' | 'vendedor';
export type FCSMembershipStatus = 'invited' | 'active' | 'suspended' | 'revoked';

export interface FCSMembership {
  id: string;
  user_id: string;
  dealer_id: string;
  store_id: string | null;
  role: FCSMembershipRole;
  status: FCSMembershipStatus;
  invited_by: string | null;
  joined_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

// 5. FCS VEHICLES
export type FCSVehicleStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'paused'
  | 'reserved'
  | 'sold'
  | 'archived';

export interface FCSVehicle {
  id: string;
  dealer_id: string;
  store_id: string;
  created_by: string | null;
  responsible_seller_id: string | null;
  brand: string;
  model: string;
  version: string | null;
  manufacture_year: number | null;
  model_year: number;
  plate: string | null;
  renavam: string | null;
  color: string | null;
  fuel_type: string | null;
  transmission: string | null;
  mileage: number;
  body_type: string | null;
  doors: number;
  price: number;
  acquisition_price: number | null;
  fipe_price: number | null;
  fipe_code: string | null;
  description: string | null;
  slug: string | null;
  featured: boolean;
  status: FCSVehicleStatus;
  stock_entry_at: string;
  published_at: string | null;
  sold_at: string | null;
  created_at: string;
  updated_at: string;
}

// 6. FCS VEHICLE MEDIA
export type FCSMediaType = 'image' | 'video';

export interface FCSVehicleMedia {
  id: string;
  vehicle_id: string;
  storage_path: string;
  media_type: FCSMediaType;
  position: number;
  is_cover: boolean;
  alt_text: string | null;
  created_at: string;
}

// 7. FCS CUSTOMERS
export type FCSCustomerStatus = 'active' | 'inactive' | 'archived';

export interface FCSCustomer {
  id: string;
  dealer_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  normalized_phone: string | null;
  marketplace_user_id: string | null;
  assigned_seller_id: string | null;
  source: string | null;
  status: FCSCustomerStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// 8. FCS PIPELINE STAGES
export type FCSPipelineStageCategory = 'open' | 'won' | 'lost';

export interface FCSPipelineStage {
  id: string;
  dealer_id: string;
  store_id: string | null;
  name: string;
  stage_key: string;
  position: number;
  category: FCSPipelineStageCategory;
  color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 9. FCS LEADS
export type FCSLeadPriority = 'low' | 'normal' | 'high' | 'urgent';
export type FCSLeadStatus = 'open' | 'won' | 'lost';

export interface FCSLead {
  id: string;
  dealer_id: string;
  store_id: string;
  customer_id: string;
  vehicle_id: string | null;
  assigned_seller_id: string | null;
  stage_id: string | null;
  source: string;
  source_detail: string | null;
  priority: FCSLeadPriority;
  status: FCSLeadStatus;
  first_response_at: string | null;
  last_contact_at: string | null;
  next_action_at: string | null;
  lost_reason: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

// 10. FCS LEAD ASSIGNMENTS
export type FCSAssignmentMethod =
  | 'manual'
  | 'round_robin'
  | 'automatic'
  | 'preferred_seller'
  | 'previous_seller';

export interface FCSLeadAssignment {
  id: string;
  lead_id: string;
  seller_id: string;
  assigned_by: string | null;
  assignment_method: FCSAssignmentMethod;
  reason: string | null;
  assigned_at: string;
  unassigned_at: string | null;
}

// 11. FCS LEAD EVENTS
export type FCSLeadEventType =
  | 'lead_created'
  | 'lead_assigned'
  | 'lead_transferred'
  | 'stage_changed'
  | 'note_added'
  | 'contact_registered'
  | 'task_created'
  | 'proposal_created'
  | 'proposal_accepted'
  | 'lead_won'
  | 'lead_lost'
  | 'lead_reopened';

export interface FCSLeadEvent {
  id: string;
  lead_id: string;
  actor_user_id: string | null;
  event_type: FCSLeadEventType | string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// 12. FCS TASKS
export type FCSTaskPriority = 'low' | 'normal' | 'high';
export type FCSTaskStatus = 'pending' | 'completed' | 'cancelled';

export interface FCSTask {
  id: string;
  dealer_id: string;
  store_id: string;
  lead_id: string | null;
  customer_id: string | null;
  assigned_user_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  priority: FCSTaskPriority;
  status: FCSTaskStatus;
  due_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// 13. FCS PROPOSALS
export type FCSProposalStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface FCSProposal {
  id: string;
  dealer_id: string;
  store_id: string;
  lead_id: string;
  vehicle_id: string;
  seller_id: string;
  asking_price: number;
  proposed_price: number;
  discount: number;
  notes: string | null;
  status: FCSProposalStatus;
  expires_at: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

// 14. FCS SALES
export type FCSSaleStatus = 'confirmed' | 'cancelled';

export interface FCSSale {
  id: string;
  dealer_id: string;
  store_id: string;
  lead_id: string;
  proposal_id: string | null;
  vehicle_id: string;
  seller_id: string;
  final_price: number;
  commission_amount: number;
  status: FCSSaleStatus;
  sold_at: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// 15. FCS CONTACT EVENTS
export type FCSContactChannel = 'whatsapp' | 'phone' | 'email';
export type FCSContactDirection = 'inbound' | 'outbound';

export interface FCSContactEvent {
  id: string;
  dealer_id: string;
  store_id: string;
  lead_id: string | null;
  customer_id: string | null;
  seller_id: string | null;
  channel: FCSContactChannel;
  direction: FCSContactDirection;
  event_type: string;
  provider_message_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// 16. FCS ROUTING RULES
export type FCSRoutingStrategy =
  | 'manual'
  | 'round_robin'
  | 'least_active_leads'
  | 'preferred_seller'
  | 'previous_seller';

export interface FCSRoutingRule {
  id: string;
  dealer_id: string;
  store_id: string;
  name: string;
  strategy: FCSRoutingStrategy;
  criteria: Record<string, unknown>;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 17. FCS AUDIT LOGS
export interface FCSAuditLog {
  id: string;
  actor_user_id: string | null;
  dealer_id: string | null;
  store_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  request_id: string | null;
  created_at: string;
}

// 18. FCS PLANS & SUBSCRIPTIONS
export interface FCSPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  vehicle_limit: number;
  store_limit: number;
  seller_limit: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FCSSubscription {
  id: string;
  dealer_id: string;
  plan_id: string;
  status: 'active' | 'past_due' | 'cancelled' | 'trial';
  current_period_start: string;
  current_period_end: string;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

// 19. FCS BUYER
export interface FCSBuyerFavorite {
  id: string;
  user_id: string;
  vehicle_id: string;
  created_at: string;
}

export interface FCSBuyerSearch {
  id: string;
  user_id: string;
  title: string;
  criteria: Record<string, unknown>;
  receive_alerts: boolean;
  created_at: string;
}

