import { Component, Input, Output, EventEmitter } from '@angular/core';

import { ExcelRow } from '../../../model/api.model';

@Component({
  selector: 'app-selected-element',
  standalone: true,
  imports: [],
  templateUrl: './selected-element.component.html',
  styleUrl: './selected-element.component.scss'
})
export class SelectedElementComponent {
  @Input() selectedElement: ExcelRow | null = null;
  @Input() elementKeys: string[] = [];

  @Output() clearSelection = new EventEmitter<void>();

  hasSelection(): boolean {
    return this.selectedElement !== null;
  }
  onClearSelection(): void {
    this.clearSelection.emit();
  }

  getElementDisplayValue(element: ExcelRow, key: string): string {
    const value = element[key];
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    return value.toString();
  }
}
