import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, Plus, Check, Edit, Trash2, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { ref, push, set, update, remove, get } from 'firebase/database';
import { database } from '../firebase/config';
import { formatCurrency, getAvailableDongXeForPromotion } from '../data/calculatorData';
import { useCarPriceData } from '../contexts/CarPriceDataContext';

const normalizeDongXe = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'object' && !Array.isArray(val)) return Object.values(val).filter(Boolean);
    return [];
};

/** Format date for display: yyyy-MM-dd -> dd/MM/yyyy, else return as-is */
const formatEffectiveDateDisplay = (val) => {
    if (!val) return '—';
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        const [y, m, d] = val.split('-');
        return `${d}/${m}/${y}`;
    }
    return val;
};

const DMS_OPTIONS = [
    { value: '', label: 'Chọn DMS' },
    { value: 'CTKM (Fix discount)', label: 'CTKM (Fix discount)' },
    { value: 'Phiếu thu 51', label: 'Phiếu thu 51' },
    { value: 'Chính sách', label: 'Chính sách' },
];

const DMS_ADD_OPTION_VALUE = '__add_dms__';
const DMS_CUSTOM_STORAGE_KEY = 'promotionDmsCustomOptions';

export default function PromotionsPage() {
    const navigate = useNavigate();
    const { carPriceData } = useCarPriceData();

    // states
    const [promotions, setPromotions] = useState([]);
    const [loadingPromotions, setLoadingPromotions] = useState(false);
    const [isAddMode, setIsAddMode] = useState(false);
    const [newPromotionName, setNewPromotionName] = useState('');
    const [newPromotionDms, setNewPromotionDms] = useState('');
    const [promotionType, setPromotionType] = useState('display');
    const [selectedDongXeList, setSelectedDongXeList] = useState([]);
    const [editingPromotionId, setEditingPromotionId] = useState(null);
    const [editingPromotion, setEditingPromotion] = useState({
        name: '',
        type: 'display',
        value: 0,
        maxDiscount: 0,
        minPurchase: 0,
        dongXe: [],
        dms: '',
        thoiGianApDung: '', // dd/MM/yyyy
        tinhTrang: 'Còn Hiệu Lực' // "Còn Hiệu Lực" | "Hết Hiệu Lực"
    });
    const [deletingPromotionId, setDeletingPromotionId] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [filterDms, setFilterDms] = useState('all');
    const [promotionSearchTerm, setPromotionSearchTerm] = useState('');

    // DMS: danh sách DMS tùy chỉnh (thêm mới) + modal thêm DMS
    const [customDmsOptions, setCustomDmsOptions] = useState(() => {
        try {
            const saved = localStorage.getItem(DMS_CUSTOM_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [showAddDmsModal, setShowAddDmsModal] = useState(false);
    const [newDmsInputValue, setNewDmsInputValue] = useState('');
    const [addDmsContext, setAddDmsContext] = useState(null); // 'add' | 'edit'

    const userEmail = localStorage.getItem('userEmail') || '';
    const username = localStorage.getItem('username') || '';

    const availableDongXeForPromotion = useMemo(
        () => getAvailableDongXeForPromotion(carPriceData),
        [carPriceData]
    );

    const dongXeCodeToName = useMemo(
        () => Object.fromEntries(availableDongXeForPromotion.map((x) => [x.code, x.name])),
        [availableDongXeForPromotion]
    );

    useEffect(() => {
        loadPromotions();
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(DMS_CUSTOM_STORAGE_KEY, JSON.stringify(customDmsOptions));
        } catch (e) { /* ignore */ }
    }, [customDmsOptions]);

    const openAddDmsModal = (context) => {
        setAddDmsContext(context);
        setNewDmsInputValue('');
        setShowAddDmsModal(true);
    };

    const handleAddDmsSubmit = () => {
        const val = (newDmsInputValue || '').trim();
        if (!val) {
            toast.warning('Vui lòng nhập tên DMS.');
            return;
        }
        const allValues = [...DMS_OPTIONS.map(o => o.value), ...customDmsOptions].filter(Boolean);
        if (allValues.includes(val)) {
            toast.info('DMS này đã có trong danh sách.');
            if (addDmsContext === 'add') setNewPromotionDms(val);
            if (addDmsContext === 'edit') setEditingPromotion(prev => ({ ...prev, dms: val }));
            setShowAddDmsModal(false);
            setAddDmsContext(null);
            return;
        }
        setCustomDmsOptions(prev => [...prev, val]);
        if (addDmsContext === 'add') setNewPromotionDms(val);
        if (addDmsContext === 'edit') setEditingPromotion(prev => ({ ...prev, dms: val }));
        setShowAddDmsModal(false);
        setAddDmsContext(null);
        setNewDmsInputValue('');
        toast.success('Đã thêm DMS.');
    };

    const loadPromotions = async () => {
        setLoadingPromotions(true);
        try {
            const promotionsRef = ref(database, 'promotions');
            const snapshot = await get(promotionsRef);
            if (snapshot.exists()) {
                const promotionsList = Object.entries(snapshot.val()).map(([id, data]) => ({
                    id,
                    ...data,
                    isHardcoded: false
                }));

                const formattedPromotions = promotionsList.map(promotion => {
                    let value = typeof promotion.value === 'number' ? promotion.value : 0;
                    if (promotion.type === 'percentage' && value > 0 && value < 1) {
                        value = value * 100;
                    }
                    return {
                        id: promotion.id,
                        name: promotion.name || '',
                        type: promotion.type || 'display',
                        value,
                        maxDiscount: typeof promotion.maxDiscount === 'number' ? promotion.maxDiscount : 0,
                        minPurchase: typeof promotion.minPurchase === 'number' ? promotion.minPurchase : 0,
                        dongXe: promotion.dongXe,
                        dms: promotion.dms ?? '',
                        thoiGianApDung: promotion.thoiGianApDung ?? '',
                        tinhTrang: promotion.tinhTrang ?? 'Còn Hiệu Lực',
                        createdAt: promotion.createdAt || new Date().toISOString(),
                        createdBy: promotion.createdBy || 'system',
                        isHardcoded: !!promotion.isHardcoded
                    };
                });

                setPromotions(formattedPromotions);
            } else {
                setPromotions([]);
            }
        } catch (error) {
            console.error("Error loading promotions:", error);
            toast.error("Lỗi khi tải danh sách ưu đãi: " + error.message);
        } finally {
            setLoadingPromotions(false);
        }
    };

    const handlePromotionTypeChange = (type) => {
        setPromotionType(type);
        setEditingPromotion(prev => ({
            ...prev,
            type,
            value: 0,
            maxDiscount: type === 'percentage' ? 100 : 0,
            minPurchase: 0
        }));
    };

    const handleAddPromotion = async () => {
        if (!newPromotionName || !newPromotionName.trim()) {
            toast.warning("Vui lòng nhập tên chương trình ưu đãi!");
            return;
        }

        if (promotionType !== 'display' && !editingPromotion.value) {
            toast.warning(`Vui lòng nhập ${promotionType === 'percentage' ? 'phần trăm giảm giá' : 'số tiền giảm'}!`);
            return;
        }

        try {
            const promotionsRef = ref(database, "promotions");
            const newPromotionRef = push(promotionsRef);
            const promotionData = {
                name: newPromotionName.trim(),
                type: promotionType,
                value: editingPromotion.value || 0,
                maxDiscount: editingPromotion.maxDiscount || 0,
                minPurchase: editingPromotion.minPurchase || 0,
                dongXe: selectedDongXeList.length > 0 ? selectedDongXeList : [
                    'vf_3', 'vf_5', 'vf_6', 'vf_7', 'vf_8', 'vf_9',
                    'minio', 'herio', 'nerio', 'limo', 'ec', 'ec_nang_cao'
                ],
                dms: (newPromotionDms || '').trim() || null,
                thoiGianApDung: (editingPromotion.thoiGianApDung || '').trim() || null,
                tinhTrang: editingPromotion.tinhTrang || 'Còn Hiệu Lực',
                createdAt: new Date().toISOString(),
                createdBy: userEmail || username || "admin",
            };

            await set(newPromotionRef, promotionData);
            toast.success("Thêm chương trình ưu đãi thành công!");
            setNewPromotionName('');
            setNewPromotionDms('');
            setPromotionType('display');
            setSelectedDongXeList([]);
            setIsAddMode(false);
            setEditingPromotion({ name: '', type: 'display', value: 0, maxDiscount: 0, minPurchase: 0, dongXe: [], dms: '', thoiGianApDung: '', tinhTrang: 'Còn Hiệu Lực' });
            await loadPromotions();
        } catch (err) {
            console.error("Error adding promotion:", err);
            toast.error("Lỗi khi thêm chương trình ưu đãi: " + err.message);
        }
    };

    const startEditPromotion = (promotion) => {
        setEditingPromotionId(promotion.id);
        const dongXe = normalizeDongXe(promotion.dongXe);
        setEditingPromotion({
            name: promotion.name || '',
            type: promotion.type || 'display',
            value: promotion.value || 0,
            maxDiscount: promotion.maxDiscount || 0,
            minPurchase: promotion.minPurchase || 0,
            dongXe: [...dongXe],
            dms: promotion.dms ?? '',
            thoiGianApDung: promotion.thoiGianApDung ?? '',
            tinhTrang: promotion.tinhTrang ?? 'Còn Hiệu Lực',
        });
    };

    const cancelEditPromotion = () => {
        setEditingPromotionId(null);
        setEditingPromotion({ name: '', type: 'display', value: 0, maxDiscount: 0, minPurchase: 0, dongXe: [], dms: '', thoiGianApDung: '', tinhTrang: 'Còn Hiệu Lực' });
    };

    const handleSaveEditPromotion = async () => {
        if (!editingPromotion.name || !editingPromotion.name.trim()) {
            toast.warning("Vui lòng nhập tên chương trình ưu đãi!");
            return;
        }
        if (editingPromotion.type !== 'display' && !editingPromotion.value) {
            toast.warning(`Vui lòng nhập ${editingPromotion.type === 'percentage' ? 'phần trăm giảm giá' : 'số tiền giảm'}!`);
            return;
        }

        try {
            const promotionRef = ref(database, `promotions/${editingPromotionId}`);
            await update(promotionRef, {
                name: editingPromotion.name.trim(),
                type: editingPromotion.type,
                value: editingPromotion.value || 0,
                maxDiscount: editingPromotion.maxDiscount || 0,
                minPurchase: editingPromotion.minPurchase || 0,
                dongXe: editingPromotion.dongXe,
                dms: (editingPromotion.dms || '').trim() || null,
                thoiGianApDung: (editingPromotion.thoiGianApDung || '').trim() || null,
                tinhTrang: editingPromotion.tinhTrang || 'Còn Hiệu Lực',
                updatedAt: new Date().toISOString(),
                updatedBy: userEmail || username || "admin",
            });

            toast.success("Cập nhật chương trình ưu đãi thành công!");
            cancelEditPromotion();
            await loadPromotions();
        } catch (err) {
            console.error("Error updating promotion:", err);
            toast.error("Lỗi khi cập nhật chương trình ưu đãi: " + err.message);
        }
    };

    const handleDeletePromotion = async () => {
        if (!deletingPromotionId) return;
        try {
            const promotionRef = ref(database, `promotions/${deletingPromotionId}`);
            await remove(promotionRef);
            toast.success("Xóa chương trình ưu đãi thành công!");
            setDeletingPromotionId(null);
            await loadPromotions();
        } catch (err) {
            console.error("Error deleting promotion:", err);
            toast.error("Lỗi khi xóa chương trình ưu đãi: " + err.message);
        }
    };

    const filteredPromotions = promotions
        .filter(p => filterType === 'all' || p.type === filterType)
        .filter(p => {
            if (filterDms === 'all') return true;
            const promotionDms = (p.dms || '').trim();
            return promotionDms === filterDms;
        })
        .filter(p => !promotionSearchTerm.trim() || (p.name || '').toLowerCase().includes(promotionSearchTerm.trim().toLowerCase()));

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate("/menu")}
                            className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="hidden sm:inline">Quay lại</span>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 ml-2">
                            Quản lý chương trình ưu đãi
                        </h1>
                    </div>
                    <div>
                        <button
                            onClick={() => setIsAddMode(!isAddMode)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium flex items-center gap-2"
                        >
                            {isAddMode ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            <span>{isAddMode ? "Hủy thêm mới" : "Thêm chương trình ưu đãi"}</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-5">
                    {/* Add Form */}
                    {isAddMode && (
                        <div className="mb-6 pb-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                                <Gift className="w-5 h-5" /> Thêm mới ưu đãi
                            </h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Loại ưu đãi <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => handlePromotionTypeChange('display')}
                                        className={`px-3 py-2 text-sm rounded-lg border ${promotionType === 'display'
                                                ? 'bg-purple-100 border-purple-500 text-purple-700'
                                                : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        Chỉ hiển thị
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePromotionTypeChange('percentage')}
                                        className={`px-3 py-2 text-sm rounded-lg border ${promotionType === 'percentage'
                                                ? 'bg-purple-100 border-purple-500 text-purple-700'
                                                : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        Giảm %
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handlePromotionTypeChange('fixed')}
                                        className={`px-3 py-2 text-sm rounded-lg border ${promotionType === 'fixed'
                                                ? 'bg-purple-100 border-purple-500 text-purple-700'
                                                : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        Giảm tiền
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    DMS
                                </label>
                                <select
                                    value={newPromotionDms === DMS_ADD_OPTION_VALUE ? '' : newPromotionDms}
                                    onChange={(e) => {
                                        if (e.target.value === DMS_ADD_OPTION_VALUE) {
                                            openAddDmsModal('add');
                                            return;
                                        }
                                        setNewPromotionDms(e.target.value);
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                                >
                                    {DMS_OPTIONS.map((opt) => (
                                        <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                                    ))}
                                    {customDmsOptions.map((v) => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                    <option disabled>──────────────</option>
                                    <option value={DMS_ADD_OPTION_VALUE}>➕ Thêm DMS mới</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên chương trình ưu đãi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newPromotionName}
                                    onChange={(e) => setNewPromotionName(e.target.value)}
                                    placeholder="Ví dụ: Chính sách MLTTVN 3..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Thời Gian Áp Dụng</label>
                                    <input
                                        type="date"
                                        value={(() => {
                                            const v = editingPromotion.thoiGianApDung || '';
                                            if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
                                            const p = v.split('/');
                                            if (p.length === 3) return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
                                            return '';
                                        })()}
                                        onChange={(e) => setEditingPromotion(prev => ({ ...prev, thoiGianApDung: e.target.value || '' }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tình Trạng</label>
                                    <select
                                        value={editingPromotion.tinhTrang}
                                        onChange={(e) => setEditingPromotion(prev => ({ ...prev, tinhTrang: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                                    >
                                        <option value="Còn Hiệu Lực">Còn Hiệu Lực</option>
                                        <option value="Hết Hiệu Lực">Hết Hiệu Lực</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dòng xe áp dụng
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                    {availableDongXeForPromotion.map((car) => (
                                        <label key={car.code} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={selectedDongXeList.includes(car.code)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedDongXeList(prev => [...prev, car.code]);
                                                    else setSelectedDongXeList(prev => prev.filter(c => c !== car.code));
                                                }}
                                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="text-gray-700">{car.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {selectedDongXeList.length === 0 ? 'Không chọn = áp dụng cho tất cả' : `Đã chọn ${selectedDongXeList.length} dòng xe`}
                                </p>
                            </div>

                            {promotionType !== 'display' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {promotionType === 'percentage' ? 'Phần trăm giảm giá (%)' : 'Số tiền giảm (VNĐ)'} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={promotionType === 'percentage' ? '100' : ''}
                                        value={editingPromotion.value}
                                        onChange={(e) => setEditingPromotion({ ...editingPromotion, value: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleAddPromotion}
                                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-medium"
                            >
                                <Check className="w-5 h-5" />
                                <span>Lưu ưu đãi mới</span>
                            </button>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setFilterType('all')}
                                    className={`px-3 py-1.5 text-sm rounded-lg border ${filterType === 'all' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'border-gray-300'}`}
                                >Tất cả</button>
                                <button
                                    onClick={() => setFilterType('display')}
                                    className={`px-3 py-1.5 text-sm rounded-lg border ${filterType === 'display' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'border-gray-300'}`}
                                >Chỉ hiển thị</button>
                                <button
                                    onClick={() => setFilterType('percentage')}
                                    className={`px-3 py-1.5 text-sm rounded-lg border ${filterType === 'percentage' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'border-gray-300'}`}
                                >Giảm %</button>
                                <button
                                    onClick={() => setFilterType('fixed')}
                                    className={`px-3 py-1.5 text-sm rounded-lg border ${filterType === 'fixed' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'border-gray-300'}`}
                                >Giảm tiền</button>
                            </div>
                            
                            {/* DMS Filter */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-700 font-medium">DMS:</label>
                                <select
                                    value={filterDms}
                                    onChange={(e) => setFilterDms(e.target.value)}
                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 bg-white"
                                >
                                    <option value="all">Tất cả DMS</option>
                                    {DMS_OPTIONS.filter(opt => opt.value).map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                    {customDmsOptions.map((dms) => (
                                        <option key={dms} value={dms}>{dms}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={promotionSearchTerm}
                                onChange={(e) => setPromotionSearchTerm(e.target.value)}
                                placeholder="Tìm kiếm..."
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-48 sm:w-64 focus:ring-purple-500"
                            />
                            <button onClick={loadPromotions} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50" title="Tải lại">
                                <RefreshCw className={`w-4 h-4 text-gray-600 ${loadingPromotions ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    {loadingPromotions ? (
                        <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div></div>
                    ) : filteredPromotions.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">Không có chương trình ưu đãi nào.</div>
                    ) : (
                        <div className="space-y-3">
                            {filteredPromotions.map((promotion) => (
                                <div key={promotion.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                                    {editingPromotionId === promotion.id ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">DMS</label>
                                                    <select
                                                        value={(editingPromotion.dms ?? '') === DMS_ADD_OPTION_VALUE ? '' : (editingPromotion.dms ?? '')}
                                                        onChange={(e) => {
                                                            if (e.target.value === DMS_ADD_OPTION_VALUE) {
                                                                openAddDmsModal('edit');
                                                                return;
                                                            }
                                                            setEditingPromotion({ ...editingPromotion, dms: e.target.value });
                                                        }}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-purple-500 bg-white"
                                                    >
                                                        {DMS_OPTIONS.map((opt) => (
                                                            <option key={opt.value || 'empty'} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                        {customDmsOptions.map((v) => (
                                                            <option key={v} value={v}>{v}</option>
                                                        ))}
                                                        {editingPromotion.dms && !DMS_OPTIONS.some(o => o.value === (editingPromotion.dms ?? '')) && !customDmsOptions.includes(editingPromotion.dms) && (
                                                            <option value={editingPromotion.dms}>{editingPromotion.dms} (giá trị hiện tại)</option>
                                                        )}
                                                        <option disabled>──────────────</option>
                                                        <option value={DMS_ADD_OPTION_VALUE}>➕ Thêm DMS mới</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên chương trình <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="text"
                                                        value={editingPromotion.name}
                                                        onChange={(e) => setEditingPromotion({ ...editingPromotion, name: e.target.value })}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại ưu đãi</label>
                                                    <select
                                                        value={editingPromotion.type}
                                                        onChange={(e) => handlePromotionTypeChange(e.target.value)}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-purple-500 bg-white"
                                                    >
                                                        <option value="display">Chỉ hiển thị</option>
                                                        <option value="percentage">Giảm %</option>
                                                        <option value="fixed">Giảm tiền (VNĐ)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thời Gian Áp Dụng</label>
                                                    <input
                                                        type="date"
                                                        value={(() => {
                                                            const v = editingPromotion.thoiGianApDung || '';
                                                            if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
                                                            const p = v.split('/');
                                                            if (p.length === 3) return `${p[2]}-${String(p[1]).padStart(2,'0')}-${String(p[0]).padStart(2,'0')}`;
                                                            return '';
                                                        })()}
                                                        onChange={(e) => setEditingPromotion(prev => ({ ...prev, thoiGianApDung: e.target.value || '' }))}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tình Trạng</label>
                                                    <select
                                                        value={editingPromotion.tinhTrang}
                                                        onChange={(e) => setEditingPromotion(prev => ({ ...prev, tinhTrang: e.target.value }))}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-purple-500 bg-white"
                                                    >
                                                        <option value="Còn Hiệu Lực">Còn Hiệu Lực</option>
                                                        <option value="Hết Hiệu Lực">Hết Hiệu Lực</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Dòng xe áp dụng</label>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border rounded-lg p-2 bg-gray-50 max-h-32 overflow-y-auto">
                                                    {availableDongXeForPromotion.map((car) => (
                                                        <label key={car.code} className="flex items-center gap-2 text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={(editingPromotion.dongXe || []).includes(car.code)}
                                                                onChange={(e) => {
                                                                    const checked = e.target.checked;
                                                                    setEditingPromotion((prev) => {
                                                                        const list = normalizeDongXe(prev.dongXe);
                                                                        const next = checked ? [...list, car.code] : list.filter((c) => c !== car.code);
                                                                        return { ...prev, dongXe: next };
                                                                    });
                                                                }}
                                                                className="rounded text-purple-600"
                                                            />
                                                            <span className="text-gray-700">{car.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            {editingPromotion.type !== 'display' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị giảm <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="number"
                                                        value={editingPromotion.value}
                                                        onChange={(e) => setEditingPromotion({ ...editingPromotion, value: parseFloat(e.target.value) || 0 })}
                                                        className="w-full px-3 py-2 border rounded-lg focus:ring-purple-500 lg:w-1/2"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex justify-end gap-2 pt-2">
                                                <button onClick={cancelEditPromotion} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Hủy</button>
                                                <button onClick={handleSaveEditPromotion} className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-1">
                                                    <Check className="w-4 h-4" /> Lưu
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    {promotion.dms && (
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded border border-slate-300">DMS: {promotion.dms}</span>
                                                    )}
                                                    <h4 className="font-semibold text-gray-800">{promotion.name}</h4>
                                                    {promotion.type === 'fixed' && <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">Giảm {formatCurrency(promotion.value)}</span>}
                                                    {promotion.type === 'percentage' && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">Giảm {promotion.value}%</span>}
                                                    {promotion.type === 'display' && <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded">Chỉ hiển thị</span>}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">
                                                    Áp dụng: {normalizeDongXe(promotion.dongXe).length > 0 ? normalizeDongXe(promotion.dongXe).map(c => dongXeCodeToName[c] || c).join(', ') : <span className="text-amber-600">Tất cả dòng xe</span>}
                                                </p>
                                                <div className="flex flex-wrap gap-x-4 gap-y-0 text-sm text-gray-600">
                                                    <span><strong>Thời Gian Áp Dụng:</strong> {formatEffectiveDateDisplay(promotion.thoiGianApDung)}</span>
                                                    <span><strong>Tình Trạng:</strong> {promotion.tinhTrang === 'Hết Hiệu Lực' ? <span className="text-red-600">Hết Hiệu Lực</span> : <span className="text-green-600">Còn Hiệu Lực</span>}</span>
                                                </div>
                                                {promotion.createdAt && <p className="text-xs text-gray-400 mt-1">Tạo lúc: {new Date(promotion.createdAt).toLocaleString('vi-VN')}</p>}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => startEditPromotion(promotion)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => setDeletingPromotionId(promotion.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {deletingPromotionId && (
                <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="modal-box bg-white rounded-xl shadow-xl max-w-sm w-full p-3 xs:p-4 sm:p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
                        <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn xóa ưu đãi này? Hành động này không thể hoàn tác.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeletingPromotionId(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium text-gray-700">Hủy</button>
                            <button onClick={handleDeletePromotion} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Xóa</button>
                        </div>
                    </div>
                </div>
            )}

            {showAddDmsModal && (
                <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="modal-box bg-white rounded-xl shadow-xl max-w-sm w-full p-4 sm:p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Thêm DMS</h3>
                        <p className="text-sm text-gray-600 mb-3">Nhập tên DMS mới. Giá trị sẽ được thêm vào danh sách và chọn cho form hiện tại.</p>
                        <input
                            type="text"
                            value={newDmsInputValue}
                            onChange={(e) => setNewDmsInputValue(e.target.value)}
                            placeholder="Ví dụ: Phiếu thu 52"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-4"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddDmsSubmit()}
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowAddDmsModal(false); setAddDmsContext(null); setNewDmsInputValue(''); }}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium text-gray-700"
                            >
                                Hủy
                            </button>
                            <button onClick={handleAddDmsSubmit} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-1">
                                <Check className="w-4 h-4" /> Thêm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
