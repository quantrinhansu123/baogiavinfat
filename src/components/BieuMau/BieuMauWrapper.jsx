import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getBranchByShowroomName } from '../../data/branchData';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { PrintStyles } from './PrintStyles';

/**
 * Wrapper component for BieuMau with print validation and shared styles
 */
export function BieuMauWrapper({
  children,
  title,
  requiredFields = ['tenKh', 'cccd', 'soDienThoai', 'dongXe'],
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const data = location.state || {};
  const branch = getBranchByShowroomName(data.showroom);

  const handlePrint = () => {
    // Validate required fields
    const fieldLabels = {
      tenKh: 'Tên khách hàng',
      customerName: 'Tên khách hàng',
      cccd: 'CCCD',
      soDienThoai: 'Số điện thoại',
      phone: 'Số điện thoại',
      dongXe: 'Dòng xe',
      model: 'Dòng xe',
      ngoaiThat: 'Màu xe',
      diaChi: 'Địa chỉ',
      address: 'Địa chỉ',
    };

    const missing = [];
    for (const field of requiredFields) {
      const value = data[field] || data[fieldLabels[field]];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missing.push(fieldLabels[field] || field);
      }
    }

    if (missing.length > 0) {
      toast.error(`Thiếu thông tin bắt buộc: ${missing.join(', ')}`);
      return;
    }

    if (!branch) {
      toast.error('Chưa chọn showroom. Vui lòng quay lại và chọn showroom.');
      return;
    }

    window.print();
  };

  const handleBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-gray-50 p-8" style={{ fontFamily: 'Times New Roman' }}>
      <PrintStyles />

      <div className="flex gap-6 max-w-4xl mx-auto">
        <div ref={printableRef} className="flex-1 bg-white" id="printable-content">
          {typeof children === 'function'
            ? children({ data, branch, formatCurrency, formatDate })
            : children
          }
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-8 print:hidden">
        <div className="text-center flex flex-wrap justify-center gap-3">
          <button onClick={handleBack} className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition">
            Quay lại
          </button>
          <button onClick={handlePrint} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
            In {title}
          </button>
        </div>
      </div>
    </div>
  );
}
