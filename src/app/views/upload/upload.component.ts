import { Component, ElementRef, ViewChild, signal, inject, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { MessageComponent } from '../components/message';
import { MessageData } from '../components/message';

import { UploadResponse, UploadProgress, UploadState } from '../../model/api.model';



@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [MessageComponent],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.scss'
})
export class UploadComponent implements OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private readonly apiService = inject(ApiService);
  private uploadSubscription?: Subscription;

  // State management avec signaux
  private readonly _state = signal<UploadState>({
    selectedFile: null,
    isDragOver: false,
    uploadProgress: null,
    isUploading: false,
    uploadResult: null,
    error: null
  });

  // Signaux publics en lecture seule
  readonly selectedFile = () => this._state().selectedFile;
  readonly isDragOver = () => this._state().isDragOver;
  readonly uploadProgress = () => this._state().uploadProgress;
  readonly isUploading = () => this._state().isUploading;
  readonly uploadResult = () => this._state().uploadResult;
  readonly error = () => this._state().error;

  ngOnDestroy(): void {
    this.uploadSubscription?.unsubscribe();
  }

  // === Event Handlers ===

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.updateState({ isDragOver: true });
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.updateState({ isDragOver: false });
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.updateState({ isDragOver: false });

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  openFileDialog(): void {
    this.fileInput.nativeElement.click();
  }

  // === Actions ===

  uploadFile(): void {
    const file = this.selectedFile();
    if (!file || this.isUploading()) return;

    this.updateState({
      isUploading: true,
      uploadProgress: 0,
      error: null,
      uploadResult: null
    });

    this.uploadSubscription = this.apiService.uploadExcel(file).subscribe({
      next: (event) => {
        if (event.type === 'progress') {
          const progressData = event.data as UploadProgress;
          this.updateState({ uploadProgress: progressData.progress });
        } else if (event.type === 'response') {
          const response = event.data as any;
          if (response?.success) {
            this.updateState({
              uploadResult: response.data,
              uploadProgress: 100
            });
            // Reset après 3 secondes
            setTimeout(() => this.resetUpload(), 3000);
          } else {
            this.updateState({
              error: response?.error || 'Upload failed',
              isUploading: false,
              uploadProgress: null
            });
          }
        }
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.updateState({
          error: error.error?.error || error.message || 'Upload failed',
          isUploading: false,
          uploadProgress: null
        });
      },
      complete: () => {
        this.updateState({ isUploading: false });
      }
    });
  }

  resetUpload(): void {
    this.uploadSubscription?.unsubscribe();

    this.updateState({
      selectedFile: null,
      uploadProgress: null,
      uploadResult: null,
      error: null,
      isUploading: false,
      isDragOver: false
    });

    // Clear file input
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  clearError(): void {
    this.updateState({ error: null });
  }

  clearSuccess(): void {
    this.updateState({ uploadResult: null });
  }

  // === Message Helpers ===

  getErrorMessageData(): MessageData | null {
    const error = this.error();
    if (!error) return null;

    return {
      type: 'error',
      title: 'Upload Error',
      message: error,
      closable: true,
      autoDismiss: false
    };
  }

  getSuccessMessageData(): MessageData | null {
    const result = this.uploadResult();
    if (!result) return null;

    const details = [
      `${result.rowCount} rows imported`,
      `${result.columns.length} columns detected`,
      result.filename || 'File processed'
    ];

    return {
      type: 'success',
      title: 'Upload Successful!',
      message: 'Your Excel file has been imported successfully',
      details: details,
      closable: true,
      autoDismiss: true,
      duration: 6000
    };
  }

  onErrorMessageDismissed(): void {
    this.clearError();
  }

  onSuccessMessageDismissed(): void {
    this.clearSuccess();
  }

  // === Utilitaires ===

  formatFileSize(bytes: number): string {
    return this.apiService.formatFileSize(bytes);
  }

  getFileIcon(filename: string): string {
    return this.apiService.getFileIcon(filename);
  }

  // === Private Methods ===

  private handleFileSelection(file: File): void {
    const validation = this.apiService.validateExcelFile(file);

    if (!validation.isValid) {
      this.updateState({ error: validation.error || 'Invalid file' });
      return;
    }

    this.updateState({
      selectedFile: file,
      error: null,
      uploadResult: null
    });
  }

  private updateState(partial: Partial<UploadState>): void {
    this._state.set({ ...this._state(), ...partial });
  }
}
