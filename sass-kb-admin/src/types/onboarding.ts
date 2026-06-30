export interface ApplyRequest {
  companyName: string;
  creditCode: string;
  licenseUrl?: string;
  legalPerson?: string;
  companyAddress?: string;
  businessScope?: string;
  contactPhone?: string;
  contactEmail?: string;
  username: string;
  password: string;
  realName: string;
  email?: string;
  phone?: string;
}

export interface ApplicationVO {
  id: string;
  companyName: string;
  creditCode: string;
  licenseUrl?: string;
  legalPerson?: string;
  companyAddress?: string;
  businessScope?: string;
  contactPhone?: string;
  contactEmail?: string;
  username: string;
  realName: string;
  email?: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  tenantId?: string;
  userId?: string;
  createdAt: string;
}

export interface RejectRequest {
  reason: string;
}
