import { X, Plus } from 'lucide-react';

export default function WorkHistoryModal({
  isOpen,
  customer,
  workHistoryEntries,
  onClose,
  onSave,
  onAddEntry,
  onRemoveEntry,
  onUpdateEntry
}) {
  if (!isOpen || !customer) return null;

  return (
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="modal-box bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-primary-700 truncate">
            Lịch sử làm việc - {customer.tenKhachHang}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {workHistoryEntries.map((entry, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm sm:text-base font-semibold text-gray-700">Lần {entry.lan}</h4>
                {workHistoryEntries.length > 1 && (
                  <button
                    onClick={() => onRemoveEntry(index)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Xóa lần này"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Ngày <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={entry.ngay}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Auto-format as user types (dd/mm/yyyy)
                    // Remove non-numeric characters except /
                    value = value.replace(/[^\d/]/g, '');
                    // Auto-insert slashes
                    if (value.length > 2 && value[2] !== '/') {
                      value = value.slice(0, 2) + '/' + value.slice(2);
                    }
                    if (value.length > 5 && value[5] !== '/') {
                      value = value.slice(0, 5) + '/' + value.slice(5);
                    }
                    // Limit to dd/mm/yyyy format (10 characters)
                    if (value.length <= 10) {
                      onUpdateEntry(index, 'ngay', value);
                    }
                  }}
                  placeholder="dd/mm/yyyy"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={entry.noiDung}
                  onChange={(e) => onUpdateEntry(index, 'noiDung', e.target.value)}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nhập nội dung lịch sử làm việc..."
                />
              </div>
            </div>
          ))}

          <button
            onClick={onAddEntry}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm lần</span>
          </button>
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
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
