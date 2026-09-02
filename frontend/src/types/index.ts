export type UserRole =
  | "ADMIN"
  | "SALES"
  | "WAREHOUSE"
  | "ACCOUNTS";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  business_name: string;
  gst_number: string | null;
  customer_type:
    | "RETAIL"
    | "WHOLESALE"
    | "DISTRIBUTOR";
  address: string | null;
  status:
    | "LEAD"
    | "ACTIVE"
    | "INACTIVE";
  follow_up_date: string | null;
  notes: string | null;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock: number;
  warehouse_location: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  quantity: number;
  movement_type: "IN" | "OUT";
  reason: string;
  created_by: number;
  created_at: string;
}

export interface ChallanItem {
  id?: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  unit_price?: number;
  quantity: number;
}

export interface Challan {
  id: number;
  challan_number: string;
  customer_id: number;
  customer_name: string;
  business_name: string;
  total_quantity: number;
  status:
    | "DRAFT"
    | "CONFIRMED"
    | "CANCELLED";
  created_by: number;
  created_at: string;
  updated_at: string;
  items?: ChallanItem[];
}