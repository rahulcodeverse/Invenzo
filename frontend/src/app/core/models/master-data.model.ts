export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  address?: string;
  creditLimit?: number;
  creditDays?: number;
  openingBalance?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Vendor {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  address?: string;
  creditLimit?: number;
  isActive: boolean;
  createdAt: string;
}

