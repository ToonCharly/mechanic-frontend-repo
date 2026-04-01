import { Vehicle } from './vehicle';
import { ServiceItem } from './service';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';

export interface PaymentService {
  id: string;
  vehicle_id: string;
  description: string;
  cost: number;
  status: string;
  items?: ServiceItem[];
  vehicle?: Vehicle;
}

export interface Payment {
  id: string;
  service_id: string;
  service?: PaymentService;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  notes?: string;
  created_at: string;
}

export interface CreatePaymentRequest {
  service_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  notes?: string;
}

export interface PaymentResponse {
  success: boolean;
  message?: string;
  data: Payment | Payment[];
}
