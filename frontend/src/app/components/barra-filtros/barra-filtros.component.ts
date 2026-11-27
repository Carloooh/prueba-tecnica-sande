import { Component } from '@angular/core';

@Component({
  selector: 'app-barra-filtros',
  standalone: true,
  template: `
    <div style="padding: 16px; border-bottom: 1px solid #e0e0e0; margin-bottom: 16px;">
      <h3>Barra Superior: Filtros (Marca, Proveedor, Tipo, Situación) y Acciones (Lupa / Guardar)</h3>
    </div>
  `
})
export class BarraFiltrosComponent {}
