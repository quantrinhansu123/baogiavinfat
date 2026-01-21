import * as XLSX from 'xlsx';

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
 * Parse Excel date (can be number or string)
 */
const parseExcelDate = (value) => {
    if (!value) return null;

    // If it's an Excel serial date number
    if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value);
        if (date) {
            return new Date(date.y, date.m - 1, date.d).toISOString().split('T')[0];
        }
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
 * Parse Excel file and extract vehicle inventory data
 * @param {File} file - The Excel file to parse
 * @returns {Promise<Array>} - Array of vehicle objects
 */
export const parseVehicleExcel = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });

                // Get first sheet (KHO XE)
                const sheetName = workbook.SheetNames.find(name =>
                    name.toUpperCase().includes('KHO') ||
                    name.toUpperCase().includes('XE')
                ) || workbook.SheetNames[0];

                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: ''
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

                const headers = jsonData[headerRowIndex].map(h =>
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

                resolve(vehicles);
            } catch (error) {
                reject(new Error('Lỗi đọc file Excel: ' + error.message));
            }
        };

        reader.onerror = () => reject(new Error('Không thể đọc file'));
        reader.readAsArrayBuffer(file);
    });
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

export default parseVehicleExcel;
