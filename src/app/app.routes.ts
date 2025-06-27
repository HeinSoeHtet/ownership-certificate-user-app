import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'verify',
    pathMatch: 'full',
  },
  {
    path: 'verify',
    loadComponent: () => import('./pages/verify/verify').then((c) => c.Verify),
  },
  {
    path: 'vault',
    loadComponent: () => import('./pages/vault/vault').then((c) => c.Vault),
  },
  {
    path: 'certificate/:id',
    loadComponent: () =>
      import('./pages/certificate/certificate').then((c) => c.Certificate),
  },
  {
    path: 'transfer/:id',
    loadComponent: () =>
      import('./pages/transfer/transfer').then((c) => c.Transfer),
  },
];
