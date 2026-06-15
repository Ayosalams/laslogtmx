export interface DotNumberInfo {
  dotNumber: string;
  legalName?: string;
  dbaName?: string;
  status: 'Active' | 'Out of Service' | 'Inactive' | 'Pending' | 'Not Found' | 'Unknown';
  authorityStatus?: 'Active' | 'Revoked' | 'Pending' | 'None';
  outOfService?: boolean;
  powerUnits?: number;
  drivers?: number;
  lastUpdated?: string;
  source: 'FMCSA SAFER (public)' | 'Mock' | 'Cached';
}

export interface MotusSubmission {
  id: string;
  dotNumber: string;
  type: 'DOT_CLAIM' | 'MCS-150' | 'INSURANCE_FILING' | 'AUTHORITY_UPDATE' | 'OTHER';
  fileName: string;
  fileSize?: number;
  uploadedAt: string; // ISO
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Additional Info';
  trackingNumber?: string;
  notes?: string;
}

export interface TroubleshootingItem {
  id: string;
  title: string;
  description: string;
  category: 'DOT Linking / Claim' | 'Authority & Insurance' | 'PIN & Login' | 'Document Submission' | 'General';
  solutions: string[];
  commonFixTime?: string; // e.g. "24-48 hours"
}

export type FlowStep = 
  | 'enter-dot'
  | 'verify-status'
  | 'claim-account'
  | 'upload-docs'
  | 'confirmation';

export interface ClaimFlowState {
  currentStep: FlowStep;
  dotNumber: string;
  statusInfo?: DotNumberInfo;
  contactEmail?: string;
  contactPhone?: string;
  pin?: string;
  submitted: boolean;
}
