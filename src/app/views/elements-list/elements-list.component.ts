import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { ApiService } from '../../services/api.service';
import { ExcelRow, ElementsResponse, DatabaseInfo } from '../../model/api.model';
import { SelectedElementComponent } from '../selected-element/selected-element.component';

interface ElementsState {
  elements: ExcelRow[];
  selectedElement: ExcelRow | null;
  databaseInfo: DatabaseInfo | null;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
}

@Component({
  selector: 'app-elements-list',
  standalone: true,
  imports: [CommonModule, SelectedElementComponent],
  templateUrl: './elements-list.component.html',
  styleUrl: './elements-list.component.scss'
})
export class ElementsListComponent implements OnInit, OnDestroy {
  private readonly apiService = inject(ApiService);
  private elementsSubscription?: Subscription;

  private readonly _state = signal<ElementsState>({
    elements: [],
    selectedElement: null,
    databaseInfo: null,
    isLoading: false,
    error: null,
    searchTerm: ''
  });

  readonly elements = () => this._state().elements;
  readonly selectedElement = () => this._state().selectedElement;
  readonly databaseInfo = () => this._state().databaseInfo;
  readonly isLoading = () => this._state().isLoading;
  readonly error = () => this._state().error;
  readonly searchTerm = () => this._state().searchTerm;

  readonly filteredElements = () => {
    const elements = this.elements();
    const search = this.searchTerm().toLowerCase().trim();

    if (!search) return elements;

    return elements.filter(element =>
      Object.entries(element).some(([key, value]) =>
        key !== 'id' &&
        value &&
        value.toString().toLowerCase().includes(search)
      )
    );
  };

  readonly hasElements = () => this.elements().length > 0;
  readonly hasSelection = () => this.selectedElement() !== null;
  readonly elementCount = () => this.filteredElements().length;
  readonly totalCount = () => this.elements().length;

  ngOnInit(): void {
    this.loadElements();
  }

  ngOnDestroy(): void {
    this.elementsSubscription?.unsubscribe();
  }


  loadElements(): void {
    this.updateState({ isLoading: true, error: null });

    this.elementsSubscription = this.apiService.getElements().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data as ElementsResponse;
          this.updateState({
            elements: data.elements || [],
            databaseInfo: data.info,
            isLoading: false
          });
        } else {
          this.updateState({
            error: response.error || 'Failed to load elements',
            isLoading: false
          });
        }
      },
      error: (error) => {
        console.error('Error loading elements:', error);
        this.updateState({
          error: error.error?.error || error.message || 'Failed to load elements',
          isLoading: false
        });
      }
    });
  }


  selectElement(element: ExcelRow): void {
    const currentSelected = this.selectedElement();

    // Toggle selection - if same element, deselect
    if (currentSelected && currentSelected.id === element.id) {
      this.updateState({ selectedElement: null });
    } else {
      this.updateState({ selectedElement: element });
    }
    this.apiService.selectElement(element.id).subscribe();
  }

  clearSelection(): void {
    this.updateState({ selectedElement: null });
  }


  onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.updateState({ searchTerm: input.value });
  }

  clearSearch(): void {
    this.updateState({ searchTerm: '' });
  }


  refreshElements(): void {
    this.loadElements();
  }

  clearError(): void {
    this.updateState({ error: null });
  }


  getElementDisplayValue(element: ExcelRow, key: string): string {
    const value = element[key];
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    return value.toString();
  }

  getElementKeys(): string[] {
    const elements = this.elements();
    if (elements.length === 0) return [];

    // Get all unique keys from all elements, excluding 'id'
    const allKeys = new Set<string>();
    elements.forEach(element => {
      Object.keys(element).forEach(key => {
        if (key !== 'id') allKeys.add(key);
      });
    });

    return Array.from(allKeys).sort();
  }

  isElementSelected(element: ExcelRow): boolean {
    const selected = this.selectedElement();
    return selected ? selected.id === element.id : false;
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }

  // === Private Methods ===

  private updateState(partial: Partial<ElementsState>): void {
    this._state.set({ ...this._state(), ...partial });
  }
}
