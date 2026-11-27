import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { ProductoConsultaItem } from '../models/producto.model';

export interface FilaExcelImportada {
  idProducto: number;
  codigo: string;
  codigoN: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  // Exporta los productos filtrados en pantalla a un archivo Excel (.xlsx)
  exportarAExcel(productos: ProductoConsultaItem[], marca?: string, proveedor?: string): void {
    if (!productos || productos.length === 0) {
      throw new Error('No hay productos para exportar.');
    }

    // Mapeamos los datos con nombres claros de columnas
    const filas = productos.map(p => ({
      'ID_PRODUCTO': p.idProducto,
      'ID_ENTIDAD': p.idEntidad,
      'SECCION': p.seccion,
      'CATEGORIA': p.categoria,
      'CODIGO': p.codigo,
      'CODE': p.code,
      'PRODUCTO': p.producto,
      'CLIENTES': p.nClientes,
      'TIPO': p.tipo,
      'SITUACION': p.situacion,
      'FUI': p.fui,
      'MARCA': p.marca,
      'STOCK': p.stockTotal,
      'CODIGO_N': p.codigoN || ''
    }));

    // Creamos la hoja de cálculo
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(filas);

    // Ajustamos ancho de columnas para mejor legibilidad
    ws['!cols'] = [
      { wch: 12 }, // ID_PRODUCTO
      { wch: 12 }, // ID_ENTIDAD
      { wch: 15 }, // SECCION
      { wch: 35 }, // CATEGORIA
      { wch: 16 }, // CODIGO
      { wch: 16 }, // CODE
      { wch: 45 }, // PRODUCTO
      { wch: 10 }, // CLIENTES
      { wch: 8 },  // TIPO
      { wch: 10 }, // SITUACION
      { wch: 8 },  // FUI
      { wch: 15 }, // MARCA
      { wch: 10 }, // STOCK
      { wch: 18 }  // CODIGO_N (Columna a completar)
    ];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Unificacion');

    // Nombre de archivo descriptivo según filtros
    const tagMarca = marca?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'General';
    const tagProv = proveedor?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Proveedor';
    const nombreArchivo = `Unificacion_${tagMarca}_${tagProv}.xlsx`;

    XLSX.writeFile(wb, nombreArchivo);
  }

  // Lee un archivo Excel subido y extrae las filas que tengan CODIGO_N definido
  async importarDesdeExcel(file: File): Promise<FilaExcelImportada[]> {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    const primeraHoja = wb.SheetNames[0];
    const ws = wb.Sheets[primeraHoja];

    const filasRaw: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
    const resultado: FilaExcelImportada[] = [];

    for (const fila of filasRaw) {
      // Reconoce columnas con variaciones habituales de nombres
      const idProducto = Number(fila['ID_PRODUCTO'] || fila['idProducto'] || fila['id_producto'] || 0);
      const codigo = String(fila['CODIGO'] || fila['codigo'] || fila['Codigo'] || '').trim();
      const codigoN = String(fila['CODIGO_N'] || fila['codigoN'] || fila['CODIGO N'] || fila['CodigoN'] || '').trim();

      if ((idProducto > 0 || codigo) && codigoN) {
        resultado.push({
          idProducto,
          codigo,
          codigoN
        });
      }
    }

    return resultado;
  }
}
