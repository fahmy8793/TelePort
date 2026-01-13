export interface Truck {
  id: string;
  max_weight_lbs: number;
  max_volume_cuft: number;
}

export interface Order {
  id: string;
  payout_cents: number; // integer cents only
  weight_lbs: number;
  volume_cuft: number;
  origin: string;
  destination: string;
  pickup_date: string;   // YYYY-MM-DD
  delivery_date: string; // YYYY-MM-DD
  is_hazmat: boolean;
}

export interface OptimizeRequestBody {
  truck: Truck;
  orders: Order[];
}

export interface OptimizeResponse {
  truck_id: string;
  selected_order_ids: string[];
  total_payout_cents: number;
  total_weight_lbs: number;
  total_volume_cuft: number;
  utilization_weight_percent: number;
  utilization_volume_percent: number;
}
