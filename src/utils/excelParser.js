import ExcelJS from 'exceljs';

/**
 * Vehicle status constants matching Excel data
 */
export const VEHICLE_STATUSES = {
    READY: 'ready',           // Sẵn Sàng
    NOT_ARRIVED: 'not_arrived', // Chưa về
    ARRIVED: 'arrived',       // Đã về
    MATCHED: 'matched',       // Đã ghép KH
    EXPORTED: 'exported',     // Đã xuất
    DELIVERED: 'delivered'    // Đã giao
};

export const STATUS_LABELS = {
    [VEHICLE_STATUSES.READY]: 'Sẵn Sàng',
    [VEHICLE_STATUSES.NOT_ARRIVED]: 'Chưa về',
    [VEHICLE_STATUSES.ARRIVED]: 'Đã về',
    [VEHICLE_STATUSES.MATCHED]: 'Đã ghép KH',
    [VEHICLE_STATUSES.EXPORTED]: 'Đã xuất',
    [VEHICLE_STATUSES.DELIVERED]: 'Đã giao'
};

export const STATUS_COLORS = {
    [VEHICLE_STATUSES.READY]: 'bg-green-100 text-green-800',
    [VEHICLE_STATUSES.NOT_ARRIVED]: 'bg-gray-100 text-gray-800',
    [VEHICLE_STATUSES.ARRIVED]: 'bg-blue-100 text-blue-800',
    [VEHICLE_STATUSES.MATCHED]: 'bg-purple-100 text-purple-800',
    [VEHICLE_STATUSES.EXPORTED]: 'bg-yellow-100 text-yellow-800',
    [VEHICLE_STATUSES.DELIVERED]: 'bg-emerald-100 text-emerald-800'
};

/**
 * Map Vietnamese status text to status code
 */
const mapStatusFromExcel = (statusText) => {
    if (!statusText) return VEHICLE_STATUSES.NOT_ARRIVED;
    const text = statusText.toString().trim().toLowerCase();

    if (text.includes('sẵn sàng')) return VEHICLE_STATUSES.READY;
    if (text.includes('chưa về')) return VEHICLE_STATUSES.NOT_ARRIVED;
    if (text.includes('đã về')) return VEHICLE_STATUSES.ARRIVED;
    if (text.includes('đã ghép') || text.includes('ghép kh')) return VEHICLE_STATUSES.MATCHED;
    if (text.includes('đã xuất')) return VEHICLE_STATUSES.EXPORTED;
    if (text.includes('đã giao')) return VEHICLE_STATUSES.DELIVERED;

    return VEHICLE_STATUSES.NOT_ARRIVED;
};

/**
 * Parse Excel date (can be Date object, number or string)
 */
const parseExcelDate = (value) => {
    if (!value) return null;

    // If it's already a Date object (exceljs returns Date for date cells)
    if (value instanceof Date) {
        return value.toISOString().split('T')[0];
    }

    // If it's an Excel serial date number
    if (typeof value === 'number') {
        // Excel serial date: days since 1900-01-01 (with Excel bug for 1900 leap year)
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + value * 86400000);
        return date.toISOString().split('T')[0];
    }

    // If it's a string, try to parse it
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed) {
            const parsed = new Date(trimmed);
            if (!isNaN(parsed.getTime())) {
                return parsed.toISOString().split('T')[0];
            }
        }
    }

    return null;
};

/**
 * Get cell value from ExcelJS cell (handles rich text, formulas, etc.)
 */
const getCellValue = (cell) => {
    if (!cell || cell.value === null || cell.value === undefined) return '';

    const value = cell.value;

    // Handle rich text
    if (typeof value === 'object' && value.richText) {
        return value.richText.map(rt => rt.text).join('');
    }

    // Handle formula results
    if (typeof value === 'object' && value.result !== undefined) {
        return value.result;
    }

    return value;
};

/**
 * Parse Excel file and extract vehicle inventory data
 * @param {File} file - The Excel file to parse
 * @returns {Promise<Array>} - Array of vehicle objects
 */
