import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { ProductoConsultaItem } from '../../models/producto.model';

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
    MatIconModule
  ],
  templateUrl: './tabla-unificacion.component.html',
  styleUrl: './tabla-unificacion.component.css'
})
export class TablaUnificacionComponent {
  // Columnas exactas de la grilla impresa de SANDE
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

  // Datos mock para visualización
  productos: ProductoConsultaItem[] = [
    {
      idProducto: 675212,
      idEntidad: 10983,
      seccion: 'HIDRAULICA',
      categoria: 'CILINDRO HIDRAULICO SIMPLE ACCION',
      codigo: 'RC506-O',
      code: 'RC506-O',
      producto: 'CILINDRO HIDRAULICO SIMPLE ACCION 50T 6.25"C',
      nClientes: 1,
      tipo: 'P',
      situacion: 'I',
      fui: '2609',
      marca: 'ENERPAC',
      stockTotal: 4,
      codigoN: '',
      productoDestinoNombre: ''
    },
    {
      idProducto: 675351,
      idEntidad: 10983,
      seccion: 'HIDRAULICA',
      categoria: 'G/GF MANOMETRO HIDRAULICO',
      codigo: 'G-2535L-O',
      code: 'G-2535L-O',
      producto: 'MANOMETRO HIDRAULICO (G/GF) 1/4"NPTF 10.000 PSI',
      nClientes: 4,
      tipo: 'P',
      situacion: 'I',
      fui: '2608',
      marca: 'ENERPAC',
      stockTotal: 0,
      codigoN: '',
      productoDestinoNombre: ''
    },
    {
      idProducto: 675502,
      idEntidad: 10983,
      seccion: 'HIDRAULICA',
      categoria: 'RCS CILINDRO HIDRAULICO BAJA ALTURA',
      codigo: 'RCS-502-O',
      code: 'RCS-502-O',
      producto: 'CILINDRO HIDRAULICO BAJA ALTURA S/ACCION 50T',
      nClientes: 1,
      tipo: 'P',
      situacion: 'I',
      fui: '2604',
      marca: 'ENERPAC',
      stockTotal: 1,
      codigoN: '',
      productoDestinoNombre: ''
    }
  ];

  // Opciones mock para el autocomplete
  opcionesPrincipalesMock = [
    { codigo: 'RC506', descripcion: 'RC506 - CILINDRO HIDRAULICO 50T (ENERPAC)' },
    { codigo: 'G-2535L', descripcion: 'G-2535L - MANOMETRO HIDRAULICO (ENERPAC)' },
    { codigo: 'RCS-502', descripcion: 'RCS-502 - CILINDRO BAJA ALTURA (ENERPAC)' }
  ];

  seleccionarDestino(row: ProductoConsultaItem, opcion: any) {
    row.codigoN = opcion.codigo;
    row.productoDestinoNombre = opcion.descripcion;
  }
}
