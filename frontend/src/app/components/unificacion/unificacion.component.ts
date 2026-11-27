import { Component } from '@angular/core';
import { BarraFiltrosComponent } from '../barra-filtros/barra-filtros.component';
import { TablaUnificacionComponent } from '../tabla-unificacion/tabla-unificacion.component';

@Component({
  selector: 'app-unificacion',
  standalone: true,
  imports: [BarraFiltrosComponent, TablaUnificacionComponent],
  template: `
    <div style="max-width: 1400px; margin: 0 auto; padding: 20px;">
      <app-barra-filtros />
      <app-tabla-unificacion />
    </div>
  `
})
export class UnificacionComponent {}
