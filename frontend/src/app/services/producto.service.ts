import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Proveedor,
  Marca,
  ProductosConsultaResponse,
  ProductoPrincipal,
  UnificacionItem,
  UnificarRequest,
  ResultadoUnificacion
} from '../models/producto.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Selector Supplier [S]: consulta proveedores, filtrados opcionalmente por marca
  getProveedores(q?: string, marca?: string): Observable<Proveedor[]> {
    let params = new HttpParams();
    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }
    if (marca && marca.trim()) {
      params = params.set('marca', marca.trim());
    }
    return this.http.get<Proveedor[]>(`${this.apiUrl}/proveedores`, { params });
  }

  // Buscador de Marca: carga todas las marcas disponibles o filtra por texto / proveedor
  getMarcas(q?: string, idEntidad?: number): Observable<Marca[]> {
    let params = new HttpParams();
    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }
    if (idEntidad && idEntidad > 0) {
      params = params.set('idEntidad', idEntidad.toString());
    }
    return this.http.get<Marca[]>(`${this.apiUrl}/marcas`, { params });
  }

  // Acción Lupa / Consulta automática: consulta la grilla con los filtros activos
  consultarProductos(
    idEntidad?: number,
    marca?: string,
    minClientes?: number,
    tipos?: string[],
    situaciones?: string[]
  ): Observable<ProductosConsultaResponse> {
    let params = new HttpParams();

    if (idEntidad && idEntidad > 0) {
      params = params.set('idEntidad', idEntidad.toString());
    }
    if (marca && marca.trim()) {
      params = params.set('marca', marca.trim());
    }
    if (minClientes && minClientes > 0) {
      params = params.set('minClientes', minClientes.toString());
    }
    if (tipos && tipos.length > 0) {
      params = params.set('tipos', tipos.join(','));
    }
    if (situaciones && situaciones.length > 0) {
      params = params.set('situaciones', situaciones.join(','));
    }

    return this.http.get<ProductosConsultaResponse>(`${this.apiUrl}/productos/consulta`, { params });
  }

  // Autocomplete celda CODIGO N: busca productos principales activos para esa marca y categoría
  buscarPrincipales(
    q?: string, 
    excluirId?: number, 
    marca?: string, 
    categoria?: string
  ): Observable<ProductoPrincipal[]> {
    let params = new HttpParams();
    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }
    if (excluirId && excluirId > 0) {
      params = params.set('excluirId', excluirId.toString());
    }
    if (marca && marca.trim()) {
      params = params.set('marca', marca.trim());
    }
    if (categoria && categoria.trim()) {
      params = params.set('categoria', categoria.trim());
    }
    return this.http.get<ProductoPrincipal[]>(`${this.apiUrl}/productos/principales/buscar`, { params });
  }

  // Acción Diskette: envía la lista de unificaciones bajo transacción atómica
  unificar(unificaciones: UnificacionItem[]): Observable<ResultadoUnificacion> {
    const payload: UnificarRequest = { unificaciones };
    return this.http.post<ResultadoUnificacion>(`${this.apiUrl}/productos/unificar`, payload);
  }
}
