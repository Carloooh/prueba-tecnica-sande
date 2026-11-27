import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductoService } from '../../services/producto.service';
import { ProductoConsultaItem, ProductoPrincipal } from '../../models/producto.model';

@Component({
  selector: 'app-tabla-unificacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule
  ],
  templateUrl: './tabla-unificacion.component.html',
  styleUrl: './tabla-unificacion.component.css'
})
export class TablaUnificacionComponent {
  private productoService = inject(ProductoService);

  @Input() productos: ProductoConsultaItem[] = [];
  @Input() cargando: boolean = false;

  // Lista dinámica de opciones para el autocomplete de CODIGO N
  opcionesDestino: ProductoPrincipal[] = [];

  // Columnas visibles de la grilla
  columnasVisibles: string[] = [
    'seccion',
    'categoria',
    'codigo',
    'code',
    'producto',
    'nClientes',
    'tipo',
    'situacion',
    'fui',
    'marca',
    'codigoN'
  ];

  // "Presionando la lupa, se debe poder buscar los codigos existentes para esa marca y esa categoria, seleccionandolo."
  buscarDestinos(row: ProductoConsultaItem, textoBusqueda?: string) {
    const q = (textoBusqueda !== undefined ? textoBusqueda : row.codigoN)?.trim() || '';
    
    // Consulta filtrando por la marca y la categoría de la fila actual
    this.productoService.buscarPrincipales(q, row.idProducto, row.marca, row.categoria).subscribe({
      next: (data) => {
        this.opcionesDestino = data;
      },
      error: (err) => console.error('Error al buscar productos principales por marca/categoría:', err)
    });
  }

  // Al seleccionar una opción del autocompletado
  seleccionarDestino(row: ProductoConsultaItem, opcion: ProductoPrincipal) {
    row.codigoN = opcion.codigo;
    row.idProductoDestino = opcion.idProducto;
    row.productoDestinoNombre = `${opcion.codigo} - ${opcion.producto} (${opcion.proveedor})`;
  }

  // Si el usuario edita o borra el texto manualmente
  onCodigoNCambio(row: ProductoConsultaItem) {
    if (!row.codigoN || !row.codigoN.trim()) {
      row.idProductoDestino = null;
      row.productoDestinoNombre = null;
    }
  }

  // Cuenta cuántos productos tienen destino asignado listo para unificar
  contarPendientes(): number {
    return this.productos.filter(p => !!p.idProductoDestino).length;
  }
}
