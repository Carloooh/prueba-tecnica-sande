import { Component } from '@angular/core';
import { BarraFiltrosComponent } from '../barra-filtros/barra-filtros.component';
import { TablaUnificacionComponent } from '../tabla-unificacion/tabla-unificacion.component';

@Component({
  selector: 'app-unificacion',
  standalone: true,
  imports: [BarraFiltrosComponent, TablaUnificacionComponent],
  template: `
    <div style="width: 100%; padding: 12px 16px; box-sizing: border-box;">
      <app-barra-filtros />
      <app-tabla-unificacion />
    </div>
  `
})
export class UnificacionComponent {}
