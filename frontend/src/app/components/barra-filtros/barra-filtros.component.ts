import { Component, EventEmitter, OnInit, Output, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductoService } from '../../services/producto.service';
import { FiltrosConsulta, Marca, Proveedor } from '../../models/producto.model';

@Component({
  selector: 'app-barra-filtros',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatButtonToggleModule,
    MatSelectModule,
    MatTooltipModule
  ],
  templateUrl: './barra-filtros.component.html',
  styleUrl: './barra-filtros.component.css'
})
export class BarraFiltrosComponent implements OnInit {
  private productoService = inject(ProductoService);
  private cdr = inject(ChangeDetectorRef);

  @Output() consultar = new EventEmitter<FiltrosConsulta>();
  @Output() guardar = new EventEmitter<void>();
  @Output() exportar = new EventEmitter<void>();
  @Output() archivoImportado = new EventEmitter<File>();

  // Filtros de texto seleccionados
  marcaTexto = '';
  proveedorTexto = '';
  idEntidadSeleccionada?: number;

  // Catálogos cargados desde la BD
  marcasDisponibles: Marca[] = [];
  marcasFiltradas: Marca[] = [];
  proveedoresFiltrados: Proveedor[] = [];

  // Filtro de clientes mínimos (#C)
  minClientes = 0;

  // Multi-toggles
  tiposSeleccionados: string[] = [];
  situacionesSeleccionadas: string[] = [];

  ngOnInit() {
    this.cargarTodasLasMarcas();
  }

  // Carga todas las marcas disponibles en la BD
  cargarTodasLasMarcas() {
    this.productoService.getMarcas('').subscribe({
      next: (data) => {
        this.marcasDisponibles = data;
        this.filtrarMarcasLocales(this.marcaTexto);
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error al cargar marcas:', err)
    });
  }

  filtrarMarcasLocales(filtro: string) {
    const q = filtro?.toLowerCase().trim() || '';
    if (!q) {
      this.marcasFiltradas = [...this.marcasDisponibles];
    } else {
      this.marcasFiltradas = this.marcasDisponibles.filter(m =>
        m.marca.toLowerCase().includes(q)
      );
    }
    this.cdr.markForCheck();
  }

  onMarcaInput() {
    this.filtrarMarcasLocales(this.marcaTexto);
  }

  // Al seleccionar una marca:
  // Carga en el buscador de supplier todos los proveedores para esa marca
  onMarcaSeleccionada(event: MatAutocompleteSelectedEvent) {
    const marcaElegida = event.option.value;
    this.marcaTexto = marcaElegida;

    // Reseteamos el proveedor anterior para forzar la elección del proveedor de la nueva marca
    this.proveedorTexto = '';
    this.idEntidadSeleccionada = undefined;

    // Cargamos los proveedores asociados a esa marca
    this.cargarProveedoresPorMarca(marcaElegida);
    this.cdr.markForCheck();
  }

  // Carga proveedores para la marca seleccionada
  cargarProveedoresPorMarca(marca: string, query: string = '') {
    this.productoService.getProveedores(query, marca).subscribe({
      next: (data) => {
        this.proveedoresFiltrados = data;
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error al cargar proveedores por marca:', err)
    });
  }

  onProveedorInput() {
    this.idEntidadSeleccionada = undefined;
    this.cargarProveedoresPorMarca(this.marcaTexto, this.proveedorTexto);
  }

  // Al seleccionar un proveedor:
  // "Una vez lista esta selección se debe listar en el formulario los productos de esa marca para ese proveedor"
  onProveedorSeleccionado(event: MatAutocompleteSelectedEvent) {
    const prov: Proveedor = event.option.value;
    this.proveedorTexto = prov.abreviacion;
    this.idEntidadSeleccionada = prov.idEntidad;
    this.cdr.markForCheck();

    // Dispara automáticamente la consulta para listar de inmediato en la tabla
    this.ejecutarConsulta();
  }

  // Al presionar el botón [S], recarga la lista de proveedores para la marca actual
  toggleProveedor() {
    this.cargarProveedoresPorMarca(this.marcaTexto, '');
  }

  // Emite la consulta (tanto manual por Lupa como automática al seleccionar proveedor)
  ejecutarConsulta() {
    this.consultar.emit({
      idEntidad: this.idEntidadSeleccionada,
      marca: this.marcaTexto?.trim() || undefined,
      minClientes: this.minClientes,
      tipos: this.tiposSeleccionados.length > 0 ? this.tiposSeleccionados : undefined,
      situaciones: this.situacionesSeleccionadas.length > 0 ? this.situacionesSeleccionadas : undefined
    });
  }

  // Emite el guardado de unificaciones (Diskette)
  ejecutarGuardar() {
    this.guardar.emit();
  }

  // Emite la exportación a Excel
  ejecutarExportar() {
    this.exportar.emit();
  }

  // Al seleccionar un archivo Excel para importar
  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoImportado.emit(input.files[0]);
      input.value = ''; // Permite volver a subir el mismo archivo si se edita
    }
  }
}
