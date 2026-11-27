import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

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
export class BarraFiltrosComponent {
  // Filtros desactivados por defecto para que el usuario elija qué filtrar
  marcaSeleccionada = '';
  proveedorSeleccionado = '';
  minClientes = 0;
  
  // Toggles desactivados por defecto
  tiposSeleccionados: string[] = [];
  situacionesSeleccionadas: string[] = [];
}
