import { Vehicle } from "./vehicle";

export type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceItem {
  id?: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Service {
  id: string;
  vehicle_id: string;
  vehicle?: Vehicle;
  description: string;
  cost: number;
  status: ServiceStatus;
  items?: ServiceItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateServiceRequest {
  vehicle_id: string;
  description: string;
  items: ServiceItem[];
}

export interface UpdateServiceRequest {
  description: string;
  items?: ServiceItem[];
  status: ServiceStatus;
}

export interface ServiceResponse {
  success: boolean;
  message?: string;
  data: Service | Service[];
}
