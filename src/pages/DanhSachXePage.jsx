import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Edit2, Trash2, Car, BarChart3, Package, TrendingUp, Search, Filter, X, ChevronDown, ChevronUp, Upload, Download, Trash, ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { ref, set, push, update, remove } from 'firebase/database';
import { database } from '../firebase/config';
import { useFirebaseQuery } from '../hooks';
import { danh_sach_xe, carPriceData, uniqueNgoaiThatColors, uniqueNoiThatColors, getCarImageUrl } from '../data/calculatorData';
import { parseVehicleExcel, exportVehiclesToExcel, downloadImportTemplate, VEHICLE_STATUSES, STATUS_LABELS, STATUS_COLORS } from '../utils/excelParser';

export default function DanhSachXePage() {
    // Use custom Firebase hook for realtime data
    const { data: vehicles, loading: isLoading, error } = useFirebaseQuery('vehicleInventory');

    const [expandedRows, setExpandedRows] = useState(new Set());
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [formData, setFormData] = useState({
        model: '',
        trim: '',
        exterior_color: '',
        interior_color: '',
        quantity: 1,
        status: VEHICLE_STATUSES.READY,
        custom_image_url: ''
    });
    const fileInputRef = useRef(null);
    const [isImporting, setIsImporting] = useState(false);
    const [filters, setFilters] = useState({
        searchTerm: '',
        model: '',
        trim: '',
        exteriorColor: '',
        status: ''
    });

    // Handle Firebase errors
    useEffect(() => {
        if (error) {
            console.error('Firebase listener error:', error);
            toast.error('Lỗi kết nối Firebase: ' + error.message);
        }
    }, [error]);

    // Save vehicle to Firebase
    const saveVehicle = async (vehicleData) => {
        const vehiclesRef = ref(database, 'vehicleInventory');
        const newRef = push(vehiclesRef);
        await set(newRef, { ...vehicleData, id: newRef.key, created_at: new Date().toISOString() });
        return newRef.key;
    };

    // Update vehicle in Firebase
    const updateVehicle = async (id, vehicleData) => {
        const vehicleRef = ref(database, `vehicleInventory/${id}`);
        await update(vehicleRef, { ...vehicleData, updated_at: new Date().toISOString() });
    };

    // Delete vehicle from Firebase
    const deleteVehicle = async (id) => {
        const vehicleRef = ref(database, `vehicleInventory/${id}`);
        await remove(vehicleRef);
    };

    // Clear all vehicles from Firebase
    const clearAllVehicles = async () => {
        if (window.confirm(`Bạn có chắc muốn xóa toàn bộ ${vehicles.length} xe trong kho?`)) {
            const vehiclesRef = ref(database, 'vehicleInventory');
            await set(vehiclesRef, null);
            toast.success('Đã xóa toàn bộ kho xe');
        }
    };

    // Export to Excel
    const handleExportExcel = async () => {
        if (vehicles.length === 0) {
            toast.warning('Không có dữ liệu để xuất');
            return;
        }

        try {
            await exportVehiclesToExcel(vehicles, `KhoXe_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Xuất Excel thành công');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Lỗi xuất Excel: ' + error.message);
        }
    };

    // Download import template
    const handleDownloadTemplate = async () => {
        try {
            await downloadImportTemplate();
            toast.success('Đã tải mẫu import');
        } catch (error) {
            console.error('Template error:', error);
            toast.error('Lỗi tải mẫu: ' + error.message);
        }
    };

    // Memoize grouped vehicles calculation
    const groupedVehicles = useMemo(() => {
        if (!vehicles || vehicles.length === 0) return [];

        const grouped = {};

        vehicles.forEach(vehicle => {
            const key = vehicle.model; // Chỉ nhóm theo Model
            if (!grouped[key]) {
                grouped[key] = {
                    model: vehicle.model,
                    trims: {}, // Lưu các trim
                    totalQuantity: 0,
                    image_url: vehicle.image_url,
                    price: vehicle.price
                };
            }

            // Nhóm theo trim trong model
            const trimKey = vehicle.trim;
            if (!grouped[key].trims[trimKey]) {
                grouped[key].trims[trimKey] = {
                    trim: vehicle.trim,
                    exteriorColors: {}, // Lưu các màu ngoại thất
                    totalQuantity: 0
                };
            }

            // Nhóm theo màu ngoại thất trong trim
            const exteriorColorKey = vehicle.exterior_color;
            if (!grouped[key].trims[trimKey].exteriorColors[exteriorColorKey]) {
                grouped[key].trims[trimKey].exteriorColors[exteriorColorKey] = {
                    exterior_color: vehicle.exterior_color,
                    exterior_color_name: vehicle.exterior_color_name || getColorName(vehicle.exterior_color, true),
                    interiorVariants: [], // Lưu các biến thể nội thất
                    totalQuantity: 0
                };
            }

            // Thêm biến thể nội thất
            grouped[key].trims[trimKey].exteriorColors[exteriorColorKey].interiorVariants.push(vehicle);
            grouped[key].trims[trimKey].exteriorColors[exteriorColorKey].totalQuantity += vehicle.quantity;
            grouped[key].trims[trimKey].totalQuantity += vehicle.quantity;
            grouped[key].totalQuantity += vehicle.quantity;
        });

        return Object.values(grouped);
    }, [vehicles]);

    // Memoize filtered vehicles based on groupedVehicles and filters
    const filteredGroupedVehicles = useMemo(() => {
        let filtered = [...groupedVehicles];

        // Search term filter
        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(group => {
                // Tìm trong model
                if (group.model.toLowerCase().includes(searchLower)) return true;

                // Tìm trong trims và variants
                return Object.values(group.trims).some(trim => {
                    if (trim.trim.toLowerCase().includes(searchLower)) return true;

                    return Object.values(trim.exteriorColors).some(exteriorColor => {
                        if (exteriorColor.exterior_color_name.toLowerCase().includes(searchLower)) return true;

                        return exteriorColor.interiorVariants.some(v =>
                            (v.interior_color_name || getColorName(v.interior_color, false)).toLowerCase().includes(searchLower)
                        );
                    });
                });
            });
        }

        // Model filter
        if (filters.model) {
            filtered = filtered.filter(group => group.model === filters.model);
        }

        // Trim filter
        if (filters.trim) {
            filtered = filtered.filter(group =>
                Object.values(group.trims).some(trim => trim.trim === filters.trim)
            );
        }

        // Exterior color filter
        if (filters.exteriorColor) {
            filtered = filtered.filter(group =>
                Object.values(group.trims).some(trim =>
                    Object.values(trim.exteriorColors).some(color => color.exterior_color === filters.exteriorColor)
                )
            );
        }

        // Status filter
        if (filters.status) {
            filtered = filtered.filter(group =>
                Object.values(group.trims).some(trim =>
                    Object.values(trim.exteriorColors).some(color =>
                        color.interiorVariants.some(v => v.status === filters.status)
                    )
                )
            );
        }

        return filtered;
    }, [groupedVehicles, filters]);

    // Memoize stats calculation
    const stats = useMemo(() => {
        // Lấy tất cả vehicles từ filteredGroupedVehicles
        const filteredVehicles = [];
        filteredGroupedVehicles.forEach(group => {
            Object.values(group.trims).forEach(trim => {
                Object.values(trim.exteriorColors).forEach(color => {
                    filteredVehicles.push(...color.interiorVariants);
                });
            });
        });

        const total = filteredVehicles.reduce((sum, v) => sum + v.quantity, 0);
        const ready = filteredVehicles.filter(v => v.status === VEHICLE_STATUSES.READY).reduce((sum, v) => sum + v.quantity, 0);
        const notArrived = filteredVehicles.filter(v => v.status === VEHICLE_STATUSES.NOT_ARRIVED).reduce((sum, v) => sum + v.quantity, 0);
        const arrived = filteredVehicles.filter(v => v.status === VEHICLE_STATUSES.ARRIVED).reduce((sum, v) => sum + v.quantity, 0);
        const matched = filteredVehicles.filter(v => v.status === VEHICLE_STATUSES.MATCHED).reduce((sum, v) => sum + v.quantity, 0);
        const exported = filteredVehicles.filter(v => v.status === VEHICLE_STATUSES.EXPORTED).reduce((sum, v) => sum + v.quantity, 0);
        const delivered = filteredVehicles.filter(v => v.status === VEHICLE_STATUSES.DELIVERED).reduce((sum, v) => sum + v.quantity, 0);

        const byModel = {};
        const byColor = {};

        filteredVehicles.forEach(v => {
            byModel[v.model] = (byModel[v.model] || 0) + v.quantity;
            const colorName = v.exterior_color_name || v.exterior_color || 'Không xác định';
            byColor[colorName] = (byColor[colorName] || 0) + v.quantity;
        });

        return { total, ready, notArrived, arrived, matched, exported, delivered, byModel, byColor };
    }, [filteredGroupedVehicles]);

    // Handle Excel import with batch write optimization
    const handleExcelImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const importedVehicles = await parseVehicleExcel(file);
            if (importedVehicles.length === 0) {
                toast.warning('Không tìm thấy dữ liệu xe trong file');
                return;
            }

            // Prepare batch updates object
            const updates = {};
            let addedCount = 0;
            let updatedCount = 0;

            for (const newVehicle of importedVehicles) {
                // Check if vehicle with same VIN exists
                const existing = vehicles.find(v => v.vin && newVehicle.vin && v.vin === newVehicle.vin);

                if (existing) {
                    // Update existing vehicle
                    updates[`vehicleInventory/${existing.id}`] = {
                        ...existing,
                        ...newVehicle,
                        id: existing.id,
                        updated_at: new Date().toISOString()
                    };
                    updatedCount++;
                } else {
                    // Add new vehicle with generated key
                    const newKey = push(ref(database, 'vehicleInventory')).key;
                    updates[`vehicleInventory/${newKey}`] = {
                        ...newVehicle,
                        id: newKey,
                        created_at: new Date().toISOString()
                    };
                    addedCount++;
                }
            }

            // Single batch update to Firebase
            await update(ref(database), updates);
            toast.success(`Import thành công: ${addedCount} xe mới, ${updatedCount} xe cập nhật`);
        } catch (error) {
            toast.error(error.message || 'Lỗi import file Excel');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Helper function to get color name from code
    const getColorName = (colorCode, isExterior = true) => {
        if (!colorCode) return colorCode || '';
        const colorList = isExterior ? uniqueNgoaiThatColors : uniqueNoiThatColors;
        const found = colorList.find(color => color.code === colorCode);
        return found ? found.name : colorCode;
    };

    // Get unique models from vehicles
    const getUniqueModels = () => {
        return [...new Set(vehicles.map(v => v.model))].sort();
    };

    // Get unique trims based on selected model
    const getUniqueTrims = () => {
        if (!filters.model) {
            return [...new Set(vehicles.map(v => v.trim))].sort();
        }
        return [...new Set(vehicles.filter(v => v.model === filters.model).map(v => v.trim))].sort();
    };

    // Get unique exterior colors based on filters
    const getUniqueExteriorColors = () => {
        let filtered = vehicles;
        if (filters.model) {
            filtered = filtered.filter(v => v.model === filters.model);
        }
        if (filters.trim) {
            filtered = filtered.filter(v => v.trim === filters.trim);
        }
        const colorCodes = [...new Set(filtered.map(v => v.exterior_color))];
        return uniqueNgoaiThatColors.filter(color => colorCodes.includes(color.code));
    };

    const clearFilters = () => {
        setFilters({
            searchTerm: '',
            model: '',
            trim: '',
            exteriorColor: '',
            status: ''
        });
    };

    const toggleRowExpansion = (key) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedRows(newExpanded);
    };

    const getAvailableTrims = () => {
        if (!formData.model) return [];
        const trims = [...new Set(carPriceData.filter(car => car.model === formData.model).map(car => car.trim))];
        return trims;
    };

    const getAvailableExteriorColors = () => {
        if (!formData.model || !formData.trim) return [];
        const colorCodes = [...new Set(carPriceData.filter(car => car.model === formData.model && car.trim === formData.trim).map(car => car.exterior_color))];
        return uniqueNgoaiThatColors.filter(color => colorCodes.includes(color.code));
    };

    const getAvailableInteriorColors = () => {
        if (!formData.model || !formData.trim || !formData.exterior_color) return [];
        const colorCodes = [...new Set(carPriceData.filter(car =>
            car.model === formData.model &&
            car.trim === formData.trim &&
            car.exterior_color === formData.exterior_color
        ).map(car => car.interior_color))];
        return uniqueNoiThatColors.filter(color => colorCodes.includes(color.code));
    };

    const getCarPrice = () => {
        const car = carPriceData.find(c =>
            c.model === formData.model &&
            c.trim === formData.trim &&
            c.exterior_color === formData.exterior_color &&
            c.interior_color === formData.interior_color
        );
        return car?.price_vnd || 0;
    };

    const getCarImage = () => {
        const car = carPriceData.find(c =>
            c.model === formData.model &&
            c.trim === formData.trim &&
            c.exterior_color === formData.exterior_color &&
            c.interior_color === formData.interior_color
        );
        if (!car?.car_image_url) return '';
        return getCarImageUrl(car.car_image_url) || car.car_image_url;
    };

    const handleAddVehicle = async () => {
        if (!formData.model || !formData.trim || !formData.exterior_color || !formData.interior_color) {
            toast.error('Vui lòng điền đầy đủ thông tin xe');
            return;
        }

        try {
            // Check if this exact configuration already exists
            const existingVehicle = vehicles.find(v =>
                v.model === formData.model &&
                v.trim === formData.trim &&
                v.exterior_color === formData.exterior_color &&
                v.interior_color === formData.interior_color &&
                v.status === formData.status
            );

            if (existingVehicle) {
                // Update quantity of existing vehicle
                await updateVehicle(existingVehicle.id, {
                    quantity: existingVehicle.quantity + formData.quantity
                });
                toast.success(`Đã cập nhật số lượng xe (thêm ${formData.quantity} xe)`);
            } else {
                // Add new vehicle
                const newVehicle = {
                    ...formData,
                    price: getCarPrice(),
                    image_url: formData.custom_image_url || getCarImage(),
                    exterior_color_name: getColorName(formData.exterior_color, true),
                    interior_color_name: getColorName(formData.interior_color, false)
                };
                await saveVehicle(newVehicle);
                toast.success('Thêm xe thành công');
            }

            resetForm();
            setShowAddModal(false);
        } catch (error) {
            toast.error('Lỗi khi thêm xe: ' + error.message);
        }
    };

    const handleEditVehicle = async () => {
        if (!formData.model || !formData.trim || !formData.exterior_color || !formData.interior_color) {
            toast.error('Vui lòng điền đầy đủ thông tin xe');
            return;
        }

        try {
            await updateVehicle(editingVehicle.id, {
                ...formData,
                price: getCarPrice(),
                image_url: formData.custom_image_url || getCarImage(),
                exterior_color_name: getColorName(formData.exterior_color, true),
                interior_color_name: getColorName(formData.interior_color, false)
            });
            toast.success('Cập nhật xe thành công');
            resetForm();
            setShowEditModal(false);
            setEditingVehicle(null);
        } catch (error) {
            toast.error('Lỗi khi cập nhật xe: ' + error.message);
        }
    };

    const handleDeleteVehicle = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa xe này?')) {
            try {
                await deleteVehicle(id);
                toast.success('Xóa xe thành công');
            } catch (error) {
                toast.error('Lỗi khi xóa xe: ' + error.message);
            }
        }
    };

    const openEditModal = (vehicle) => {
        setEditingVehicle(vehicle);
        setFormData({
            model: vehicle.model,
            trim: vehicle.trim,
            exterior_color: vehicle.exterior_color,
            interior_color: vehicle.interior_color,
            quantity: vehicle.quantity,
            status: vehicle.status,
            custom_image_url: vehicle.custom_image_url || ''
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({
            model: '',
            trim: '',
            exterior_color: '',
            interior_color: '',
            quantity: 1,
            status: VEHICLE_STATUSES.READY,
            custom_image_url: ''
        });
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getStatusColor = (status) => {
        return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusText = (status) => {
        return STATUS_LABELS[status] || status;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Danh sách xe</h1>
                <p className="text-gray-600">Quản lý và theo dõi tồn kho xe VinFast</p>
            </div>

            {/* Filter Panel */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Bộ lọc
                    </h3>
                    {(filters.searchTerm || filters.model || filters.trim || filters.exteriorColor || filters.status) && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            <X className="w-4 h-4" />
                            Xóa bộ lọc
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tìm kiếm
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm xe..."
                                value={filters.searchTerm}
                                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Model Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dòng xe
                        </label>
                        <select
                            value={filters.model}
                            onChange={(e) => setFilters({ ...filters, model: e.target.value, trim: '', exteriorColor: '' })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Tất cả</option>
                            {getUniqueModels().map((model) => (
                                <option key={model} value={model}>
                                    {model}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Trim Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phiên bản
                        </label>
                        <select
                            value={filters.trim}
                            onChange={(e) => setFilters({ ...filters, trim: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Tất cả</option>
                            {getUniqueTrims().map((trim) => (
                                <option key={trim} value={trim}>
                                    {trim}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Exterior Color Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Màu ngoại thất
                        </label>
                        <select
                            value={filters.exteriorColor}
                            onChange={(e) => setFilters({ ...filters, exteriorColor: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Tất cả</option>
                            {getUniqueExteriorColors().map((color) => (
                                <option key={color.code} value={color.code}>
                                    {color.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trạng thái
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Tất cả</option>
                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Filter Results Info */}
                <div className="mt-4 text-sm text-gray-600">
                    Hiển thị <span className="font-semibold text-gray-900">{filteredGroupedVehicles.length}</span> cấu hình / {groupedVehicles.length} cấu hình
                </div>
            </div>

            {/* Statistics Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Tổng số</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <Package className="w-8 h-8 text-blue-500 opacity-80" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Sẵn Sàng</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.ready}</p>
                        </div>
                        <Car className="w-8 h-8 text-green-500 opacity-80" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-gray-400">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Chưa về</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.notArrived}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-gray-400 opacity-80" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-400">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Đã về</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.arrived}</p>
                        </div>
                        <Car className="w-8 h-8 text-blue-400 opacity-80" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Đã ghép KH</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.matched}</p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-purple-500 opacity-80" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Đã xuất</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.exported}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-yellow-500 opacity-80" />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-emerald-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-600 mb-1">Đã giao</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
                        </div>
                        <Car className="w-8 h-8 text-emerald-500 opacity-80" />
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* By Model Chart */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Thống kê theo dòng xe
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(stats.byModel).map(([model, count]) => (
                            <div key={model} className="flex items-center gap-3">
                                <div className="w-24 text-sm font-medium text-gray-700">{model}</div>
                                <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                                        style={{ width: `${(count / stats.total) * 100}%` }}
                                    >
                                        <span className="text-xs font-semibold text-white">{count}</span>
                                    </div>
                                </div>
                                <div className="w-16 text-sm text-gray-600 text-right">
                                    {((count / stats.total) * 100).toFixed(1)}%
                                </div>
                            </div>
                        ))}
                        {Object.keys(stats.byModel).length === 0 && (
                            <p className="text-gray-500 text-center py-4">Chưa có dữ liệu</p>
                        )}
                    </div>
                </div>

                {/* By Color Chart */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Thống kê theo màu ngoại thất
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(stats.byColor).slice(0, 10).map(([color, count]) => (
                            <div key={color} className="flex items-center gap-3">
                                <div className="w-32 text-sm font-medium text-gray-700 truncate" title={color}>{color}</div>
                                <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                                        style={{ width: `${(count / stats.total) * 100}%` }}
                                    >
                                        <span className="text-xs font-semibold text-white">{count}</span>
                                    </div>
                                </div>
                                <div className="w-16 text-sm text-gray-600 text-right">
                                    {((count / stats.total) * 100).toFixed(1)}%
                                </div>
                            </div>
                        ))}
                        {Object.keys(stats.byColor).length === 0 && (
                            <p className="text-gray-500 text-center py-4">Chưa có dữ liệu</p>
                        )}
                    </div>
                </div>
            </div>



            {/* Action Button */}
            <div className="mb-6 flex gap-3 flex-wrap">
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-md transition-all duration-200 hover:shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    Thêm xe mới
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelImport}
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-md transition-all duration-200 hover:shadow-lg"
                >
                    {isImporting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Đang import...
                        </>
                    ) : (
                        <>
                            <Upload className="w-5 h-5" />
                            Import Excel
                        </>
                    )}
                </button>

                <button
                    onClick={handleDownloadTemplate}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-md transition-all duration-200 hover:shadow-lg"
                >
                    <Download className="w-5 h-5" />
                    Tải mẫu import
                </button>

                <button
                    onClick={handleExportExcel}
                    disabled={vehicles.length === 0}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-md transition-all duration-200 hover:shadow-lg"
                >
                    <Download className="w-5 h-5" />
                    Export Excel
                </button>

                <button
                    onClick={clearAllVehicles}
                    disabled={vehicles.length === 0}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-3 rounded-lg flex items-center gap-2 shadow-md transition-all duration-200 hover:shadow-lg"
                >
                    <Trash className="w-5 h-5" />
                    Xóa tất cả
                </button>
            </div>

            {/* Vehicle List Table - Grouped */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">

                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    STT
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dòng xe
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tổng SL
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Biến thể
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredGroupedVehicles.map((group, index) => {
                                const groupKey = group.model;
                                const isExpanded = expandedRows.has(groupKey);
                                const trimCount = Object.keys(group.trims).length;
                                const totalVariants = Object.values(group.trims).reduce((sum, trim) => {
                                    return sum + Object.values(trim.exteriorColors).reduce((colorSum, color) => {
                                        return colorSum + color.interiorVariants.length;
                                    }, 0);
                                }, 0);

                                return (
                                    <React.Fragment key={groupKey}>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => toggleRowExpansion(groupKey)}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="font-semibold text-gray-900">{group.model}</div>
                                                <div className="text-gray-500 text-xs">{trimCount} phiên bản</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-lg font-bold text-blue-600">{group.totalQuantity}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600">
                                                    {totalVariants} biến thể
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded Details - Show Trims */}
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-4 bg-gray-50">
                                                    <div className="space-y-4">
                                                        {Object.values(group.trims)
                                                            .filter(trimData => {
                                                                // Lọc theo trim nếu có
                                                                if (filters.trim && trimData.trim !== filters.trim) {
                                                                    return false;
                                                                }
                                                                // Lọc theo exterior color nếu có
                                                                if (filters.exteriorColor) {
                                                                    return Object.keys(trimData.exteriorColors).includes(filters.exteriorColor);
                                                                }
                                                                // Lọc theo status nếu có
                                                                if (filters.status) {
                                                                    return Object.values(trimData.exteriorColors).some(color =>
                                                                        color.interiorVariants.some(v => v.status === filters.status)
                                                                    );
                                                                }
                                                                return true;
                                                            })
                                                            .map((trimData) => {
                                                                const trimKey = `${group.model}|${trimData.trim}`;
                                                                const isTrimExpanded = expandedRows.has(trimKey);

                                                                return (
                                                                    <div key={trimKey} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                                        {/* Trim Header */}
                                                                        <div
                                                                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                                                                            onClick={() => toggleRowExpansion(trimKey)}
                                                                        >
                                                                            <div className="flex items-center gap-4 flex-1">
                                                                                <button className="text-gray-500">
                                                                                    {isTrimExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                                </button>
                                                                                <div>
                                                                                    <div className="font-semibold text-gray-900">{trimData.trim}</div>
                                                                                    <div className="text-xs text-gray-500">{Object.keys(trimData.exteriorColors).length} màu ngoại thất</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-sm">
                                                                                <span className="font-bold text-blue-600">{trimData.totalQuantity}</span>
                                                                                <span className="text-gray-500 ml-1">xe</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Exterior Colors */}
                                                                        {isTrimExpanded && (
                                                                            <div className="border-t border-gray-200 p-4 bg-gray-50">
                                                                                <div className="space-y-3">
                                                                                    {Object.values(trimData.exteriorColors)
                                                                                        .filter(exteriorColorData => {
                                                                                            // Lọc theo exterior color nếu có
                                                                                            if (filters.exteriorColor && exteriorColorData.exterior_color !== filters.exteriorColor) {
                                                                                                return false;
                                                                                            }
                                                                                            // Lọc theo status nếu có
                                                                                            if (filters.status) {
                                                                                                return exteriorColorData.interiorVariants.some(v => v.status === filters.status);
                                                                                            }
                                                                                            return true;
                                                                                        })
                                                                                        .map((exteriorColorData) => {
                                                                                            const exteriorColorKey = `${group.model}|${trimData.trim}|${exteriorColorData.exterior_color}`;
                                                                                            const isExteriorColorExpanded = expandedRows.has(exteriorColorKey);

                                                                                            return (
                                                                                                <div key={exteriorColorKey} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                                                                    {/* Exterior Color Header */}
                                                                                                    <div
                                                                                                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                                                                                                        onClick={() => toggleRowExpansion(exteriorColorKey)}
                                                                                                    >
                                                                                                        <div className="flex items-center gap-3 flex-1">
                                                                                                            <button className="text-gray-500">
                                                                                                                {isExteriorColorExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                                                                                            </button>
                                                                                                            <div>
                                                                                                                <div className="font-medium text-gray-900 text-sm">{exteriorColorData.exterior_color_name}</div>
                                                                                                                <div className="text-xs text-gray-500">{exteriorColorData.interiorVariants.length} nội thất</div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div className="text-sm">
                                                                                                            <span className="font-bold text-blue-600">{exteriorColorData.totalQuantity}</span>
                                                                                                            <span className="text-gray-500 ml-1">xe</span>
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    {/* Interior Variants */}
                                                                                                    {isExteriorColorExpanded && (
                                                                                                        <div className="border-t border-gray-200 p-3 bg-gray-100">
                                                                                                            <table className="min-w-full bg-white rounded-lg overflow-hidden">
                                                                                                                <thead className="bg-gray-100">
                                                                                                                    <tr>
                                                                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">STT</th>
                                                                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Hình ảnh</th>
                                                                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Dòng xe</th>
                                                                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Phiên bản</th>
                                                                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Ngoại thất</th>
                                                                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Nội thất</th>
                                                                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Giá bán</th>
                                                                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Số lượng</th>
                                                                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Trạng thái</th>
                                                                                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Thao tác</th>
                                                                                                                    </tr>
                                                                                                                </thead>
                                                                                                                <tbody className="divide-y divide-gray-200">
                                                                                                                    {exteriorColorData.interiorVariants
                                                                                                                        .filter(variant => {
                                                                                                                            // Lọc theo status nếu có
                                                                                                                            if (filters.status && variant.status !== filters.status) {
                                                                                                                                return false;
                                                                                                                            }
                                                                                                                            return true;
                                                                                                                        })
                                                                                                                        .map((variant, variantIndex) => (
                                                                                                                            <tr key={variant.id} className="hover:bg-gray-50">
                                                                                                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                                                                                                    {variantIndex + 1}
                                                                                                                                </td>
                                                                                                                                <td className="px-4 py-3">
                                                                                                                                    {(variant.custom_image_url || variant.image_url) ? (
                                                                                                                                        <img
                                                                                                                                            src={variant.custom_image_url || variant.image_url}
                                                                                                                                            alt={`${variant.model} ${variant.trim}`}
                                                                                                                                            className="h-12 w-20 object-contain rounded"
                                                                                                                                            onError={(e) => {
                                                                                                                                                e.target.style.display = 'none';
                                                                                                                                                e.target.nextElementSibling.style.display = 'flex';
                                                                                                                                            }}
                                                                                                                                            loading="lazy"
                                                                                                                                        />
                                                                                                                                    ) : null}
                                                                                                                                    <div
                                                                                                                                        className="h-12 w-20 bg-gray-100 rounded flex items-center justify-center"
                                                                                                                                        style={{ display: (variant.custom_image_url || variant.image_url) ? 'none' : 'flex' }}
                                                                                                                                    >
                                                                                                                                        <Car className="w-6 h-6 text-gray-400" />
                                                                                                                                    </div>
                                                                                                                                </td>
                                                                                                                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                                                                                                    {variant.model}
                                                                                                                                </td>
                                                                                                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                                                                                                    {variant.trim}
                                                                                                                                </td>
                                                                                                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                                                                                                    {exteriorColorData.exterior_color_name}
                                                                                                                                </td>
                                                                                                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                                                                                                    {variant.interior_color_name || getColorName(variant.interior_color, false)}
                                                                                                                                </td>
                                                                                                                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                                                                                                    {formatCurrency(variant.price)}
                                                                                                                                </td>
                                                                                                                                <td className="px-4 py-3">
                                                                                                                                    <span className="text-base font-bold text-blue-600">{variant.quantity}</span>
                                                                                                                                </td>
                                                                                                                                <td className="px-4 py-3">
                                                                                                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(variant.status)}`}>
                                                                                                                                        {getStatusText(variant.status)}
                                                                                                                                    </span>
                                                                                                                                </td>
                                                                                                                                <td className="px-4 py-3">
                                                                                                                                    <div className="flex gap-2">
                                                                                                                                        <button
                                                                                                                                            onClick={() => openEditModal(variant)}
                                                                                                                                            className="text-blue-600 hover:text-blue-900 transition-colors"
                                                                                                                                            title="Chỉnh sửa"
                                                                                                                                        >
                                                                                                                                            <Edit2 className="w-4 h-4" />
                                                                                                                                        </button>
                                                                                                                                        <button
                                                                                                                                            onClick={() => handleDeleteVehicle(variant.id)}
                                                                                                                                            className="text-red-600 hover:text-red-900 transition-colors"
                                                                                                                                            title="Xóa"
                                                                                                                                        >
                                                                                                                                            <Trash2 className="w-4 h-4" />
                                                                                                                                        </button>
                                                                                                                                    </div>
                                                                                                                                </td>
                                                                                                                            </tr>
                                                                                                                        ))}
                                                                                                                </tbody>
                                                                                                            </table>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredGroupedVehicles.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <Car className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            {vehicles.length === 0 ? (
                                <>
                                    <p className="text-lg">Chưa có xe nào trong kho</p>
                                    <p className="text-sm">Nhấn nút "Thêm xe mới" để bắt đầu</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-lg">Không tìm thấy xe nào</p>
                                    <p className="text-sm">Thử thay đổi bộ lọc hoặc tìm kiếm</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Vehicle Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Thêm xe mới</h2>

                            <div className="space-y-4">
                                {/* Model Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Dòng xe <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value, trim: '', exterior_color: '', interior_color: '' })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">-- Chọn dòng xe --</option>
                                        {danh_sach_xe.map((xe) => (
                                            <option key={xe.dong_xe} value={xe.ten_hien_thi}>
                                                {xe.ten_hien_thi}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Trim Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phiên bản <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.trim}
                                        onChange={(e) => setFormData({ ...formData, trim: e.target.value, exterior_color: '', interior_color: '' })}
                                        disabled={!formData.model}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                    >
                                        <option value="">-- Chọn phiên bản --</option>
                                        {getAvailableTrims().map((trim) => (
                                            <option key={trim} value={trim}>
                                                {trim}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Exterior Color Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Màu ngoại thất <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.exterior_color}
                                        onChange={(e) => setFormData({ ...formData, exterior_color: e.target.value, interior_color: '' })}
                                        disabled={!formData.trim}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                    >
                                        <option value="">-- Chọn màu ngoại thất --</option>
                                        {getAvailableExteriorColors().map((color) => (
                                            <option key={color.code} value={color.code}>
                                                {color.name} ({color.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Interior Color Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Màu nội thất <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.interior_color}
                                        onChange={(e) => setFormData({ ...formData, interior_color: e.target.value })}
                                        disabled={!formData.exterior_color}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                    >
                                        <option value="">-- Chọn màu nội thất --</option>
                                        {getAvailableInteriorColors().map((color) => (
                                            <option key={color.code} value={color.code}>
                                                {color.name} ({color.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Số lượng <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Trạng thái <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Custom Image URL */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Link ảnh xe
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.custom_image_url}
                                        onChange={(e) => setFormData({ ...formData, custom_image_url: e.target.value })}
                                        placeholder="Dán link ảnh xe (https://...)"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {formData.custom_image_url && !formData.custom_image_url.startsWith('https://') && (
                                        <p className="text-xs text-amber-600 mt-1">Link ảnh nên bắt đầu bằng https://</p>
                                    )}
                                    {formData.custom_image_url && formData.custom_image_url.startsWith('https://') && (
                                        <img
                                            src={formData.custom_image_url}
                                            alt="Preview"
                                            className="mt-2 h-32 w-auto object-contain rounded border border-gray-200"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                            onLoad={(e) => { e.target.style.display = 'block'; }}
                                            loading="lazy"
                                        />
                                    )}
                                </div>

                                {/* Price Display */}
                                {formData.interior_color && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-gray-700 mb-1">Giá bán:</p>
                                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(getCarPrice())}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleAddVehicle}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Thêm xe
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Vehicle Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Chỉnh sửa thông tin xe</h2>

                            <div className="space-y-4">
                                {/* Model Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Dòng xe <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value, trim: '', exterior_color: '', interior_color: '' })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">-- Chọn dòng xe --</option>
                                        {danh_sach_xe.map((xe) => (
                                            <option key={xe.dong_xe} value={xe.ten_hien_thi}>
                                                {xe.ten_hien_thi}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Trim Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phiên bản <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.trim}
                                        onChange={(e) => setFormData({ ...formData, trim: e.target.value, exterior_color: '', interior_color: '' })}
                                        disabled={!formData.model}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                    >
                                        <option value="">-- Chọn phiên bản --</option>
                                        {getAvailableTrims().map((trim) => (
                                            <option key={trim} value={trim}>
                                                {trim}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Exterior Color Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Màu ngoại thất <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.exterior_color}
                                        onChange={(e) => setFormData({ ...formData, exterior_color: e.target.value, interior_color: '' })}
                                        disabled={!formData.trim}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                    >
                                        <option value="">-- Chọn màu ngoại thất --</option>
                                        {getAvailableExteriorColors().map((color) => (
                                            <option key={color.code} value={color.code}>
                                                {color.name} ({color.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Interior Color Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Màu nội thất <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.interior_color}
                                        onChange={(e) => setFormData({ ...formData, interior_color: e.target.value })}
                                        disabled={!formData.exterior_color}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                    >
                                        <option value="">-- Chọn màu nội thất --</option>
                                        {getAvailableInteriorColors().map((color) => (
                                            <option key={color.code} value={color.code}>
                                                {color.name} ({color.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Số lượng <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Trạng thái <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Custom Image URL */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Link ảnh xe
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.custom_image_url}
                                        onChange={(e) => setFormData({ ...formData, custom_image_url: e.target.value })}
                                        placeholder="Dán link ảnh xe (https://...)"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {formData.custom_image_url && !formData.custom_image_url.startsWith('https://') && (
                                        <p className="text-xs text-amber-600 mt-1">Link ảnh nên bắt đầu bằng https://</p>
                                    )}
                                    {formData.custom_image_url && formData.custom_image_url.startsWith('https://') && (
                                        <img
                                            src={formData.custom_image_url}
                                            alt="Preview"
                                            className="mt-2 h-32 w-auto object-contain rounded border border-gray-200"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                            onLoad={(e) => { e.target.style.display = 'block'; }}
                                            loading="lazy"
                                        />
                                    )}
                                </div>

                                {/* Price Display */}
                                {formData.interior_color && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-gray-700 mb-1">Giá bán:</p>
                                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(getCarPrice())}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleEditVehicle}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Cập nhật
                                </button>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingVehicle(null);
                                        resetForm();
                                    }}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
