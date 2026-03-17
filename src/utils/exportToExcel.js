import ExcelJS from 'exceljs';

/**
 * Export an array of data to an Excel file and trigger download.
 * @param {Object} options
 * @param {Array<Object>} options.data - Array of row objects
 * @param {Array<{ header: string, key?: string, getValue?: (row: Object, index: number) => any }>} options.columns - Column definitions (header + key or getValue)
 * @param {string} [options.sheetName='Sheet1'] - Worksheet name
 * @param {string} [options.filename] - Download filename (default: sheetName + date)
 */
export async function exportTableToExcel({ data, columns, sheetName = 'Sheet1', filename }) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName, { properties: { defaultRowHeight: 20 } });

  const excelColumns = columns.map((col) => ({
    header: col.header,
    key: col.key || col.header.replace(/\s+/g, '_'),
    width: Math.min(Math.max(String(col.header).length + 2, 10), 50),
  }));
  worksheet.columns = excelColumns;

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  data.forEach((row, index) => {
    const rowData = {};
    columns.forEach((col) => {
      const key = col.key || col.header.replace(/\s+/g, '_');
      const value = col.getValue ? col.getValue(row, index) : (row[col.key] ?? row[key] ?? '');
      rowData[key] = value == null || value === '' ? '' : value;
    });
    worksheet.addRow(rowData);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const name = filename || `${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
