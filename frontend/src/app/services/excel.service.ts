import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx-js-style';
import { ProductoConsultaItem } from '../models/producto.model';

export interface FilaExcelImportada {
  filaExcel: number;
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

    // 1. Configuración de anchos de columnas
    ws['!cols'] = [
      { wch: 14 }, // ID_PRODUCTO
      { wch: 14 }, // ID_ENTIDAD
      { wch: 18 }, // SECCION
      { wch: 38 }, // CATEGORIA
      { wch: 16 }, // CODIGO
      { wch: 16 }, // CODE
      { wch: 48 }, // PRODUCTO
      { wch: 12 }, // CLIENTES (#)
      { wch: 10 }, // TIPO (T)
      { wch: 14 }, // SITUACION (S)
      { wch: 10 }, // FUI
      { wch: 16 }, // MARCA
      { wch: 12 }, // STOCK
      { wch: 22 }  // CODIGO_N (Editable)
    ];

    // 2. Altura de filas (más holgada para la cabecera)
    ws['!rows'] = [{ hpt: 26 }];

    // 3. Aplicación de estilos visuales celda por celda
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:N1');

    // Paleta de colores:
    // Cabecera: Azul corporativo elegante #1E3A8A (Navy oscuro sofisticado)
    // Filas alternas: Blanco #FFFFFF y Celeste suave pastel #F0F9FF
    // Columna CODIGO_N: Fondo suave #FEFCE8 (amarillo claro sutil para denotar campo editable)
    const estiloBordeFino = {
      top: { style: 'thin', color: { rgb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
      left: { style: 'thin', color: { rgb: 'E2E8F0' } },
      right: { style: 'thin', color: { rgb: 'E2E8F0' } }
    };

    for (let R = range.s.r; R <= range.e.r; ++R) {
      const esCabecera = R === 0;
      const esFilaImpar = R % 2 === 1; // Para alternancia blanco / celeste suave
      const colorFilaZebra = esFilaImpar ? 'FFFFFF' : 'F0F9FF';

      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) {
          ws[cellAddress] = { t: 's', v: '' };
        }
        const cell = ws[cellAddress];
        const esColumnaCodigoN = C === 13; // Última columna (CODIGO_N)

        if (esCabecera) {
          // Estilo de la cabecera: fondo azul marino, letras blancas en negrita y centrado
          cell.s = {
            fill: { 
              fgColor: { rgb: esColumnaCodigoN ? '0F766E' : '1E3A8A' } // Verde azulado distinguido para CODIGO_N
            },
            font: {
              name: 'Segoe UI',
              sz: 10,
              bold: true,
              color: { rgb: 'FFFFFF' }
            },
            alignment: {
              vertical: 'center',
              horizontal: 'center',
              wrapText: false
            },
            border: {
              top: { style: 'thin', color: { rgb: '0F172A' } },
              bottom: { style: 'medium', color: { rgb: '0F172A' } },
              left: { style: 'thin', color: { rgb: '334155' } },
              right: { style: 'thin', color: { rgb: '334155' } }
            }
          };
        } else {
          // Estilo de las filas de datos: alternancia blanco / celeste suave
          const alineacionCentrada = [0, 1, 7, 8, 9, 10, 12, 13].includes(C);

          cell.s = {
            fill: {
              fgColor: { rgb: esColumnaCodigoN ? 'FEFCE8' : colorFilaZebra }
            },
            font: {
              name: 'Segoe UI',
              sz: 9.5,
              color: { 
                rgb: C === 4 ? '1976D2' : (esColumnaCodigoN ? '15803D' : '1E293B') 
              },
              bold: C === 4 || esColumnaCodigoN // Resalta CÓDIGO en azul y CODIGO_N en verde
            },
            alignment: {
              vertical: 'center',
              horizontal: alineacionCentrada ? 'center' : 'left',
              wrapText: false
            },
            border: esColumnaCodigoN ? {
              top: { style: 'thin', color: { rgb: 'CBD5E1' } },
              bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
              left: { style: 'medium', color: { rgb: '16A34A' } },
              right: { style: 'thin', color: { rgb: 'CBD5E1' } }
            } : estiloBordeFino
          };
        }
      }
    }

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Unificacion');

    // Nombre de archivo descriptivo
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

    const filasRaw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
    const resultado: FilaExcelImportada[] = [];

    const leerColumna = (fila: Record<string, unknown>, ...aliasNormalizados: string[]): string => {
      for (const key of Object.keys(fila)) {
        const normalizada = key.trim().toLowerCase().replace(/[\s_]+/g, '');
        if (aliasNormalizados.includes(normalizada)) {
          return String(fila[key] ?? '').trim();
        }
      }
      return '';
    };

    filasRaw.forEach((fila, index) => {
      const idProductoRaw = leerColumna(fila, 'idproducto');
      const idProducto = Number(idProductoRaw) || 0;
      const codigo = leerColumna(fila, 'codigo', 'código');
      const codigoN = leerColumna(fila, 'codigon', 'códigon');

      if (codigoN) {
        resultado.push({
          filaExcel: index + 2,
          idProducto,
          codigo,
          codigoN
        });
      }
    });

    return resultado;
  }
}
