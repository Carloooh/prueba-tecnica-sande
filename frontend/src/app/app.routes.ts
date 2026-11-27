import { Routes } from '@angular/router';
import { UnificacionComponent } from './components/unificacion/unificacion.component';

export const routes: Routes = [
  { path: '', component: UnificacionComponent },
  { path: '**', redirectTo: '' }
];
