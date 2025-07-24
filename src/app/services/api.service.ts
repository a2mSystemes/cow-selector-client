import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest, HttpEventType } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, UploadProgress, UploadResponse, ElementsResponse, ExcelRow, ServerStatus } from '../model/api.model';
// Interfaces pour les réponses API


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/v1';
  private readonly healthUrl = 'http://localhost:3000/health';

  /**
   * Upload d'un fichier Excel avec progress
   */
  uploadExcel(file: File): Observable<{ type: 'progress' | 'response', data: UploadProgress | ApiResponse<UploadResponse> }> {
    const formData = new FormData();
    formData.append('excel', file);

    const req = new HttpRequest('POST', `${this.baseUrl}/upload`, formData, {
      reportProgress: true,
      responseType: 'json'
    });

    return this.http.request<ApiResponse<UploadResponse>>(req).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progress = Math.round(100 * event.loaded / event.total);
          return {
            type: 'progress' as const,
            data: {
              progress,
              loaded: event.loaded,
              total: event.total
            }
          };
        } else if (event.type === HttpEventType.Response) {
          return {
            type: 'response' as const,
            data: event.body as ApiResponse<UploadResponse>
          };
        }
        // Pour les autres types d'événements, on retourne un progress à 0
        return {
          type: 'progress' as const,
          data: { progress: 0, loaded: 0, total: 0 }
        };
      })
    );
  }

  /**
   * Récupère tous les éléments importés
   */
  getElements(): Observable<ApiResponse<ElementsResponse>> {
    return this.http.get<ApiResponse<ElementsResponse>>(`${this.baseUrl}/elements`);
  }

  /**
   * Sélectionne un élément par ID
   */
  selectElement(id: string): Observable<ApiResponse<ExcelRow>> {
    return this.http.put<ApiResponse<ExcelRow>>(`${this.baseUrl}/element/select/${id}`, {});
  }

  /**
   * Récupère l'élément actuellement sélectionné (pour VMix)
   */
  getSelectedElement(): Observable<ApiResponse<ExcelRow>> {
    return this.http.get<ApiResponse<ExcelRow>>(`${this.baseUrl}/element/selected`);
  }

  /**
   * Status détaillé du serveur
   */
  getServerStatus(): Observable<ApiResponse<ServerStatus>> {
    return this.http.get<ApiResponse<ServerStatus>>(`${this.baseUrl}/status`);
  }

  /**
   * Health check du serveur
   */
  healthCheck(): Observable<{ status: string; timestamp: string; service: string }> {
    return this.http.get<{ status: string; timestamp: string; service: string }>(this.healthUrl);
  }

  /**
   * Reset de la base de données
   */
  resetDatabase(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/reset`);
  }

  /**
   * Validation d'un fichier Excel
   */
  validateExcelFile(file: File): { isValid: boolean; error?: string } {
    // Vérifier le type de fichier
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: 'Only Excel files (.xlsx, .xls) are accepted'
      };
    }

    // Vérifier la taille (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        error: 'File size must not exceed 10 MB'
      };
    }

    return { isValid: true };
  }

  /**
   * Utilitaire pour formatter la taille de fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Utilitaire pour obtenir l'icône FontAwesome d'un fichier
   */
  getFileIcon(filename: string): string {
    const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'));
    switch (extension) {
      case '.xlsx':
      case '.xls':
        return 'fa-file-excel';
      default:
        return 'fa-file';
    }
  }
}
