import { Component, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BarraFiltrosComponent } from '../barra-filtros/barra-filtros.component';
import { TablaUnificacionComponent } from '../tabla-unificacion/tabla-unificacion.component';
import { ProductoService } from '../../services/producto.service';
import { FiltrosConsulta, ProductoConsultaItem, UnificacionItem } from '../../models/producto.model';

@Component({
  selector: 'app-unificacion',
  standalone: true,
  imports: [
    BarraFiltrosComponent, 
    TablaUnificacionComponent,
    MatSnackBarModule
  ],
  template: `
    <div style="width: 100%; padding: 12px 16px; box-sizing: border-box;">
      <app-barra-filtros 
        (consultar)="alConsultar($event)" 
        (guardar)="alGuardar()" 
      />
      <app-tabla-unificacion 
        [productos]="productos" 
        [cargando]="cargando" 
      />
    </div>
  `
})
export class UnificacionComponent {
  private productoService = inject(ProductoService);
  private snackBar = inject(MatSnackBar);

  productos: ProductoConsultaItem[] = [];
  cargando: boolean = false;
  filtrosActuales: FiltrosConsulta = {};

  // Ejecuta la consulta contra la vista maestro con los filtros seleccionados
  alConsultar(filtros: FiltrosConsulta) {
    this.filtrosActuales = filtros;
    this.cargando = true;

    this.productoService.consultarProductos(
      filtros.idEntidad,
      filtros.marca,
      filtros.minClientes,
      filtros.tipos,
      filtros.situaciones
    ).subscribe({
      next: (res) => {
        this.productos = res.items || [];
        this.cargando = false;
        if (this.productos.length === 0) {
          this.snackBar.open('No se encontraron productos con los filtros seleccionados.', 'OK', { duration: 3000 });
        }
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al consultar productos:', err);
        this.snackBar.open('Error al consultar datos. Verifica que el backend esté ejecutándose.', 'Cerrar', { duration: 4000 });
      }
    });
  }

  // Guarda las unificaciones asignadas bajo transacción atómica
  alGuardar() {
    const seleccionados = this.productos.filter(
      p => p.idProductoDestino && p.idProductoDestino > 0
    );

    if (seleccionados.length === 0) {
      this.snackBar.open('No has asignado ningún Código N para unificar.', 'OK', { duration: 3000 });
      return;
    }

    const payload: UnificacionItem[] = seleccionados.map(p => ({
      idProductoOrigen: p.idProducto,
      idEntidadOrigen: p.idEntidad,
      idProductoDestino: p.idProductoDestino!
    }));

    this.cargando = true;
    this.productoService.unificar(payload).subscribe({
      next: (res) => {
        this.snackBar.open(res.mensaje || 'Unificación completada con éxito.', 'OK', { duration: 4000 });
        // Recargamos la grilla para refrescar los datos y reflejar los productos unificados
        this.alConsultar(this.filtrosActuales);
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error al guardar unificaciones:', err);
        const errorMsg = err?.error?.message || 'Error al procesar la unificación.';
        this.snackBar.open(`Error: ${errorMsg}`, 'Cerrar', { duration: 5000 });
      }
    });
  }
}
