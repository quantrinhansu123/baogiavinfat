import { RotateCcw, SlidersHorizontal } from 'lucide-react';

const FILTER_FIELDS = [
  { key: 'tenKhachHang', label: 'Khách hàng' },
  { key: 'tinhThanh', label: 'Tỉnh thành' },
  { key: 'dongXe', label: 'Dòng xe' },
  { key: 'phienBan', label: 'Phiên bản' },
  { key: 'mauSac', label: 'Ngoại thất' },
  { key: 'nhuCau', label: 'Nhu cầu' },
  { key: 'thanhToan', label: 'Thanh toán' },
  { key: 'nguon', label: 'Nguồn' },
  { key: 'mucDo', label: 'Mức độ' },
  { key: 'tinhTrang', label: 'Trạng thái' },
  { key: 'noiDung', label: 'Nội dung' },
  { key: 'tvbh', label: 'TVBH' },
];

function MultiSelectFilter({ label, options, selected, onChange }) {
  const toggleValue = (value) => {
    onChange(selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]);
  };

  return (
    <details className="relative group">
      <summary className="list-none cursor-pointer select-none border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm flex items-center justify-between gap-2 hover:border-primary-500">
        <span className="truncate">{label}</span>
        <span className={`shrink-0 text-xs rounded-full px-2 py-0.5 ${selected.length ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          {selected.length || 'Tất cả'}
        </span>
      </summary>
      <div className="absolute left-0 z-50 mt-1 w-72 max-w-[85vw] rounded-lg border border-gray-200 bg-white shadow-xl p-2">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-1">
          <span className="text-xs font-semibold text-gray-700">Chọn nhiều {label.toLowerCase()}</span>
          {selected.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="text-xs text-primary-600 hover:underline">
              Tất cả
            </button>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto">
          {options.length === 0 ? (
            <p className="p-2 text-xs text-gray-500">Không có dữ liệu</p>
          ) : options.map((option) => (
            <label key={option} className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-primary-50">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleValue(option)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="break-words">{option}</span>
            </label>
          ))}
        </div>
      </div>
    </details>
  );
}

export default function CustomerAdvancedFilters({ filters, options, onFilterChange, onReset, activeCount }) {
  return (
    <section className="mb-4 rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <SlidersHorizontal className="h-4 w-4 text-primary-600" />
          Bộ lọc nâng cao
          {activeCount > 0 && <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700">{activeCount} bộ lọc</span>}
        </div>
        <button type="button" onClick={onReset} disabled={!activeCount} className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-40">
          <RotateCcw className="h-4 w-4" /> Xóa bộ lọc
        </button>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-gray-700">
          Từ ngày
          <input type="date" value={filters.fromDate} onChange={(e) => onFilterChange('fromDate', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-medium text-gray-700">
          Tới ngày
          <input type="date" value={filters.toDate} onChange={(e) => onFilterChange('toDate', e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {FILTER_FIELDS.map(({ key, label }) => (
          <MultiSelectFilter key={key} label={label} options={options[key] || []} selected={filters[key]} onChange={(values) => onFilterChange(key, values)} />
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-500">Có thể tick nhiều lựa chọn. Không tick mục nào nghĩa là chọn tất cả.</p>
    </section>
  );
}