export const parseVehicleExcel = async (file) => {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    // Get first sheet (KHO XE)
    let worksheet = workbook.worksheets.find(ws =>
        ws.name.toUpperCase().includes('KHO') ||
        ws.name.toUpperCase().includes('XE')
    ) || workbook.worksheets[0];

    if (!worksheet) {
        throw new Error('Không tìm thấy sheet dữ liệu');
    }

    // Convert worksheet to array of arrays
    const jsonData = [];
    worksheet.eachRow((row, rowNumber) => {
        const rowData = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            rowData[colNumber - 1] = getCellValue(cell);
        });
        jsonData.push(rowData);
    });

    // Find header row (contains DÒNG XE)
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i];
        if (row && row.some(cell =>
            cell && cell.toString().toUpperCase().includes('DÒNG XE')
        )) {
            headerRowIndex = i;
            break;
        }
    }

    const headers = (jsonData[headerRowIndex] || []).map(h =>
        h ? h.toString().trim().toUpperCase() : ''
    );

    // Map column indices
    const colMap = {
        showroom: headers.findIndex(h => h === 'SR' || h.includes('SHOWROOM')),
        model: headers.findIndex(h => h.includes('DÒNG XE') || h === 'DÒNG XE'),
        trim: headers.findIndex(h => h.includes('PHIÊN BẢN')),
        exteriorColor: headers.findIndex(h => h === 'MÀU' || h.includes('MÀU NGOẠI') || (h.includes('MÀU') && !h.includes('NỘI'))),
        interiorColor: headers.findIndex(h => h.includes('NỘI THẤT') || h.includes('MÀU NỘI')),
        vin: headers.findIndex(h => h.includes('VIN') || h.includes('SỐ VIN')),
        yearMfg: headers.findIndex(h => h.includes('NĂM SX') || h.includes('NĂM')),
        location: headers.findIndex(h => h.includes('ĐỊA ĐIỂM') || h.includes('VTẢI')),
        transport: headers.findIndex(h => h.includes('VẬN TẢI')),
        poDate: headers.findIndex(h => h.includes('NGÀY PO')),
        importDate: headers.findIndex(h => h.includes('NGÀY NHẬP') || h.includes('NHẬP KHO')),
        daysInStock: headers.findIndex(h => h.includes('SỐ NGÀY TỒN') || h.includes('NGÀY TỒN')),
        stockStatus: headers.findIndex(h => h.includes('TRẠNG THÁI TỒN') || h.includes('TỒN KHO')),
        vinMatchDate: headers.findIndex(h => h.includes('NGÀY GHÉP VIN') || h.includes('GHÉP VIN')),
        customerName: headers.findIndex(h => h.includes('TÊN KH') || h.includes('KHÁCH HÀNG')),
        salesPerson: headers.findIndex(h => h === 'TVBH' || h.includes('TVBH')),
        status: headers.findIndex(h => h.includes('TÌNH TRẠNG') && !h.includes('TỒN'))
    };

    // Parse data rows
    const vehicles = [];
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;

        const model = colMap.model >= 0 ? row[colMap.model] : '';
        if (!model || model.toString().trim() === '') continue;

        const vehicle = {
            id: Date.now() + i,
            showroom: colMap.showroom >= 0 ? (row[colMap.showroom] || '').toString().trim() : '',
            model: model.toString().trim(),
            trim: colMap.trim >= 0 ? (row[colMap.trim] || '').toString().trim() : '',
            exterior_color: colMap.exteriorColor >= 0 ? (row[colMap.exteriorColor] || '').toString().trim() : '',
            exterior_color_name: colMap.exteriorColor >= 0 ? (row[colMap.exteriorColor] || '').toString().trim() : '',
            interior_color: colMap.interiorColor >= 0 ? (row[colMap.interiorColor] || '').toString().trim() : '',
            interior_color_name: colMap.interiorColor >= 0 ? (row[colMap.interiorColor] || '').toString().trim() : '',
            vin: colMap.vin >= 0 ? (row[colMap.vin] || '').toString().trim() : '',
            year_mfg: colMap.yearMfg >= 0 ? (row[colMap.yearMfg] || '').toString().trim() : '',
            location: colMap.location >= 0 ? (row[colMap.location] || '').toString().trim() : '',
            transport: colMap.transport >= 0 ? (row[colMap.transport] || '').toString().trim() : '',
            po_date: colMap.poDate >= 0 ? parseExcelDate(row[colMap.poDate]) : null,
            import_date: colMap.importDate >= 0 ? parseExcelDate(row[colMap.importDate]) : null,
            days_in_stock: colMap.daysInStock >= 0 ? parseInt(row[colMap.daysInStock]) || 0 : 0,
            stock_status: colMap.stockStatus >= 0 ? (row[colMap.stockStatus] || '').toString().trim() : '',
            vin_match_date: colMap.vinMatchDate >= 0 ? parseExcelDate(row[colMap.vinMatchDate]) : null,
            customer_name: colMap.customerName >= 0 ? (row[colMap.customerName] || '').toString().trim() : '',
            sales_person: colMap.salesPerson >= 0 ? (row[colMap.salesPerson] || '').toString().trim() : '',
            status: mapStatusFromExcel(colMap.status >= 0 ? row[colMap.status] : ''),
            quantity: 1,
            price: 0,
            image_url: '',
            created_at: new Date().toISOString()
        };

        vehicles.push(vehicle);
    }

    return vehicles;
};

