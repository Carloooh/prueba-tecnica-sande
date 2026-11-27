// Proveedor secundario (dbo.entidad)
export interface Proveedor {
  idEntidad: number;
  rut: string;
  abreviacion: string;
  razonSocial: string;
}

// Filtro de marca (dbo.marcas)
export interface Marca {
  idMarca: number;
  marca: string;
}

// Fila devuelta por la consulta de la grilla (tfc_vista_maestro_productos)
export interface ProductoConsultaItem {
  idProducto: number;
  idEntidad: number;
  seccion: string;
  categoria: string;
  codigo: string;
  code: string;
  producto: string;
  nClientes: number;
  tipo: string;
  situacion: string;
  fui: string;
  marca: string;
  stockTotal: number;

  // Campos para edición en la celda CODIGO N
  codigoN?: string | null;
  idProductoDestino?: number | null;
  productoDestinoNombre?: string | null;
  errorDestino?: boolean;
}

export interface ProductosConsultaResponse {
  total: number;
  items: ProductoConsultaItem[];
}

// Producto principal activo para el autocomplete de CODIGO N
export interface ProductoPrincipal {
  idProducto: number;
  codigo: string;
  code: string;
  proveedor: string;
  producto: string;
}

// Payload para la acción de guardado masivo (botón Diskette)
export interface UnificacionItem {
  idProductoOrigen: number;
  idEntidadOrigen: number;
  idProductoDestino: number;
}

export interface UnificarRequest {
  unificaciones: UnificacionItem[];
}

export interface FiltrosConsulta {
  idEntidad?: number;
  marca?: string;
  minClientes?: number;
  tipos?: string[];
  situaciones?: string[];
}

export interface ResultadoUnificacion {
  totalProcesados: number;
  mensaje: string;
}
