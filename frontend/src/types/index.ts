export type Role = "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type CustomerType = "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
export type CustomerStatus = "LEAD" | "ACTIVE" | "INACTIVE";

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;
  customerType: CustomerType;
  address?: string | null;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  followUps?: FollowUp[];
  challans?: Challan[];
}

export interface FollowUp {
  id: string;
  note: string;
  followUpDate?: string | null;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string | null;
  unitPrice: string; // Decimal serializes as string over JSON
  currentStock: number;
  minStockAlert: number;
  location?: string | null;
  stockMovements?: StockMovement[];
}

export type MovementType = "IN" | "OUT";

export interface StockMovement {
  id: string;
  quantity: number;
  movementType: MovementType;
  reason: string;
  createdAt: string;
}

export type ChallanStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export interface ChallanItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  unitPriceSnapshot: string;
  quantity: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer?: Customer;
  totalQuantity: number;
  status: ChallanStatus;
  createdAt: string;
  items: ChallanItem[];
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