/**
 * Generate Excel template file for vehicle import
 * Creates a template with correct headers and sample data row
 */
export const generateImportTemplate = () => {
    const headers = [
        'SR',
        'DÒNG XE',
        'PHIÊN BẢN',
        'MÀU',
        'NỘI THẤT',
        'SỐ VIN',
        'NĂM SX',
        'ĐỊA ĐIỂM',
        'VẬN TẢI',
        'NGÀY PO',
        'NGÀY NHẬP KHO',
        'SỐ NGÀY TỒN',
        'TRẠNG THÁI TỒN',
        'NGÀY GHÉP VIN',
        'TÊN KH',
        'TVBH',
        'TÌNH TRẠNG'
    ];

    // Sample data row to guide users
    const sampleRow = [
        'S00901',
        'VF 5',
        'Plus',
        'Trắng',
        'Đen',
        'RLNV5JSE1SH000001',
        '2025',
        'SR Trường Chinh',
        'Tín Nghĩa',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'Sẵn Sàng'
    ];

    return { headers, sampleRow };
};

/**
 * Export vehicles to Excel file using ExcelJS
 * @param {Array} vehicles - Array of vehicle objects
 * @param {string} filename - Output filename
 */
export const exportVehiclesToExcel = async (vehicles, filename = 'KhoXe.xlsx') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Kho xe');

    // Define columns
    worksheet.columns = [
        { header: 'STT', key: 'stt', width: 6 },
        { header: 'Showroom', key: 'showroom', width: 15 },
        { header: 'Dòng xe', key: 'model', width: 12 },
        { header: 'Phiên bản', key: 'trim', width: 15 },
        { header: 'Màu ngoại thất', key: 'exterior', width: 18 },
        { header: 'Màu nội thất', key: 'interior', width: 15 },
        { header: 'Số VIN', key: 'vin', width: 20 },
        { header: 'Năm SX', key: 'year', width: 10 },
        { header: 'Ngày nhập kho', key: 'importDate', width: 15 },
        { header: 'Trạng thái', key: 'status', width: 12 },
        { header: 'Tên KH', key: 'customer', width: 20 },
        { header: 'TVBH', key: 'sales', width: 15 },
        { header: 'Số lượng', key: 'quantity', width: 10 },
        { header: 'Giá', key: 'price', width: 15 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    vehicles.forEach((v, idx) => {
        worksheet.addRow({
            stt: idx + 1,
            showroom: v.showroom || '',
            model: v.model || '',
            trim: v.trim || '',
            exterior: v.exterior_color_name || v.exterior_color || '',
            interior: v.interior_color_name || v.interior_color || '',
            vin: v.vin || '',
            year: v.year_mfg || '',
            importDate: v.import_date || '',
            status: STATUS_LABELS[v.status] || v.status || '',
            customer: v.customer_name || '',
            sales: v.sales_person || '',
            quantity: v.quantity || 1,
            price: v.price || 0
        });
    });

    // Generate buffer and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Use FileSaver or native download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

/**
 * Generate and download Excel template using ExcelJS
 */
export const downloadImportTemplate = async () => {
    const { headers, sampleRow } = generateImportTemplate();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('KHO XE');

    // Add header row
    worksheet.addRow(headers);

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // Set column widths
    worksheet.columns.forEach((col, idx) => {
        col.width = 18;
    });

    // Add sample row
    worksheet.addRow(sampleRow);

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Mau_Import_KhoXe.xlsx';
    link.click();
    URL.revokeObjectURL(url);
};

export default parseVehicleExcel;
