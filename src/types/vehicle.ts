export interface Vehicle {
  id: string;
  client_name: string;
  phone: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleRequest {
  client_name: string;
  phone: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
}

export interface UpdateVehicleRequest {
  client_name: string;
  phone: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
}

export interface VehicleResponse {
  success: boolean;
  message?: string;
  data: Vehicle | Vehicle[];
}
