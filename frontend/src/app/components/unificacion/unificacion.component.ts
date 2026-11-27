import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { BarraFiltrosComponent } from '../barra-filtros/barra-filtros.component';
import { TablaUnificacionComponent } from '../tabla-unificacion/tabla-unificacion.component';
import { ProductoService } from '../../services/producto.service';
import { ExcelService } from '../../services/excel.service';
import { FiltrosConsulta, ProductoConsultaItem, UnificacionItem } from '../../models/producto.model';

interface ErrorImportacionExcel {
  filaExcel: number;
  codigo: string;
  codigoN: string;
  motivo: string;
}

interface ResumenImportacionData {
  totalFilas: number;
  asignados: number;
  errores: ErrorImportacionExcel[];
}

@Component({
  selector: 'app-confirmar-reset-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title style="display: flex; align-items: center; gap: 8px; margin: 0;">
      <mat-icon color="warn">restart_alt</mat-icon>
      Reiniciar datos de prueba
    </h2>
    <mat-dialog-content style="padding-top: 8px; font-size: 14px; color: #334155;">
      <p style="margin: 0;">
        Esta acción ejecutará <code>sp_Reset_Datos_Prueba</code> en la base de datos y restaurará las unificaciones y stocks a su estado inicial.
      </p>
      <p style="margin: 10px 0 0; color: #b91c1c; font-weight: 500;">
        ¿Deseas continuar?
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">Sí, reiniciar</button>
    </mat-dialog-actions>
  `
})
export class ConfirmarResetDialogComponent {}

@Component({
  selector: 'app-resumen-importacion-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title style="display: flex; align-items: center; gap: 8px; margin: 0;">
      <mat-icon style="color: #dc2626;">warning_amber</mat-icon>
      Detalle de importación Excel
    </h2>
    <mat-dialog-content style="padding-top: 8px;">
      <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; font-size: 13px; font-weight: 600;">
        <span style="background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 12px;">
          Validados: {{ data.asignados }}
        </span>
        <span style="background: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 12px;">
          Con error / sin coincidencia: {{ data.errores.length }}
        </span>
      </div>

      @if (data.asignados > 0) {
        <p style="margin: 0 0 10px; font-size: 13px; color: #15803d;">
          Los {{ data.asignados }} códigos validados ya se cargaron en la tabla. Presiona el diskette para guardarlos.
        </p>
      } @else {
        <p style="margin: 0 0 10px; font-size: 13px; color: #475569;">
          No se pudo validar ninguna fila del archivo con los registros visibles en pantalla. Revisa el detalle:
        </p>
      }

      <div style="max-height: 300px; overflow: auto; border: 1px solid #e2e8f0; border-radius: 6px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f8fafc; text-align: left; border-bottom: 1px solid #cbd5e1;">
              <th style="padding: 8px 10px;">Fila</th>
              <th style="padding: 8px 10px;">Código</th>
              <th style="padding: 8px 10px;">Código N</th>
              <th style="padding: 8px 10px;">Motivo</th>
            </tr>
          </thead>
          <tbody>
            @for (err of data.errores; track $index) {
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 6px 10px; white-space: nowrap;">{{ err.filaExcel }}</td>
                <td style="padding: 6px 10px; font-weight: 600; color: #1976d2; white-space: nowrap;">{{ err.codigo }}</td>
                <td style="padding: 6px 10px; font-weight: 600; white-space: nowrap;">{{ err.codigoN }}</td>
                <td style="padding: 6px 10px; color: #b91c1c;">{{ err.motivo }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" [mat-dialog-close]="true">Entendido</button>
    </mat-dialog-actions>
  `
})
export class ResumenImportacionDialogComponent {
  data = inject<ResumenImportacionData>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-unificacion',
  standalone: true,
  imports: [
    BarraFiltrosComponent, 
    TablaUnificacionComponent,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="unificacion-layout">
      <app-barra-filtros 
        class="navbar-fija"
        (consultar)="alConsultar($event)" 
        (guardar)="alGuardar()" 
        (exportar)="alExportar()"
        (archivoImportado)="alImportar($event)"
        (reiniciar)="alReiniciar()"
      />
      <app-tabla-unificacion 
        class="tabla-fija-wrapper"
        [productos]="productos" 
        [cargando]="cargando" 
      />
    </div>
  `,
  styles: [`
    :host {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .unificacion-layout {
      width: 100%;
      height: 100%;
      padding: 12px 16px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .navbar-fija {
      flex: 0 0 auto;
      position: relative;
      z-index: 20;
    }

    .tabla-fija-wrapper {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class UnificacionComponent {
  private productoService = inject(ProductoService);
  private excelService = inject(ExcelService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
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
      const errores: ErrorImportacionExcel[] = [];

      // Para cada fila leída del Excel, buscamos la fila correspondiente y validamos el destino
      for (const f of filas) {
        if (!(f.idProducto > 0) && !f.codigo) {
          errores.push({
            filaExcel: f.filaExcel,
            codigo: '(sin código)',
            codigoN: f.codigoN,
            motivo: 'Falta ID_PRODUCTO y CODIGO para identificar el producto.'
          });
          continue;
        }

        const row =
          (f.idProducto > 0 ? this.productos.find(p => p.idProducto === f.idProducto) : undefined) ||
          (f.codigo ? this.productos.find(p => p.codigo.trim().toLowerCase() === f.codigo.trim().toLowerCase()) : undefined);

        if (!row) {
          errores.push({
            filaExcel: f.filaExcel,
            codigo: f.codigo || `ID ${f.idProducto}`,
            codigoN: f.codigoN,
            motivo: 'El producto no está en los resultados actuales (revisa los filtros o ya fue unificado).'
          });
          continue;
        }

        row.codigoN = f.codigoN;

        if (f.codigoN.trim().toLowerCase() === row.codigo.trim().toLowerCase()) {
          row.idProductoDestino = null;
          row.productoDestinoNombre = 'No puede unificarse consigo mismo';
          row.errorDestino = true;
          errores.push({
            filaExcel: f.filaExcel,
            codigo: row.codigo,
            codigoN: f.codigoN,
            motivo: 'No se puede asignar el mismo código como destino (auto-unificación).'
          });
          continue;
        }

        try {
          const destinos = await firstValueFrom(
            this.productoService.buscarPrincipales(f.codigoN, row.idProducto, row.marca, row.categoria)
          );

          const exacto =
            destinos.find(d => d.codigo.trim().toLowerCase() === f.codigoN.trim().toLowerCase()) || destinos[0];
          if (exacto) {
            row.idProductoDestino = exacto.idProducto;
            row.productoDestinoNombre = `${exacto.codigo} - ${exacto.producto} (${exacto.proveedor})`;
            row.errorDestino = false;
            asignados++;
          } else {
            row.idProductoDestino = null;
            row.productoDestinoNombre = `No encontrado (${row.marca} / ${row.categoria})`;
            row.errorDestino = true;
            errores.push({
              filaExcel: f.filaExcel,
              codigo: row.codigo,
              codigoN: f.codigoN,
              motivo: `No se encontró el código principal "${f.codigoN}" para la marca ${row.marca} y categoría ${row.categoria}.`
            });
          }
        } catch {
          row.idProductoDestino = null;
          row.productoDestinoNombre = 'Error al validar código';
          row.errorDestino = true;
          errores.push({
            filaExcel: f.filaExcel,
            codigo: row.codigo,
            codigoN: f.codigoN,
            motivo: 'Error al consultar el destino en el servidor.'
          });
        }
      }

      this.productos = [...this.productos];
      this.cargando = false;
      this.cdr.markForCheck();

      if (errores.length === 0 && asignados > 0) {
        this.snackBar.open(`Se importaron y validaron ${asignados} códigos N. Presiona el diskette 💾 para guardar los cambios.`, 'OK', { duration: 6000 });
      } else {
        this.dialog.open(ResumenImportacionDialogComponent, {
          width: '680px',
          maxWidth: '95vw',
          data: {
            totalFilas: filas.length,
            asignados,
            errores
          }
        });
      }
    } catch (err: any) {
      this.cargando = false;
      this.cdr.markForCheck();
      console.error('Error al importar Excel:', err);
      this.snackBar.open(`Error al procesar el archivo Excel: ${err.message}`, 'Cerrar', { duration: 5000 });
    }
  }

  // Utilidad QA/Demo: reinicia los datos de prueba en BD previa confirmación
  alReiniciar() {
    const ref = this.dialog.open(ConfirmarResetDialogComponent, {
      width: '420px',
      maxWidth: '95vw'
    });

    ref.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;

      this.cargando = true;
      this.cdr.markForCheck();

      this.productoService.resetDatosPrueba().subscribe({
        next: (res) => {
          this.snackBar.open(res.message || 'Datos de prueba reiniciados correctamente.', 'OK', { duration: 4000 });
          if (this.productos.length > 0 || this.filtrosActuales.marca || this.filtrosActuales.idEntidad) {
            this.alConsultar(this.filtrosActuales);
          } else {
            this.cargando = false;
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          this.cargando = false;
          this.cdr.markForCheck();
          console.error('Error al reiniciar datos de prueba:', err);
          const errorMsg = err?.error?.message || 'Error al reiniciar los datos de prueba.';
          this.snackBar.open(`Error: ${errorMsg}`, 'Cerrar', { duration: 5000 });
        }
      });
    });
  }
}
