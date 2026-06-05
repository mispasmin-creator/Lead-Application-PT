import { Lead, SyncConfig, UserAccount } from "../types";
import { initialMockLeads } from "../data/mockLeads";

const CONFIG_KEY = "lead_tracker_sync_config";
const LOCAL_LEADS_KEY = "lead_tracker_local_leads";
const HEADERS_CACHE_KEY = "lead_tracker_sheet_headers";
const AUTH_USER_KEY = "lead_tracker_auth_user";

// Runtime cache of actual Google Sheet column headers (fetched from the live sheet).
// Only columns present here will be sent — nothing extra is written.
let sheetHeadersCache: string[] = (() => {
  try {
    const stored = localStorage.getItem(HEADERS_CACHE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
})();

const ENV_APPS_SCRIPT_URL = (import.meta as any).env.VITE_APPS_SCRIPT_URL as
  | string
  | undefined;
const ENV_SHEET_ID = (import.meta as any).env.VITE_SHEET_ID as
  | string
  | undefined;
const ENV_DRIVE_FOLDER_ID = (import.meta as any).env.VITE_DRIVE_FOLDER_ID as
  | string
  | undefined;

const DEFAULT_CONFIG: SyncConfig = {
  mode: ENV_APPS_SCRIPT_URL ? "live" : "local",
  appsScriptUrl: ENV_APPS_SCRIPT_URL || "",
  sheetUrl: ENV_SHEET_ID || "1L0Onxmwmqz6JIVHYh_Fjcz8B9GheBd7TPclHwyXcTSw",
  driveUrl: ENV_DRIVE_FOLDER_ID || "1w27aLnZBCvqHOSvypelsn8gi4FeQa4CM",
  sheetName: "Application",
};

// Map Sheet Header Names -> Lead Object Keys
export const HEADER_TO_KEY_MAP: Record<string, keyof Lead> = {
  Timestamp: "timestamp",
  "Lead No.": "leadNo",
  "Client Name": "clientName",
  "Phone Number": "phone",
  Kitchen: "kitchen",
  Wardrobe: "wardrobe",
  "Other Work": "otherWork",
  "Lead Source": "leadSource",
  "Sales Person": "salesPerson",
  "Attach File": "attachFile",
  Planned1: "planned1",
  Actual1: "actual1",
  Delay1: "delay1",
  "Design Copy": "designCopy",
  "Design Status": "designStatus",
  Remarks1: "remarks1",
  Planned2: "planned2",
  Actual2: "actual2",
  Delay2: "delay2",
  "Client Response1": "clientResponse1",
  "Client Status1": "clientStatus1",
  Remarks2: "remarks2",
  Planned3: "planned3",
  Actual3: "actual3",
  Delay3: "delay3",
  "Quot. Amount": "quotAmount",
  "Quot. Copy": "quotCopy",
  Planned4: "planned4",
  Actual4: "actual4",
  Delay4: "delay4",
  "Client Response2": "clientResponse2",
  "Client Status2": "clientStatus2",
  Remarks3: "remarks3",
  Planned5: "planned5",
  Actual5: "actual5",
  Delay5: "delay5",
  "3D Desing Copy": "threeDDesignCopy",
  "3D Status": "threeDStatus",
  Remarks4: "remarks4",
};

// Map Lead Object Keys -> Sheet Header Names
export const KEY_TO_HEADER_MAP: Record<keyof Lead, string> = {
  timestamp: "Timestamp",
  leadNo: "Lead No.",
  clientName: "Client Name",
  phone: "Phone Number",
  kitchen: "Kitchen",
  wardrobe: "Wardrobe",
  otherWork: "Other Work",
  leadSource: "Lead Source",
  salesPerson: "Sales Person",
  attachFile: "Attach File",
  planned1: "Planned1",
  actual1: "Actual1",
  delay1: "Delay1",
  designCopy: "Design Copy",
  designStatus: "Design Status",
  remarks1: "Remarks1",
  planned2: "Planned2",
  actual2: "Actual2",
  delay2: "Delay2",
  clientResponse1: "Client Response1",
  clientStatus1: "Client Status1",
  remarks2: "Remarks2",
  planned3: "Planned3",
  actual3: "Actual3",
  delay3: "Delay3",
  quotAmount: "Quot. Amount",
  quotCopy: "Quot. Copy",
  planned4: "Planned4",
  actual4: "Actual4",
  delay4: "Delay4",
  clientResponse2: "Client Response2",
  clientStatus2: "Client Status2",
  remarks3: "Remarks3",
  planned5: "Planned5",
  actual5: "Actual5",
  delay5: "Delay5",
  threeDDesignCopy: "3D Desing Copy", // Matching "3D Desing Copy" in Google Sheets
  threeDStatus: "3D Status",
  remarks4: "Remarks4",
  gpsLocation: "GPS Location", // Supporting custom visual location field
};

export function getSyncConfig(): SyncConfig {
  const envUrl = (import.meta as any).env.VITE_APPS_SCRIPT_URL as
    | string
    | undefined;
  const envSheetId = (import.meta as any).env.VITE_SHEET_ID as
    | string
    | undefined;
  const envDriveFolderId = (import.meta as any).env.VITE_DRIVE_FOLDER_ID as
    | string
    | undefined;

  // If .env has a real URL, clear any stale local cache so we always pull fresh from Sheets
  if (envUrl) {
    const currentConfig = localStorage.getItem(CONFIG_KEY);
    const currentParsed = currentConfig ? JSON.parse(currentConfig) : null;
    if (
      !currentParsed ||
      currentParsed.mode === "local" ||
      currentParsed.appsScriptUrl !== envUrl
    ) {
      // Wipe stale local leads cache so live data loads fresh
      localStorage.removeItem(LOCAL_LEADS_KEY);
    }
  }

  const data = localStorage.getItem(CONFIG_KEY);
  if (!data) return DEFAULT_CONFIG;

  try {
    const parsed = JSON.parse(data);
    // If .env has a URL or sheet configuration, always use those values and force live mode — env config beats localStorage
    if (envUrl) {
      parsed.appsScriptUrl = envUrl;
      parsed.mode = "live";
    }
    if (envSheetId) {
      parsed.sheetUrl = envSheetId;
    }
    if (envDriveFolderId) {
      parsed.driveUrl = envDriveFolderId;
    }
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (e) {
    return DEFAULT_CONFIG;
  }
}

export function saveSyncConfig(config: SyncConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export const USER_HEADER_TO_KEY_MAP: Record<string, keyof UserAccount> = {
  Username: "username",
  Password: "password",
  Role: "role",
  "Firm Name": "firmName",
  "Page Access": "pageAccess",
};

export function mapRowToUser(rowObj: Record<string, any>): UserAccount {
  const user: UserAccount = {
    username: "",
    password: "",
    role: "",
    firmName: "",
    pageAccess: "",
  };

  Object.keys(rowObj).forEach((headerName) => {
    const key = USER_HEADER_TO_KEY_MAP[headerName.trim()];
    if (key) {
      user[key] = String(rowObj[headerName] ?? "").trim();
    }
  });

  return user;
}

function fetchJsonp(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = `leadflow_jsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("User sheet request timed out."));
    }, 15000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      script.remove();
      delete (window as any)[callbackName];
    };

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Apps Script deployment URL is not reachable. Redeploy the script and update VITE_APPS_SCRIPT_URL with the latest /exec URL."));
    };

    const jsonpUrl = new URL(url);
    jsonpUrl.searchParams.set("callback", callbackName);
    jsonpUrl.searchParams.set("_", Date.now().toString());
    script.src = jsonpUrl.toString();
    document.body.appendChild(script);
  });
}

export async function getUsers(config: SyncConfig): Promise<UserAccount[]> {
  if (config.mode !== "live" || !config.appsScriptUrl) {
    throw new Error("Live Apps Script URL is required for User sheet login.");
  }

  const usersUrl = new URL(config.appsScriptUrl);
  usersUrl.searchParams.set("action", "getUsers");

  const json = await fetchJsonp(usersUrl.toString());
  if (json.status !== "success" || !json.data || !Array.isArray(json.data.rows)) {
    throw new Error(json.message || "Unable to read User sheet.");
  }

  return json.data.rows
    .map((row: any) => mapRowToUser(row))
    .filter((user: UserAccount) => user.username);
}

export async function addUser(user: UserAccount, config: SyncConfig): Promise<void> {
  if (config.mode !== 'live' || !config.appsScriptUrl) {
    throw new Error('Live Apps Script URL is required to add users.');
  }

  const response = await fetch(config.appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'addUser', user }),
    mode: 'cors',
  });

  const json = await response.json();
  if (json.status !== 'success') {
    throw new Error(json.message || 'Failed to add user to Google Sheet');
  }
}

export async function updateUser(
  originalUsername: string,
  user: UserAccount,
  config: SyncConfig,
): Promise<void> {
  if (config.mode !== 'live' || !config.appsScriptUrl) {
    throw new Error('Live Apps Script URL is required to update users.');
  }

  const response = await fetch(config.appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'updateUser', originalUsername, user }),
    mode: 'cors',
  });

  const json = await response.json();
  if (json.status !== 'success') {
    throw new Error(json.message || 'Failed to update user in Google Sheet');
  }
}

export async function authenticateUser(
  username: string,
  password: string,
  config: SyncConfig,
): Promise<UserAccount> {
  const cleanUsername = username.trim();
  const users = await getUsers(config);
  const matchedUser = users.find(
    (user) =>
      user.username.trim().toLowerCase() === cleanUsername.toLowerCase() &&
      user.password === password,
  );

  if (!matchedUser) {
    throw new Error("Invalid username or password.");
  }

  return matchedUser;
}

export function getSavedUser(): UserAccount | null {
  try {
    const data = localStorage.getItem(AUTH_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveAuthUser(user: UserAccount): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthUser(): void {
  localStorage.removeItem(AUTH_USER_KEY);
}

export function mapRowToLead(rowObj: Record<string, any>, index: number): Lead {
  const result: Partial<Lead> = {};

  // Set default values for all keys first
  Object.keys(KEY_TO_HEADER_MAP).forEach((k) => {
    const key = k as keyof Lead;
    result[key] = "";
  });

  // Map incoming database headers to local keys
  Object.keys(rowObj).forEach((headerName) => {
    const key = HEADER_TO_KEY_MAP[headerName];
    if (key) {
      result[key] = String(rowObj[headerName] ?? "");
    }
  });

  // Fallback unique Lead No if empty
  if (!result.leadNo) {
    result.leadNo = `LD-${100 + index}`;
  }
  if (!result.timestamp) {
    result.timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);
  }
  if (!String(result.planned1 || '').trim() && !String(result.actual1 || '').trim()) {
    result.planned1 = result.timestamp;
  }

  return result as Lead;
}

export function mapLeadToRow(lead: Lead): Record<string, string> {
  const result: Record<string, string> = {};
  const knownHeaders = sheetHeadersCache; // actual columns from the live sheet

  Object.keys(KEY_TO_HEADER_MAP).forEach((k) => {
    const key = k as keyof Lead;
    const headerName = KEY_TO_HEADER_MAP[key];
    // If we know the sheet's headers, only include columns that actually exist there.
    // If headers aren't cached yet (offline / first load), send everything as fallback.
    if (knownHeaders.length === 0 || knownHeaders.includes(headerName)) {
      result[headerName] = String(lead[key] || "");
    }
  });
  return result;
}

export async function getLeads(config: SyncConfig): Promise<Lead[]> {
  if (config.mode === "local") {
    const localData = localStorage.getItem(LOCAL_LEADS_KEY);
    if (!localData) {
      localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(initialMockLeads));
      return initialMockLeads;
    }
    try {
      return JSON.parse(localData);
    } catch (e) {
      return initialMockLeads;
    }
  }

  // Live Sync
  if (!config.appsScriptUrl) {
    throw new Error(
      "Please configure your Google Apps Script Web App URL in settings to connect live.",
    );
  }

  try {
    const response = await fetch(config.appsScriptUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error(`Google Sheets responded with code ${response.status}`);
    }

    const json = await response.json();
    if (json.status === "success" && json.data && json.data.rows) {
      // Cache the sheet's actual column headers so we only write to matching columns
      if (Array.isArray(json.data.headers) && json.data.headers.length > 0) {
        sheetHeadersCache = json.data.headers
          .map((h: any) => String(h).trim())
          .filter(Boolean);
        localStorage.setItem(
          HEADERS_CACHE_KEY,
          JSON.stringify(sheetHeadersCache),
        );
      }
      const leads = json.data.rows.map((row: any, i: number) =>
        mapRowToLead(row, i),
      );
      localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(leads));
      return leads;
    } else {
      throw new Error(json.message || "Malformed Apps Script response format");
    }
  } catch (error: any) {
    console.error(
      "Failed fetching data from Google Apps Script. Loading cached data.",
      error,
    );
    // Silent fallback to local cache
    const localData = localStorage.getItem(LOCAL_LEADS_KEY);
    if (localData) {
      return JSON.parse(localData);
    }
    return initialMockLeads;
  }
}

export async function addLead(lead: Lead, config: SyncConfig): Promise<void> {
  if (config.mode === "local") {
    const localData = localStorage.getItem(LOCAL_LEADS_KEY);
    const leads = localData ? JSON.parse(localData) : [...initialMockLeads];

    // Auto populate formula dates mock-up for demonstration
    // E.g., when lead created, we set Planned1 to today + 1 day, Planned2 to today + 3 days, etc.
    const today = new Date();
    const formatDate = (d: Date) =>
      d.toISOString().replace("T", " ").substring(0, 19);

    lead.planned1 =
      lead.planned1 ||
      formatDate(new Date(today.getTime() + 24 * 60 * 60 * 1000)); // Default tomorrow
    lead.planned2 =
      lead.planned2 ||
      formatDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000));
    lead.planned3 =
      lead.planned3 ||
      formatDate(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000));
    lead.planned4 =
      lead.planned4 ||
      formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));
    lead.planned5 =
      lead.planned5 ||
      formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000));

    leads.unshift(lead);
    localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(leads));
    return;
  }

  // Live Sync
  if (!config.appsScriptUrl) {
    throw new Error("Configure Apps Script URL in settings first.");
  }

  const rowData = mapLeadToRow(lead);

  const response = await fetch(config.appsScriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "addLead",
      lead: rowData,
    }),
    mode: "cors",
  });

  const json = await response.json();
  if (json.status !== "success") {
    throw new Error(json.message || "Failed to submit lead to Google Sheet");
  }
}

export async function updateStep(
  leadNo: string,
  stepNumber: number,
  stepData: Partial<Lead>,
  config: SyncConfig,
): Promise<string> {
  const timestampString = new Date()
    .toISOString()
    .replace("T", " ")
    .substring(0, 19);

  if (config.mode === "local") {
    const localData = localStorage.getItem(LOCAL_LEADS_KEY);
    const leads: Lead[] = localData
      ? JSON.parse(localData)
      : [...initialMockLeads];

    const matchedIndex = leads.findIndex((l) => l.leadNo === leadNo);
    if (matchedIndex === -1) {
      throw new Error(`Lead ${leadNo} not found locally.`);
    }

    const item = leads[matchedIndex];
    // Map individual mock updates
    Object.assign(item, stepData);

    // Auto update the specific actual column
    const actualKey = `actual${stepNumber}` as keyof Lead;
    (item as any)[actualKey] = timestampString;

    // Auto update next step's planned column if not set
    if (stepNumber < 5) {
      const nextPlannedKey = `planned${stepNumber + 1}` as keyof Lead;
      if (!String((item as any)[nextPlannedKey] || '').trim()) {
        (item as any)[nextPlannedKey] = timestampString;
      }
    }

    // Auto compute mock delays (Optional client-side display helper logic)
    const plannedKey = `planned${stepNumber}` as keyof Lead;
    const plannedVal = String(item[plannedKey]);
    if (plannedVal) {
      const pDate = new Date(plannedVal).getTime();
      const aDate = new Date(timestampString).getTime();
      const diffDays = Math.ceil((aDate - pDate) / (1000 * 60 * 60 * 24));
      const delayKey = `delay${stepNumber}` as keyof Lead;
      (item as any)[delayKey] = diffDays > 0 ? `${diffDays} days` : "0 days";
    }

    leads[matchedIndex] = item;
    localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(leads));
    return timestampString;
  }

  // Live Sync
  if (!config.appsScriptUrl) {
    throw new Error("Configure Apps Script URL in settings first.");
  }

  // Convert camelCase keys to sheet header names, filtered to only columns that exist in the sheet
  const knownHeaders = sheetHeadersCache;
  const databaseMappedStepData: Record<string, string> = {};
  Object.keys(stepData).forEach((k) => {
    const key = k as keyof Lead;
    const headerName = KEY_TO_HEADER_MAP[key];
    if (
      headerName &&
      (knownHeaders.length === 0 || knownHeaders.includes(headerName))
    ) {
      databaseMappedStepData[headerName] = String(stepData[key] || "");
    }
  });

  const response = await fetch(config.appsScriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "updateStep",
      leadNo: leadNo,
      stepData: databaseMappedStepData,
      stepNumber: stepNumber,
    }),
    mode: "cors",
  });

  const json = await response.json();
  if (json.status !== "success") {
    throw new Error(json.message || "Failed to update step on Google Sheet");
  }

  return json.actualTime || timestampString;
}

export async function revertStep(
  leadNo: string,
  currentStepNumber: number,
  config: SyncConfig,
): Promise<void> {
  if (currentStepNumber <= 1) return;

  if (config.mode === "local") {
    const localData = localStorage.getItem(LOCAL_LEADS_KEY);
    const leads: Lead[] = localData ? JSON.parse(localData) : [];
    const idx = leads.findIndex((l) => l.leadNo === leadNo);
    if (idx !== -1) {
      const item = leads[idx];
      const prevStep = currentStepNumber - 1;
      (item as any)[`actual${prevStep}`] = "";
      (item as any)[`delay${prevStep}`] = "";
      (item as any)[`planned${currentStepNumber}`] = "";
      leads[idx] = item;
      localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(leads));
    }
    return;
  }

  // Live Sync
  if (!config.appsScriptUrl) {
    throw new Error("Configure Apps Script URL in settings first.");
  }

  const prevStep = currentStepNumber - 1;
  const databaseMappedStepData: Record<string, string> = {
    [`Actual${prevStep}`]: "",
    [`Delay${prevStep}`]: "",
    [`Planned${currentStepNumber}`]: "",
  };

  const response = await fetch(config.appsScriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "updateStep",
      leadNo: leadNo,
      stepData: databaseMappedStepData,
      stepNumber: 99,
    }),
    mode: "cors",
  });

  const json = await response.json();
  if (json.status !== "success") {
    throw new Error(json.message || "Failed to revert step on Google Sheet");
  }
}

export async function deleteLead(
  leadNo: string,
  config: SyncConfig,
): Promise<void> {
  if (config.mode === "local") {
    const localData = localStorage.getItem(LOCAL_LEADS_KEY);
    if (localData) {
      const leads: Lead[] = JSON.parse(localData);
      const filtered = leads.filter((l) => l.leadNo !== leadNo);
      localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(filtered));
    }
    return;
  }

  // Live Sync
  if (!config.appsScriptUrl) {
    throw new Error("Configure Apps Script URL in settings first.");
  }

  const response = await fetch(config.appsScriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "deleteLead",
      leadNo: leadNo,
    }),
    mode: "cors",
  });

  const json = await response.json();
  if (json.status !== "success") {
    throw new Error(json.message || "Failed to delete row from Google Sheet");
  }
}

export async function uploadFileToDrive(
  file: File,
  config: SyncConfig,
): Promise<string> {
  // Convert File to Base64
  const base64Promise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });

  const base64Data = await base64Promise;

  if (config.mode === "local") {
    // For local, generate an object URL or placeholder
    return URL.createObjectURL(file);
  }

  if (!config.appsScriptUrl) {
    throw new Error(
      "Provide Apps Script URL under Settings to save to Google Drive.",
    );
  }

  const response = await fetch(config.appsScriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "uploadFile",
      base64Data: base64Data,
      fileName: file.name,
      mimeType: file.type,
      driveFolderId: config.driveUrl || "",
    }),
    mode: "cors",
  });

  const json = await response.json();
  if (json.status !== "success") {
    throw new Error(json.message || "File upload failed");
  }

  return json.fileUrl;
}
