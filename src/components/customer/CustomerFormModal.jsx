import { X } from 'lucide-react';
import { provinces } from '../../data/provincesData';
import {
  MUC_DO_OPTIONS,
  TINH_TRANG_OPTIONS,
  THANH_TOAN_OPTIONS,
  NHU_CAU_OPTIONS,
  NGUON_OPTIONS,
  KHACH_HANG_LA_OPTIONS
} from './CustomerDropdownConstants';

export default function CustomerFormModal({
  isOpen,
  mode = 'add', // 'add' or 'edit'
  formData,
  contracts = [],
  onClose,
  onSave,
  onInputChange,
  onContractSelect,
  getCarModels,
  getVariants,
  getColors,
  getInteriorColors,
  normalizeDateInputValue
}) {
  if (!isOpen) return null;

  const title = mode === 'add' ? 'Thêm Khách Hàng Mới' : 'Chỉnh Sửa Khách Hàng';
  const saveButtonText = mode === 'add' ? 'Lưu' : 'Cập nhật';

  return (
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="modal-box bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-primary-700 truncate">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Contract Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn Hợp Đồng (tùy chọn)
            </label>
            <select
              value={formData.selectedContractId}
              onChange={(e) => onContractSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Chọn hợp đồng --</option>
              {contracts.map((contract) => (
                <option key={contract.firebaseKey} value={contract.firebaseKey}>
                  {contract.customerName} - {contract.phone} - {contract.dongXe} ({contract.createdAt})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Chọn hợp đồng để tự động điền thông tin khách hàng</p>
          </div>

          <div className={`grid ${mode === 'edit' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2'} gap-${mode === 'edit' ? '3 sm:gap-4' : '4'}`}>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Ngày <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.ngay}
                onChange={(e) => onInputChange('ngay', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Tên Khách Hàng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.tenKhachHang}
                onChange={(e) => onInputChange('tenKhachHang', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Số Điện Thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.soDienThoai}
                onChange={(e) => onInputChange('soDienThoai', e.target.value)}
                placeholder="+84 912 345 678"
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Mặc định vùng Việt Nam (+84)</p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Khách hàng là
              </label>
              <select
                value={formData.khachHangLa}
                onChange={(e) => onInputChange('khachHangLa', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Chọn loại khách hàng --</option>
                {KHACH_HANG_LA_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {formData.khachHangLa === 'Công ty' && (
              <div className={`${mode === 'edit' ? 'col-span-1 sm:col-span-2' : 'col-span-2'} grid grid-cols-1 sm:grid-cols-2 gap-${mode === 'edit' ? '3 sm:gap-4' : '4'}`}>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    MSDN / Mã số thuế
                  </label>
                  <input
                    type="text"
                    value={formData.msdn}
                    onChange={(e) => onInputChange('msdn', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Người đại diện
                  </label>
                  <input
                    type="text"
                    value={formData.daiDien}
                    onChange={(e) => onInputChange('daiDien', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Chức vụ
                  </label>
                  <input
                    type="text"
                    value={formData.chucVu}
                    onChange={(e) => onInputChange('chucVu', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Số giấy ủy quyền
                  </label>
                  <input
                    type="text"
                    value={formData.giayUyQuyen}
                    onChange={(e) => onInputChange('giayUyQuyen', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Ngày giấy ủy quyền
                  </label>
                  <input
                    type="date"
                    value={normalizeDateInputValue(formData.giayUyQuyenNgay)}
                    onChange={(e) => onInputChange('giayUyQuyenNgay', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Tỉnh Thành
              </label>
              <select
                value={formData.tinhThanh}
                onChange={(e) => onInputChange('tinhThanh', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Chọn tỉnh thành --</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Dòng Xe
              </label>
              <select
                value={formData.dongXe}
                onChange={(e) => {
                  onInputChange('dongXe', e.target.value);
                  // Reset phiên bản when dòng xe changes
                  if (e.target.value !== formData.dongXe) {
                    onInputChange('phienBan', '');
                  }
                }}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Chọn dòng xe --</option>
                {getCarModels().map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
                {/* Show current value if it doesn't match any option */}
                {formData.dongXe && !getCarModels().includes(formData.dongXe) && (
                  <option value={formData.dongXe}>
                    {formData.dongXe} (giá trị hiện tại)
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Phiên Bản
              </label>
              <select
                value={formData.phienBan}
                onChange={(e) => onInputChange('phienBan', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!formData.dongXe}
              >
                <option value="">-- Chọn phiên bản --</option>
                {getVariants(formData.dongXe).map((variant) => (
                  <option key={variant} value={variant}>
                    {variant}
                  </option>
                ))}
                {/* Show current value if it doesn't match any option */}
                {formData.phienBan && !getVariants(formData.dongXe).includes(formData.phienBan) && (
                  <option value={formData.phienBan}>
                    {formData.phienBan} (giá trị hiện tại)
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Ngoại Thất
              </label>
              <select
                value={formData.mauSac}
                onChange={(e) => onInputChange('mauSac', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!formData.dongXe}
              >
                <option value="">-- Chọn ngoại thất --</option>
                {getColors(formData.dongXe, formData.phienBan).map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
                {/* Show current value if it doesn't match any option */}
                {formData.mauSac && !getColors(formData.dongXe, formData.phienBan).includes(formData.mauSac) && (
                  <option value={formData.mauSac}>
                    {formData.mauSac} (giá trị hiện tại)
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Nội Thất
              </label>
              <select
                value={formData.noiThat}
                onChange={(e) => onInputChange('noiThat', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={!formData.dongXe}
              >
                <option value="">-- Chọn nội thất --</option>
                {getInteriorColors(formData.dongXe, formData.phienBan).map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
                {formData.noiThat && !getInteriorColors(formData.dongXe, formData.phienBan).includes(formData.noiThat) && (
                  <option value={formData.noiThat}>
                    {formData.noiThat} (giá trị hiện tại)
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Nhu Cầu
              </label>
              <select
                value={formData.nhuCau}
                onChange={(e) => onInputChange('nhuCau', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Chọn nhu cầu --</option>
                {NHU_CAU_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Thanh Toán
              </label>
              <select
                value={formData.thanhToan}
                onChange={(e) => onInputChange('thanhToan', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Chọn phương thức thanh toán --</option>
                {THANH_TOAN_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Nguồn
              </label>
              <select
                value={formData.nguon}
                onChange={(e) => onInputChange('nguon', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Chọn nguồn --</option>
                {NGUON_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Mức Độ
              </label>
              <select
                value={formData.mucDo}
                onChange={(e) => onInputChange('mucDo', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Chọn mức độ --</option>
                {MUC_DO_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                Trạng thái khách hàng
              </label>
              <select
                value={formData.tinhTrang}
                onChange={(e) => onInputChange('tinhTrang', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Chọn trạng thái khách hàng --</option>
                {TINH_TRANG_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Nội Dung
            </label>
            <textarea
              value={formData.noiDung}
              onChange={(e) => onInputChange('noiDung', e.target.value)}
              rows={3}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onSave}
            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {saveButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
