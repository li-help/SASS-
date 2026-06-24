export interface User {
  id: string;
  tenantId: string;
  username: string;
  realName: string;
  email: string;
  phone: string;
  status: string;
  isSuperAdmin: boolean;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  maxUserCount: number;
  status: string;
  createdAt: string;
}
