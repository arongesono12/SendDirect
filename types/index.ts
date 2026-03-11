export type UserRole = 'admin' | 'gestor' | 'cliente';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  document_type?: string;
  document_number?: string;
  country?: string;
  city?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentBalance {
  id: string;
  agent_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface ClientBalance {
  id: string;
  client_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Transfer {
  id: string;
  transfer_code: string;
  transfer_type?: 'agent' | 'client';
  agent_id?: string;
  sender_id?: string;
  sender_name: string;
  sender_phone: string;
  sender_document_type?: string;
  sender_document_number?: string;
  receiver_name: string;
  receiver_phone: string;
  destination_city: string;
  destination_country?: string;
  amount: number;
  currency: string;
  status: 'created' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  completed_at?: string;
  cancelled_at?: string;
  agent?: {
    name: string;
    phone?: string;
  };
  sender?: {
    name: string;
    phone?: string;
  };
}

export interface BalanceTransaction {
  id: string;
  agent_id: string;
  type: 'topup' | 'transfer' | 'refund' | 'commission';
  amount: number;
  previous_balance: number;
  new_balance: number;
  reference_id?: string;
  reference_type?: string;
  description?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  transfer_id?: string;
  phone: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  twilio_sid?: string;
  error_message?: string;
  created_at: string;
  sent_at?: string;
}

export interface AgentWithBalance extends User {
  balance: number;
}

export interface DailyTransferStats {
  date: string;
  transfer_count: number;
  total_amount: number;
  agent_count: number;
}

export interface AgentTransferStats {
  agent_id: string;
  agent_name: string;
  transfer_count: number;
  total_sent: number;
  last_transfer: string;
}

export interface TransferFormData {
  sender_name: string;
  sender_phone: string;
  sender_document_type?: string;
  sender_document_number?: string;
  receiver_name: string;
  receiver_phone: string;
  destination_city: string;
  destination_country?: string;
  amount: number;
  currency: string;
  notes?: string;
}

export interface ClientTransferFormData {
  receiver_name: string;
  receiver_phone: string;
  destination_city: string;
  destination_country?: string;
  amount: number;
  currency: string;
  notes?: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  document_type?: string;
  document_number?: string;
  country?: string;
  city?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface DashboardStats {
  totalBalance: number;
  todayTransfers: number;
  totalSent: number;
  totalClients: number;
  // Totales agrupados por moneda (por ejemplo { USD: 1234.56, EUR: 789.00 })
  balancesByCurrency?: Record<string, number>;
}

export interface ChartData {
  name: string;
  value: number;
}
