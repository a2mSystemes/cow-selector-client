import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/upload',
    pathMatch: 'full'
  },
  {
    path: 'upload',
    loadComponent: () => import('./views/upload/upload.component').then(m => m.UploadComponent),
    title: 'Upload Excel - VMix DataSource Manager'
  },
  {
    path: 'elements',
    loadComponent: () => import('./views/components/elements-list/elements-list.component').then(m => m.ElementsListComponent),
    title: 'Elements List - VMix DataSource Manager'
  },
  {
    path: 'selected',
    loadComponent: () => import('./views/components/selected-element/selected-element.component').then(m => m.SelectedElementComponent),
    title: 'Selected Element - VMix DataSource Manager'
  },
  {
    path: 'status',
    loadComponent: () => import('./views/status/status.component').then(m => m.StatusComponent),
    title: 'Server Status - VMix DataSource Manager'
  },
  {
    path: '**',
    redirectTo: '/upload'
  }
];
