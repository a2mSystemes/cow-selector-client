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
  fileSize: number | null;
  mimeType: string | null;
  metadata: any;
}

export interface UploadState {
  selectedFile: File | null;
  isDragOver: boolean;
  uploadProgress: number | null;
  isUploading: boolean;
  uploadResult: UploadResponse | null;
  error: string | null;
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
