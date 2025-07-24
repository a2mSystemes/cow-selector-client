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
    loadComponent: () => import('./views/elements-list/elements-list.component').then(m => m.ElementsListComponent),
    title: 'Elements List - VMix DataSource Manager'
  },
  {
    path: '**',
    redirectTo: '/upload'
  }
];
