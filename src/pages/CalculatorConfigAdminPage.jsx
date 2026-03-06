import { useState, useMemo } from 'react';
import { ref, set, push, update, remove } from 'firebase/database';
import { database } from '../firebase/config';
import { useFirebaseQuery } from '../hooks';
import {
  carPriceData as staticCarPriceData,
  uniqueNgoaiThatColors as staticExteriorColors,
  uniqueNoiThatColors as staticInteriorColors,
  formatCurrency,
} from '../data/calculatorData';
import CurrencyInput from '../components/shared/CurrencyInput';
import { Plus, Edit2, Trash2, RotateCcw, ArrowLeft, Image, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const TABS = [
  { key: 'carPrice', label: 'Bảng giá xe' },
  { key: 'exterior', label: 'Màu ngoại thất' },
  { key: 'interior', label: 'Màu nội thất' },
];

const FB = {
  carPrice: 'calculatorConfig/carPriceData',
  exterior: 'calculatorConfig/exteriorColors',
  interior: 'calculatorConfig/interiorColors',
};

const DEFAULT_CAR_ROW = { model: '', trim: '', exterior_color: '', interior_color: '', price_vnd: 0, car_image_url: '' };
const DEFAULT_COLOR_ROW = { code: '', name: '', icon: '' };

/** Chuẩn hóa giá VNĐ từ form/Firebase (string "12.000.000" hoặc number) thành number */
function parsePriceVnd(val) {
  if (val == null || val === '') return 0;
  if (typeof val === 'number' && !Number.isNaN(val)) return Math.max(0, val);
  const num = String(val).replace(/\D/g, '');
  return num ? Math.max(0, parseInt(num, 10)) : 0;
}

export default function CalculatorConfigAdminPage() {
  const [tab, setTab] = useState('carPrice');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [isRestoring, setIsRestoring] = useState(false);
  const [search, setSearch] = useState('');

  const { data: fbCarRows, loading: loadCar } = useFirebaseQuery(FB.carPrice);
  const { data: fbExtRows, loading: loadExt } = useFirebaseQuery(FB.exterior);
  const { data: fbIntRows, loading: loadInt } = useFirebaseQuery(FB.interior);

  const loading = tab === 'carPrice' ? loadCar : tab === 'exterior' ? loadExt : loadInt;
  const rawRows = tab === 'carPrice' ? (fbCarRows || []) : tab === 'exterior' ? (fbExtRows || []) : (fbIntRows || []);

  const rows = useMemo(() => {
    if (!search.trim()) return rawRows;
    const q = search.toLowerCase();
    return rawRows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q)));
  }, [rawRows, search]);

  const openAdd = () => {
    setEditingId(null);
    setForm(tab === 'carPrice' ? DEFAULT_CAR_ROW : DEFAULT_COLOR_ROW);
    setShowForm(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    if (tab === 'carPrice') {
      setForm({
        model: row.model || '', trim: row.trim || '',
        exterior_color: row.exterior_color || '', interior_color: row.interior_color || '',
        price_vnd: parsePriceVnd(row.price_vnd), car_image_url: row.car_image_url || '',
      });
    } else {
      setForm({ code: row.code || '', name: row.name || '', icon: row.icon || '' });
    }
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm({}); };

  const saveRow = async () => {
    const path = FB[tab];
    if (tab === 'carPrice') {
      const payload = {
        model: String(form.model).trim(), trim: String(form.trim).trim(),
        exterior_color: String(form.exterior_color).trim(), interior_color: String(form.interior_color).trim(),
        price_vnd: parsePriceVnd(form.price_vnd), car_image_url: String(form.car_image_url).trim(),
      };
      if (!payload.model || !payload.trim) { toast.warning('Vui lòng nhập Dòng xe và Phiên bản'); return; }
      try {
        if (editingId) {
          await update(ref(database, `${path}/${editingId}`), payload);
          toast.success('Đã cập nhật');
        } else {
          const newRef = push(ref(database, path));
          await set(newRef, payload);
          toast.success('Đã thêm');
        }
        closeForm();
      } catch (err) {
        console.error('Lỗi lưu bảng giá xe:', err);
        const msg = err?.message || err?.code || 'Lỗi lưu';
        toast.error(msg);
      }
    } else {
      const payload = { code: String(form.code).trim(), name: String(form.name).trim(), icon: String(form.icon).trim() };
      if (!payload.code || !payload.name) { toast.warning('Vui lòng nhập Mã và Tên màu'); return; }
      try {
        if (editingId) {
          await update(ref(database, `${path}/${editingId}`), payload);
          toast.success('Đã cập nhật');
        } else {
          const newRef = push(ref(database, path));
          await set(newRef, payload);
          toast.success('Đã thêm');
        }
        closeForm();
      } catch (err) {
        console.error('Lỗi lưu màu:', err);
        toast.error(err?.message || err?.code || 'Lỗi lưu');
      }
    }
  };

  const deleteRow = async (id) => {
    if (!window.confirm('Xóa dòng này?')) return;
    try { await remove(ref(database, `${FB[tab]}/${id}`)); toast.success('Đã xóa'); }
    catch (err) { console.error(err); toast.error(err.message || 'Lỗi xóa'); }
  };

  const restoreDefault = async () => {
    if (!window.confirm('Ghi đè toàn bộ dữ liệu Firebase bằng dữ liệu mặc định?')) return;
    setIsRestoring(true);
    try {
      if (tab === 'carPrice') {
        const baseRef = ref(database, FB.carPrice);
        await set(baseRef, null);
        for (const row of staticCarPriceData) {
          await push(baseRef, { model: row.model, trim: row.trim, exterior_color: row.exterior_color, interior_color: row.interior_color, price_vnd: row.price_vnd, car_image_url: row.car_image_url || '' });
        }
      } else if (tab === 'exterior') {
        const baseRef = ref(database, FB.exterior);
        await set(baseRef, null);
        for (const c of staticExteriorColors) { await push(baseRef, { code: c.code, name: c.name, icon: c.icon || '' }); }
      } else {
        const baseRef = ref(database, FB.interior);
        await set(baseRef, null);
        for (const c of staticInteriorColors) { await push(baseRef, { code: c.code, name: c.name, icon: c.icon || '' }); }
      }
      toast.success('Đã khôi phục dữ liệu mặc định');
    } catch (err) { console.error(err); toast.error(err.message || 'Lỗi khôi phục'); }
    finally { setIsRestoring(false); }
  };

  const restoreAll = async () => {
    if (!window.confirm('Khôi phục TẤT CẢ 3 bảng (Giá xe + Ngoại thất + Nội thất) từ dữ liệu mặc định?')) return;
    setIsRestoring(true);
    try {
      const carRef = ref(database, FB.carPrice);
      await set(carRef, null);
      for (const row of staticCarPriceData) {
        await push(carRef, { model: row.model, trim: row.trim, exterior_color: row.exterior_color, interior_color: row.interior_color, price_vnd: row.price_vnd, car_image_url: row.car_image_url || '' });
      }
      const extRef = ref(database, FB.exterior);
      await set(extRef, null);
      for (const c of staticExteriorColors) { await push(extRef, { code: c.code, name: c.name, icon: c.icon || '' }); }
      const intRef = ref(database, FB.interior);
      await set(intRef, null);
      for (const c of staticInteriorColors) { await push(intRef, { code: c.code, name: c.name, icon: c.icon || '' }); }
      toast.success('Đã khôi phục tất cả 3 bảng');
    } catch (err) { console.error(err); toast.error(err.message || 'Lỗi khôi phục'); }
    finally { setIsRestoring(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Link to="/menu" className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50" aria-label="Quay lại">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Quản trị dữ liệu Báo giá</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={restoreAll} disabled={isRestoring || loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100 disabled:opacity-50 text-sm">
            <RotateCcw className="h-4 w-4" /> Khôi phục tất cả
          </button>
          <button type="button" onClick={restoreDefault} disabled={isRestoring || loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 disabled:opacity-50 text-sm">
            <RotateCcw className="h-4 w-4" /> Khôi phục tab này
          </button>
          <button type="button" onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm">
            <Plus className="h-4 w-4" /> Thêm dòng
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-200">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => { setTab(t.key); setSearch(''); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm..."
          className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 text-sm" />
        {search && <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-slate-400" /></button>}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      ) : tab === 'carPrice' ? (
        <CarPriceTable rows={rows} onEdit={openEdit} onDelete={deleteRow} exteriorColors={fbExtRows || []} interiorColors={fbIntRows || []} />
      ) : (
        <ColorTable rows={rows} onEdit={openEdit} onDelete={deleteRow} type={tab} />
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeForm}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{editingId ? 'Chỉnh sửa' : 'Thêm mới'}</h2>
            {tab === 'carPrice' ? (
              <CarPriceForm form={form} setForm={setForm} />
            ) : (
              <ColorForm form={form} setForm={setForm} />
            )}
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={closeForm} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Hủy</button>
              <button type="button" onClick={saveRow} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">{editingId ? 'Cập nhật' : 'Thêm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── Car Price Table ───── */
function CarPriceTable({ rows, onEdit, onDelete, exteriorColors = [], interiorColors = [] }) {
  const getExtColorName = (code) => {
    const color = exteriorColors.find(c => c.code === code);
    return color?.name || code;
  };
  const getIntColorName = (code) => {
    const color = interiorColors.find(c => c.code === code);
    return color?.name || code;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-600 uppercase">Ảnh</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-600 uppercase">Dòng xe</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-600 uppercase">Phiên bản</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-600 uppercase">Màu ngoại thất</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-600 uppercase">Màu nội thất</th>
            <th className="px-3 py-3 text-right text-xs font-medium text-slate-600 uppercase">Giá (VNĐ)</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-600 uppercase">Đường dẫn ảnh xe</th>
            <th className="px-3 py-3 w-24 text-right text-xs font-medium text-slate-600 uppercase">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Chưa có dữ liệu.</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/50">
              <td className="px-3 py-2">
                {row.car_image_url ? (
                  <img src={row.car_image_url} alt="" className="h-10 w-14 object-contain rounded" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : <div className="h-10 w-14 bg-slate-100 rounded flex items-center justify-center"><Image className="h-4 w-4 text-slate-300" /></div>}
              </td>
              <td className="px-3 py-2 text-sm font-medium text-slate-800">{row.model}</td>
              <td className="px-3 py-2 text-sm text-slate-800">{row.trim}</td>
              <td className="px-3 py-2 text-sm text-slate-700">{getExtColorName(row.exterior_color)}</td>
              <td className="px-3 py-2 text-sm text-slate-700">{getIntColorName(row.interior_color)}</td>
              <td className="px-3 py-2 text-sm text-right font-medium text-slate-800">{formatCurrency(row.price_vnd || 0)}</td>
              <td className="px-3 py-2 text-xs text-slate-500 max-w-[160px] truncate" title={row.car_image_url || ''}>{row.car_image_url || '—'}</td>
              <td className="px-3 py-2 text-right whitespace-nowrap">
                <button type="button" onClick={() => onEdit(row)} className="p-1.5 rounded text-slate-600 hover:bg-slate-200" aria-label="Sửa"><Edit2 className="h-4 w-4" /></button>
                <button type="button" onClick={() => onDelete(row.id)} className="p-1.5 rounded text-red-600 hover:bg-red-50" aria-label="Xóa"><Trash2 className="h-4 w-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───── Color Table (shared for exterior & interior) ───── */
function ColorTable({ rows, onEdit, onDelete, type }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Hình màu</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Mã màu</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Tên màu</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Đường dẫn ảnh màu</th>
            <th className="px-4 py-3 w-24 text-right text-xs font-medium text-slate-600 uppercase">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Chưa có dữ liệu.</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/50">
              <td className="px-4 py-2">
                {row.icon ? (
                  <img src={row.icon} alt={row.name} className="h-8 w-8 rounded-full object-cover border border-slate-200" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center"><Image className="h-3 w-3 text-slate-300" /></div>}
              </td>
              <td className="px-4 py-2 text-sm font-mono font-medium text-slate-800">{row.code}</td>
              <td className="px-4 py-2 text-sm text-slate-800">{row.name}</td>
              <td className="px-4 py-2 text-xs text-slate-500 max-w-[240px] truncate" title={row.icon || ''}>{row.icon || '—'}</td>
              <td className="px-4 py-2 text-right whitespace-nowrap">
                <button type="button" onClick={() => onEdit(row)} className="p-1.5 rounded text-slate-600 hover:bg-slate-200" aria-label="Sửa"><Edit2 className="h-4 w-4" /></button>
                <button type="button" onClick={() => onDelete(row.id)} className="p-1.5 rounded text-red-600 hover:bg-red-50" aria-label="Xóa"><Trash2 className="h-4 w-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───── Car Price Form ───── */
function CarPriceForm({ form, setForm }) {
  return (
    <div className="space-y-4">
      <Field label="Dòng xe" value={form.model} onChange={(v) => setForm((f) => ({ ...f, model: v }))} placeholder="VD: VF 3" />
      <Field label="Phiên bản" value={form.trim} onChange={(v) => setForm((f) => ({ ...f, trim: v }))} placeholder="VD: Base" />
      <Field label="Mã màu ngoại thất" value={form.exterior_color} onChange={(v) => setForm((f) => ({ ...f, exterior_color: v }))} placeholder="VD: CE18" />
      <Field label="Mã màu nội thất" value={form.interior_color} onChange={(v) => setForm((f) => ({ ...f, interior_color: v }))} placeholder="VD: CI11" />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Giá (VNĐ)</label>
        <CurrencyInput value={form.price_vnd} onChange={(v) => setForm((f) => ({ ...f, price_vnd: v }))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Đường dẫn ảnh xe</label>
        <input type="text" value={form.car_image_url} onChange={(e) => setForm((f) => ({ ...f, car_image_url: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="URL hoặc vinfast_images/vf3/..." />
        {form.car_image_url && (
          <div className="mt-2 flex justify-center">
            <img src={form.car_image_url} alt="Preview" className="h-24 object-contain rounded" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ───── Color Form ───── */
function ColorForm({ form, setForm }) {
  return (
    <div className="space-y-4">
      <Field label="Mã màu" value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v }))} placeholder="VD: CE18" />
      <Field label="Tên màu" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="VD: Infinity Blanc" />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Đường dẫn ảnh màu</label>
        <input type="text" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="https://..." />
        {form.icon && (
          <div className="mt-2 flex justify-center">
            <img src={form.icon} alt="Preview" className="h-16 w-16 rounded-full object-cover border border-slate-200" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ───── Shared field ───── */
function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder={placeholder} />
    </div>
  );
}
