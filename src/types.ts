export interface Lead {
  timestamp: string;
  leadNo: string;
  clientName: string;
  phone: string;
  kitchen: string;
  wardrobe: string;
  otherWork: string;
  leadSource: string;
  salesPerson: string;
  attachFile: string;
  gpsLocation?: string; // Optional GPS location auto-fill

  // Step 1: 2D Design
  planned1: string;
  actual1: string;
  delay1: string;
  designCopy: string;
  designStatus: string;
  remarks1: string;

  // Step 2: Request For Quote (RFQ)
  planned2: string;
  actual2: string;
  delay2: string;
  clientResponse1: string;
  clientStatus1: string;
  remarks2: string;

  // Step 3: Make Quotation
  planned3: string;
  actual3: string;
  delay3: string;
  quotAmount: string;
  quotCopy: string;

  // Step 4: Request 3D Design
  planned4: string;
  actual4: string;
  delay4: string;
  clientResponse2: string;
  clientStatus2: string;
  remarks3: string;

  // Step 5: 3D Design
  planned5: string;
  actual5: string;
  delay5: string;
  threeDDesignCopy: string; // Map to "3D Desing Copy" in Google Sheets
  threeDStatus: string; // Map to "3D Status"
  remarks4: string;
}

export type ActiveStepId = 1 | 2 | 3 | 4 | 5;

export type PageId = 'dashboard' | 'add' | 'steps' | 'logs' | 'clients' | 'settings';

export interface UserAccount {
  username: string;
  password: string;
  role: string;
  firmName: string;
  pageAccess: string;
}

export interface StepMetadata {
  id: ActiveStepId;
  name: string;
  plannedKey: keyof Lead;
  actualKey: keyof Lead;
  delayKey: keyof Lead;
  fields: {
    label: string;
    key: keyof Lead;
    type: 'text' | 'number' | 'file' | 'select';
    options?: string[];
  }[];
}

export interface SyncConfig {
  mode: 'local' | 'live';
  appsScriptUrl: string;
  sheetUrl: string;
  driveUrl: string;
  sheetName: string;
}
