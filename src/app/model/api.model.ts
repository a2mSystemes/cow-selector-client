export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface UploadResponse {
  filename: string;
  rowCount: number;
  columns: string[];
}

export interface ExcelRow {
  id: string;
  [key: string]: any;
}

export interface DatabaseInfo {
  elementCount: number;
  hasSelection: boolean;
  lastUpdated: string;
  filename?: string;
  columns: string[];
}

export interface ElementsResponse {
  elements: ExcelRow[];
  info: DatabaseInfo;
}

export interface ServerStatus {
  server: string;
  version: string;
  timestamp: string;
  database: DatabaseInfo;
}

export interface UploadProgress {
  progress: number;
  loaded: number;
  total: number;
}
