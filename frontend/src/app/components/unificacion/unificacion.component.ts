import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { BarraFiltrosComponent } from '../barra-filtros/barra-filtros.component';
import { TablaUnificacionComponent } from '../tabla-unificacion/tabla-unificacion.component';
import { ProductoService } from '../../services/producto.service';
import { ExcelService } from '../../services/excel.service';
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
        (exportar)="alExportar()"
        (archivoImportado)="alImportar($event)"
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
  private excelService = inject(ExcelService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  productos: ProductoConsultaItem[] = [];
  cargando: boolean = false;
  filtrosActuales: FiltrosConsulta = {};

  // Ejecuta la consulta contra la vista maestro con los filtros seleccionados
  alConsultar(filtros: FiltrosConsulta) {
    this.filtrosActuales = filtros;
    this.cargando = true;
    this.cdr.markForCheck();

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
        this.cdr.markForCheck();

        if (this.productos.length === 0) {
          this.snackBar.open('No se encontraron productos con los filtros seleccionados.', 'OK', { duration: 3000 });
        }
      },
      error: (err) => {
        this.cargando = false;
        this.cdr.markForCheck();
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
    this.cdr.markForCheck();

    this.productoService.unificar(payload).subscribe({
      next: (res) => {
        // En lugar de volver a consultar a la BD por HTTP, removemos localmente
        // las filas que acaban de ser unificadas de forma 100% instantánea y expedita
        const idsUnificados = new Set(payload.map(u => u.idProductoOrigen));
        this.productos = this.productos.filter(p => !idsUnificados.has(p.idProducto));
        this.cargando = false;
        this.cdr.markForCheck();

        this.snackBar.open(res.mensaje || 'Unificación completada con éxito.', 'OK', { duration: 3000 });
      },
      error: (err) => {
        this.cargando = false;
        this.cdr.markForCheck();
        console.error('Error al guardar unificaciones:', err);
        const errorMsg = err?.error?.message || 'Error al procesar la unificación.';
        this.snackBar.open(`Error: ${errorMsg}`, 'Cerrar', { duration: 5000 });
      }
    });
  }

  // Exporta los productos filtrados en pantalla a Excel
  alExportar() {
    if (!this.productos || this.productos.length === 0) {
      this.snackBar.open('No hay productos en pantalla para exportar. Selecciona filtros primero.', 'OK', { duration: 3000 });
      return;
    }

    try {
      this.excelService.exportarAExcel(
        this.productos, 
        this.filtrosActuales.marca, 
        this.filtrosActuales.idEntidad?.toString()
      );
      this.snackBar.open(`Se exportaron ${this.productos.length} productos a Excel correctamente.`, 'OK', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open(`Error al exportar a Excel: ${err.message}`, 'Cerrar', { duration: 4000 });
    }
  }

  // Importa modificaciones masivas de Código N desde un archivo Excel
  async alImportar(file: File) {
    if (!this.productos || this.productos.length === 0) {
      this.snackBar.open('Primero realiza una consulta para tener los productos en pantalla donde aplicar los cambios.', 'OK', { duration: 4000 });
      return;
    }

    this.cargando = true;
    this.cdr.markForCheck();

    try {
      const filas = await this.excelService.importarDesdeExcel(file);
      if (filas.length === 0) {
        this.snackBar.open('El archivo Excel no contiene filas con la columna CODIGO_N completada.', 'OK', { duration: 4000 });
        this.cargando = false;
        this.cdr.markForCheck();
        return;
      }

      let asignados = 0;

      // Para cada fila leída del Excel, buscamos la fila correspondiente y validamos el destino
      for (const f of filas) {
        const row = this.productos.find(p => 
          (f.idProducto > 0 && p.idProducto === f.idProducto) ||
          (f.codigo && p.codigo.trim().toLowerCase() === f.codigo.trim().toLowerCase())
        );

        if (row) {
          row.codigoN = f.codigoN;

          try {
            const destinos = await firstValueFrom(
              this.productoService.buscarPrincipales(f.codigoN, row.idProducto, row.marca, row.categoria)
            );

            const exacto = destinos.find(d => d.codigo.trim().toLowerCase() === f.codigoN.toLowerCase()) || destinos[0];
            if (exacto) {
              row.idProductoDestino = exacto.idProducto;
              row.productoDestinoNombre = `${exacto.codigo} - ${exacto.producto} (${exacto.proveedor})`;
              asignados++;
            } else {
              row.idProductoDestino = null;
              row.productoDestinoNombre = 'Código principal no encontrado';
            }
          } catch {
            row.idProductoDestino = null;
            row.productoDestinoNombre = null;
          }
        }
      }

      this.cargando = false;
      this.cdr.markForCheck();

      if (asignados > 0) {
        this.snackBar.open(`Se importaron y validaron ${asignados} códigos N. Presiona el diskette 💾 para guardar los cambios.`, 'OK', { duration: 6000 });
      } else {
        this.snackBar.open('No se encontraron coincidencias válidas entre el Excel y los productos en pantalla.', 'OK', { duration: 5000 });
      }
    } catch (err: any) {
      this.cargando = false;
      this.cdr.markForCheck();
      console.error('Error al importar Excel:', err);
      this.snackBar.open(`Error al procesar el archivo Excel: ${err.message}`, 'Cerrar', { duration: 5000 });
    }
  }
}
