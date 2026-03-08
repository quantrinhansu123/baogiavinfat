import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gift, X, Trash2, Edit, Save, XCircle, Plus, Check, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { ref, push, set, update, remove, get } from 'firebase/database';
import { database } from '../firebase/config';
import { loadPromotionsFromFirebase, filterPromotionsByDongXe, isPromotionAssignedToDongXe, normalizeDongXe as normalizeDongXePromo } from '../data/promotionsData';
import { provinces } from '../data/provincesData';
import CurrencyInput from '../components/shared/CurrencyInput';
import {
  isValidInterestRate,
  isSafeCurrency,
  parseCurrency,
  clampDiscount,
} from '../utils/validation';
import {
  phi_duong_bo,
  phi_cap_bien_so,
  phi_kiem_dinh,
  chi_phi_dich_vu_dang_ky,
  lai_suat_vay_hang_nam,
  uu_dai_vin_club,
  ho_tro_doi_xe,
  gia_tri_dat_coc,
  quy_doi_2_nam_bhvc,
  thong_tin_ky_thuat_xe,
  danh_sach_xe,
  getAvailableDongXeForPromotion,
  modelNameToCode as modelNameToCodeFromData,
  uniqueNgoaiThatColors,
  uniqueNoiThatColors,
  getDataByKey,
  formatCurrency,
  getCarImageUrl,
} from '../data/calculatorData';
import { useCarPriceData } from '../contexts/CarPriceDataContext';

// Import images
import logoImage from '../assets/images/logo1.jpg';
import vf3Full from '../assets/images/vf3_full.jpg';
import vf3Interior from '../assets/images/vf3_in.jpg';
import vf5Full from '../assets/images/vf5_full.webp';
import vf5Interior from '../assets/images/vf5_in.jpg';

// Color images
import whiteColor from '../assets/images/colors/white.png';
import redColor from '../assets/images/colors/red.png';
import greyColor from '../assets/images/colors/grey.png';
import yellowColor from '../assets/images/colors/yellow.png';
import blueLightColor from '../assets/images/colors/blue-light.png';
import purpleGreyColor from '../assets/images/colors/purple-grey.png';
import greenGreyColor from '../assets/images/colors/green-grey.png';

const locationMap = {
  hcm: "ho_chi_minh",
  hanoi: "ha_noi",
  danang: "da_nang",
  cantho: "can_tho",
  haiphong: "hai_phong",
  other: "tinh_khac",
};

// Map color codes to images
const colorImageMap = {
  'CE18': whiteColor,
  'CE1M': redColor,
  'CE1V': greyColor,
  'yellow': yellowColor,
  'blue-light': blueLightColor,
  'purple-grey': purpleGreyColor,
  'green-grey': greenGreyColor,
};

const getInteriorImage = (model) => {
  if (model === 'VF 3') {
    return vf3Interior;
  } else if (model === 'VF 5') {
    return vf5Interior;
  }
  return vf3Interior; // default
};

// Lấy chuỗi URL/path ảnh từ row (Firebase đôi khi trả về object hoặc chuỗi có khoảng trắng)
const toImageUrl = (val) => {
  if (val == null) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val !== null && typeof val.url === 'string') return val.url.trim();
  return String(val).trim();
};

// Get car image from carPriceData (same logic as HTML) - uses data from context, ưu tiên link từ Firebase/admin
const getCarImage = (carPriceData, model, version, exteriorColor) => {
  if (!model || !version || !exteriorColor) return vf3Full;
  if (!Array.isArray(carPriceData)) return vf3Full;
  const exact = carPriceData.find(e =>
    String(e.model || '').trim() === model &&
    String(e.trim || '').trim() === version &&
    String(e.exterior_color || '').trim() === exteriorColor
  );
  if (exact) {
    const rawUrl = exact.car_image_url ?? exact.carImageUrl;
    const path = toImageUrl(rawUrl);
    if (path) {
      const imageUrl = getCarImageUrl(path);
      if (imageUrl) return imageUrl;
    }
  }
  const fallback = carPriceData.find(e =>
    String(e.model || '').trim() === model &&
    String(e.trim || '').trim() === version &&
    (e.car_image_url || e.carImageUrl)
  );
  if (fallback) {
    const path = toImageUrl(fallback.car_image_url ?? fallback.carImageUrl);
    if (path) {
      const imageUrl = getCarImageUrl(path);
      if (imageUrl) return imageUrl;
    }
  }
  if (model === 'VF 3') return vf3Full;
  if (model === 'VF 5') return vf5Full;
  return vf3Full;
};

export default function CalculatorPage() {
  const navigate = useNavigate();
  const { carPriceData, exteriorColors: exteriorColorsFromContext, interiorColors: interiorColorsFromContext } = useCarPriceData();

  // Ảnh màu lấy từ Firebase (quản trị bảng giá) khi có, khớp với quan-tri-bang-gia
  const enhancedExteriorColors = useMemo(
    () => (exteriorColorsFromContext || uniqueNgoaiThatColors).map(color => ({
      ...color,
      icon: color.icon || colorImageMap[color.code] || whiteColor,
    })),
    [exteriorColorsFromContext]
  );
  const enhancedInteriorColors = useMemo(
    () => (interiorColorsFromContext || uniqueNoiThatColors).map(color => ({
      ...color,
      icon: color.icon || colorImageMap[color.code] || whiteColor,
    })),
    [interiorColorsFromContext]
  );

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerType, setCustomerType] = useState('ca_nhan');
  const [businessType, setBusinessType] = useState('khong_kinh_doanh');
  const [provinceSatNhap, setProvinceSatNhap] = useState('');
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositDate, setDepositDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [gifts, setGifts] = useState([]);

  // Car configuration
  const [carModel, setCarModel] = useState('');
  const [carVersion, setCarVersion] = useState('');
  const [exteriorColor, setExteriorColor] = useState('');
  const [interiorColor, setInteriorColor] = useState('');
  const [registrationLocation, setRegistrationLocation] = useState('hcm');
  const [registrationFee, setRegistrationFee] = useState(chi_phi_dich_vu_dang_ky);
  const [bodyInsuranceFee, setBodyInsuranceFee] = useState(0); // BHVC bao gồm Pin có thể chỉnh sửa
  const [isBodyInsuranceManual, setIsBodyInsuranceManual] = useState(false); // Theo dõi xem có chỉnh sửa thủ công không

  // Manual override states for rolling costs (Phase 5)
  const [liabilityInsuranceValue, setLiabilityInsuranceValue] = useState(0);
  const [isLiabilityInsuranceManual, setIsLiabilityInsuranceManual] = useState(false);
  const [plateFeeValue, setPlateFeeValue] = useState(0);
  const [isPlateFeeManual, setIsPlateFeeManual] = useState(false);
  const [inspectionFeeValue, setInspectionFeeValue] = useState(0);
  const [isInspectionFeeManual, setIsInspectionFeeManual] = useState(false);
  const [roadFeeValue, setRoadFeeValue] = useState(0);
  const [isRoadFeeManual, setIsRoadFeeManual] = useState(false);

  // Discounts and promotions
  const [discount2, setDiscount2] = useState(false);
  const [discount3, setDiscount3] = useState(false);
  const [discountBhvc2, setDiscountBhvc2] = useState(false);
  const [discountPremiumColor, setDiscountPremiumColor] = useState(false);
  const [convertCheckbox, setConvertCheckbox] = useState(false);
  const [vinClubVoucher, setVinClubVoucher] = useState('none');
  const [hoTroLaiSuat, setHoTroLaiSuat] = useState(false); // Hỗ trợ lãi suất - nếu chọn thì không được hưởng VinClub

  // Loan options
  const [loanToggle, setLoanToggle] = useState(true);
  const [loanRatio, setLoanRatio] = useState(70);
  const [loanTerm, setLoanTerm] = useState(60);
  const [customInterestRate, setCustomInterestRate] = useState('');
  const [isAddPromotionModalOpen, setIsAddPromotionModalOpen] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [selectedPromotions, setSelectedPromotions] = useState([]);
  const [selectedPromotionIds, setSelectedPromotionIds] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all', 'display', 'percentage', 'fixed'
  const [promotionSearchTerm, setPromotionSearchTerm] = useState(''); // Tìm kiếm chương trình ưu đãi

  // Get current user info for tracking who added/edited promotions
  const userEmail = localStorage.getItem('userEmail') || '';
  const username = localStorage.getItem('username') || '';

  // Load promotions when component mounts
  useEffect(() => {
    loadPromotions();
  }, []);

  // Default promotions (empty now, all promotions will be loaded from Firebase)
  const defaultPromotions = [];

  // Load promotions from Firebase and include hardcoded ones
  const loadPromotions = async () => {
    setLoadingPromotions(true);
    try {
      let promotionsList = [];

      try {
        const promotionsRef = ref(database, 'promotions');
        const snapshot = await get(promotionsRef);

        if (snapshot.exists()) {
          promotionsList = Object.entries(snapshot.val()).map(([id, data]) => ({
            id,
            ...data,
            isHardcoded: false
          }));
        }
      } catch (error) {
        console.warn("Error loading promotions from Firebase:", error);
        // Fallback to default promotions if there's an error
        setPromotions(defaultPromotions);
        setLoadingPromotions(false);
        return;
      }

      // Always include hardcoded promotions
      const hardcodedPromotions = defaultPromotions.filter(p => p.isHardcoded);
      const existingIds = new Set(promotionsList.map(p => p.id));

      // Only add hardcoded promotions that don't already exist in the database
      const newPromotions = hardcodedPromotions.filter(p => !existingIds.has(p.id));
      const allPromotions = [...promotionsList, ...newPromotions];

      // Ensure all promotions have the required fields; giữ dongXe từ Firebase để hiển thị "Áp dụng: ..."
      const formattedPromotions = allPromotions.map(promotion => {
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
          createdAt: promotion.createdAt || new Date().toISOString(),
          createdBy: promotion.createdBy || 'system',
          isHardcoded: !!promotion.isHardcoded
        };
      });

      setPromotions(formattedPromotions);

      // Sync selectedPromotions với data mới từ Firebase
      // Cập nhật value trong selectedPromotions nếu có thay đổi
      setSelectedPromotions(prev => {
        if (prev.length === 0) return prev;
        return prev.map(sp => {
          const updated = formattedPromotions.find(p => p.id === sp.id);
          if (updated) {
            return { ...sp, value: updated.value, type: updated.type };
          }
          return sp;
        });
      });
    } catch (error) {
      console.error("Error loading promotions:", error);
      toast.error("Lỗi khi tải danh sách ưu đãi: " + error.message);
      // Fallback to default promotions on error
      setPromotions(defaultPromotions);
    } finally {
      setLoadingPromotions(false);
    }
  };

  // Open add promotion modal — tải lại ưu đãi từ Firebase khi mở
  const openAddPromotionModal = () => {
    setIsAddPromotionModalOpen(true);
    setNewPromotionName('');
    setEditingPromotionId(null);
    setPromotionType('display');
    setSelectedDongXeList([]);
    loadPromotions();
  };

  // Close add promotion modal
  const closeAddPromotionModal = () => {
    setIsAddPromotionModalOpen(false);
    setNewPromotionName('');
    setEditingPromotionId(null);
    setPromotionType('display');
    setSelectedDongXeList([]);
    setPromotionSearchTerm('');
  };

  // Handle add promotion
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
        ], // Nếu không chọn dòng xe nào, áp dụng cho tất cả
        createdAt: new Date().toISOString(),
        createdBy: userEmail || username || "admin",
      };

      await set(newPromotionRef, promotionData);

      toast.success("Thêm chương trình ưu đãi thành công!");
      setNewPromotionName('');
      setPromotionType('display');
      setSelectedDongXeList([]);
      setEditingPromotion({
        name: '',
        type: 'display',
        value: 0,
        maxDiscount: 0,
        minPurchase: 0,
        dongXe: []
      });
      await loadPromotions(); // Reload list
    } catch (err) {
      console.error("Error adding promotion:", err);
      toast.error("Lỗi khi thêm chương trình ưu đãi: " + err.message);
    }
  };

  // Apply promotion to calculate discount amount
  const applyPromotion = (promotion, amount) => {
    if (promotion.type === 'display' || !promotion.value) {
      return 0; // No discount for display-only promotions
    }

    // Check minimum purchase requirement
    if (promotion.minPurchase && amount < promotion.minPurchase) {
      return 0;
    }

    let discount = 0;

    if (promotion.type === 'percentage') {
      // Calculate percentage discount
      let percentValue = promotion.value;
      // Auto-normalize: nếu value < 1 (ví dụ 0.15), convert sang dạng % (15)
      if (percentValue > 0 && percentValue < 1) {
        percentValue = percentValue * 100;
      }
      discount = (amount * percentValue) / 100;
    } else if (promotion.type === 'fixed') {
      // Fixed amount discount
      discount = Math.min(promotion.value, amount);
    }

    return Math.round(discount);
  };

  // Chuẩn hóa dongXe từ Firebase (có thể là mảng hoặc object dạng { "0": "vf_3", "1": "vf_6" })
  const normalizeDongXe = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'object' && !Array.isArray(val)) return Object.values(val).filter(Boolean);
    return [];
  };

  // Start editing promotion (gồm cả dòng xe áp dụng)
  const startEditPromotion = (promotion) => {
    setEditingPromotionId(promotion.id);
    const dongXe = normalizeDongXe(promotion.dongXe);
    setEditingPromotion({
      name: promotion.name || '',
      type: promotion.type || 'display',
      value: promotion.value || 0,
      maxDiscount: promotion.maxDiscount || 0,
      minPurchase: promotion.minPurchase || 0,
      dongXe: [...dongXe]
    });
  };

  // Cancel editing
  const cancelEditPromotion = () => {
    setEditingPromotionId(null);
    setEditingPromotion({
      name: '',
      type: 'display',
      value: 0,
      maxDiscount: 0,
      minPurchase: 0,
      dongXe: []
    });
  };

  // Handle promotion type change
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

  // Save edited promotion
  const handleSaveEditPromotion = async () => {
    if (!editingPromotion.name || !editingPromotion.name.trim()) {
      toast.warning("Vui lòng nhập tên chương trình ưu đãi!");
      return;
    }

    if (editingPromotion.type !== 'display' && !editingPromotion.value) {
      toast.warning(
        `Vui lòng nhập ${editingPromotion.type === 'percentage' ? 'phần trăm giảm giá' : 'số tiền giảm'}!`
      );
      return;
    }

    try {
      const promotionRef = ref(database, `promotions/${editingPromotionId}`);
      const dongXeToSave = normalizeDongXePromo(editingPromotion.dongXe);

      await update(promotionRef, {
        name: editingPromotion.name.trim(),
        type: editingPromotion.type,
        value: editingPromotion.value || 0,
        maxDiscount: editingPromotion.maxDiscount || 0,
        minPurchase: editingPromotion.minPurchase || 0,
        dongXe: dongXeToSave,
        updatedAt: new Date().toISOString(),
        updatedBy: userEmail || username || "admin",
      });

      toast.success("Cập nhật chương trình ưu đãi thành công!");
      cancelEditPromotion(); // Reset editing state
      await loadPromotions(); // Reload list
    } catch (err) {
      console.error("Error updating promotion:", err);
      toast.error("Lỗi khi cập nhật chương trình ưu đãi: " + err.message);
    }
  };

  // Open delete confirmation
  const openDeletePromotionConfirm = (promotionId) => {
    setDeletingPromotionId(promotionId);
  };

  // Close delete confirmation
  const closeDeletePromotionConfirm = () => {
    setDeletingPromotionId(null);
  };

  // Handle delete promotion
  const handleDeletePromotion = async () => {
    if (!deletingPromotionId) return;

    // Check if this is a hardcoded promotion
    const promotionToDelete = promotions.find(p => p.id === deletingPromotionId);
    if (promotionToDelete?.isHardcoded) {
      toast.error("Không thể xóa chương trình ưu đãi mặc định!");
      setDeletingPromotionId(null);
      return;
    }

    try {
      const promotionRef = ref(database, `promotions/${deletingPromotionId}`);
      await remove(promotionRef);

      // Remove from selected promotions if it was selected
      setSelectedPromotions(prev => prev.filter(p => p.id !== deletingPromotionId));

      toast.success("Xóa chương trình ưu đãi thành công!");
      setDeletingPromotionId(null);
      await loadPromotions(); // Reload list
    } catch (err) {
      console.error("Error deleting promotion:", err);
      toast.error("Lỗi khi xóa chương trình ưu đãi: " + err.message);
    }
  };

  // Toggle promotion selection in the modal
  const togglePromotionSelection = (promotionId) => {
    // Check if this promotion is already in the main selectedPromotions
    const isAlreadySelected = selectedPromotions.some(p => p.id === promotionId);

    if (isAlreadySelected) {
      // If already selected, remove it from selectedPromotions
      setSelectedPromotions(prev => {
        const updated = prev.filter(p => p.id !== promotionId);
        saveSelectedPromotions(updated);
        return updated;
      });
    } else {
      // If not selected, add it to the selectedPromotionIds for the modal
      setSelectedPromotionIds(prev => {
        if (prev.includes(promotionId)) {
          return prev.filter(id => id !== promotionId);
        } else {
          return [...prev, promotionId];
        }
      });
    }
  };

  // Add selected promotions to the main selection
  const addSelectedPromotions = () => {
    if (selectedPromotionIds.length === 0) return;

    // Get the selected promotion objects that aren't already selected
    const selectedPromos = promotions.filter(p =>
      selectedPromotionIds.includes(p.id) &&
      !selectedPromotions.some(sp => sp.id === p.id)
    );

    if (selectedPromos.length > 0) {
      // Only update if there are new promotions to add
      const newPromotions = [
        ...selectedPromotions,
        ...selectedPromos.map(p => {
          // Normalize percentage value when adding
          let value = p.value;
          if (p.type === 'percentage' && value > 0 && value < 1) {
            value = value * 100;
          }
          return {
            ...p,
            value,
            isActive: false // Default to not active when added
          };
        })
      ];

      setSelectedPromotions(newPromotions);
      saveSelectedPromotions(newPromotions);
    }

    // Clear selection and close modal
    setSelectedPromotionIds([]);
    setIsAddPromotionModalOpen(false);
    setPromotionSearchTerm('');
  };

  // Calculate total discount from selected and active promotions (chỉ tính ưu đãi áp dụng cho dòng xe hiện tại)
  const calculatePromotionDiscounts = (price, promotionsToCheck = null, selectedDongXeFilter = null) => {
    const promoList = promotionsToCheck || selectedPromotions;

    if (!promoList || !promoList.length) {
      return 0;
    }

    // Filter out promotions that are not active if we're not checking specific ones
    let activePromotions = promotionsToCheck
      ? promoList
      : promoList.filter(p => p.isActive === true);

    // Chỉ áp dụng ưu đãi khớp với dòng xe đang chọn (báo giá); đổi dòng xe thì ưu đãi không khớp không được cộng
    if (selectedDongXeFilter !== undefined && selectedDongXeFilter !== null) {
      if (!selectedDongXeFilter) {
        activePromotions = []; // Chưa chọn dòng xe thì không tính ưu đãi
      } else {
        activePromotions = filterPromotionsByDongXe(activePromotions, selectedDongXeFilter);
      }
    }

    if (activePromotions.length === 0) {
      return 0;
    }

    return activePromotions.reduce((total, promo) => {
      try {
        // Skip if promotion is not active (isActive is explicitly false) and we're not checking specific ones
        if (!promo || (!promotionsToCheck && promo.isActive === false)) {
          return total;
        }

        // Lookup fresh type and value from Firebase promotions state
        const freshPromo = promotions.find(p => p.id === promo.id);
        const type = freshPromo?.type ?? promo.type;
        const value = freshPromo?.value ?? promo.value;

        if (type === 'fixed') {
          return total + (parseFloat(value) || 0);
        } else if (type === 'percentage') {
          let percentage = parseFloat(value) || 0;
          // Auto-normalize: nếu value < 1 (ví dụ 0.15), convert sang dạng % (15)
          if (percentage > 0 && percentage < 1) {
            percentage = percentage * 100;
          }
          const discount = (price * percentage) / 100;
          return total + discount;
        }
        return total;
      } catch (error) {
        console.error('Error calculating promotion discount:', error, promo);
        return total;
      }
    }, 0);
  };

  // Calculate total discount from promotions with DMS = "Phiếu thu 51" (chỉ tính ưu đãi áp dụng cho dòng xe hiện tại)
  const calculatePhieuThu51Discount = (price, selectedDongXeFilter = null) => {
    console.log('[PhieuThu51] Starting calculation. selectedPromotions:', selectedPromotions?.length || 0, 'promotions:', promotions?.length || 0, 'selectedDongXe:', selectedDongXeFilter);
    
    if (!promotions || !promotions.length) {
      console.log('[PhieuThu51] No promotions available in Firebase');
      return 0;
    }

    // BƯỚC 1: Tìm trong selectedPromotions (ưu tiên)
    let activePromotions = [];
    if (selectedPromotions && selectedPromotions.length > 0) {
      // Filter active promotions
      activePromotions = selectedPromotions.filter(p => p.isActive === true);
      console.log('[PhieuThu51] Active selectedPromotions:', activePromotions.length);
      
      // Filter by dongXe
      if (selectedDongXeFilter) {
        activePromotions = filterPromotionsByDongXe(activePromotions, selectedDongXeFilter);
        console.log('[PhieuThu51] After dongXe filter (selectedPromotions):', activePromotions.length);
      }
    }
    
    // BƯỚC 2: Nếu không tìm thấy trong selectedPromotions, tìm trực tiếp trong promotions từ Firebase
    // (Cách dự phòng để đảm bảo không bỏ sót)
    if (activePromotions.length === 0 && promotions.length > 0) {
      console.log('[PhieuThu51] No active promotions in selectedPromotions, checking all promotions from Firebase...');
      let allPromotions = [...promotions];
      
      // Filter by dongXe
      if (selectedDongXeFilter) {
        allPromotions = filterPromotionsByDongXe(allPromotions, selectedDongXeFilter);
        console.log('[PhieuThu51] After dongXe filter (all promotions):', allPromotions.length);
      }
      
      activePromotions = allPromotions;
    }
    
    if (activePromotions.length === 0) {
      console.log('[PhieuThu51] No promotions match the criteria');
      return 0;
    }

    // Lọc các promotion có DMS = "Phiếu thu 51"
    const phieuThu51Promotions = activePromotions.filter(promo => {
      try {
        // Lookup fresh DMS from Firebase promotions state (nếu dùng selectedPromotions)
        // Hoặc dùng trực tiếp nếu đang dùng promotions từ Firebase
        const freshPromo = promotions.find(p => p.id === promo.id);
        const promoName = (freshPromo?.name ?? promo.name ?? '').trim();
        let dms = (freshPromo?.dms ?? promo.dms ?? '').trim();
        
        // Đặc biệt kiểm tra promotion "2025_11_CTKM ưu đãi Voucher Vinpearl"
        const isVinpearlPromo = promoName.includes('Voucher Vinpearl') || promoName.includes('2025_11_CTKM');
        
        // FALLBACK: Nếu là promotion Vinpearl và DMS rỗng, tự động coi như DMS = "Phiếu thu 51"
        if (isVinpearlPromo && !dms) {
          console.log('[PhieuThu51] ⚠️ Vinpearl promotion has empty DMS, auto-setting to "Phiếu thu 51"');
          dms = 'Phiếu thu 51';
        }
        
        // So sánh DMS (case-insensitive và trim)
        const dmsNormalized = dms.toLowerCase().trim();
        const targetDms = 'Phiếu thu 51'.toLowerCase().trim();
        const isMatch = dmsNormalized === targetDms;
        
        // Debug: log để kiểm tra
        console.log('[PhieuThu51] Checking promotion:', {
          id: promo.id,
          name: promoName,
          dms: dms,
          dmsLength: dms.length,
          dmsNormalized: dmsNormalized,
          targetDms: targetDms,
          isVinpearl: isVinpearlPromo,
          match: isMatch,
          exactMatch: dms === 'Phiếu thu 51'
        });
        
        // Nếu là promotion Vinpearl, log đặc biệt
        if (isVinpearlPromo) {
          console.log('[PhieuThu51] ⚠️ FOUND VINPEARL PROMOTION!', {
            id: promo.id,
            name: promoName,
            dms: dms,
            dmsRaw: JSON.stringify(dms),
            dmsNormalized: dmsNormalized,
            targetDms: targetDms,
            hasPhieuThu51: isMatch,
            exactMatch: dms === 'Phiếu thu 51',
            isActive: promo.isActive !== false,
            freshPromoDms: freshPromo?.dms,
            promoDms: promo.dms,
            autoSetDms: isVinpearlPromo && !(freshPromo?.dms ?? promo.dms)
          });
        }
        
        return isMatch;
      } catch (error) {
        console.error('[PhieuThu51] Error checking DMS:', error, promo);
        return false;
      }
    });

    if (phieuThu51Promotions.length === 0) {
      console.log('[PhieuThu51] No promotions found with DMS = "Phiếu thu 51". Active promotions:', activePromotions.length);
      // Log tất cả DMS có sẵn để debug
      const allDmsDetails = activePromotions.map(p => {
        const freshPromo = promotions.find(fp => fp.id === p.id);
        const dms = (freshPromo?.dms ?? p.dms ?? '').trim();
        const dmsNormalized = dms.toLowerCase().trim();
        const targetDms = 'Phiếu thu 51'.toLowerCase().trim();
        return { 
          id: p.id, 
          name: p.name || freshPromo?.name, 
          dms: dms,
          dmsRaw: JSON.stringify(dms),
          dmsLength: dms.length,
          dmsNormalized: dmsNormalized,
          targetDms: targetDms,
          matches: dmsNormalized === targetDms,
          exactMatch: dms === 'Phiếu thu 51',
          freshPromoDms: freshPromo?.dms,
          promoDms: p.dms
        };
      });
      console.log('[PhieuThu51] All DMS values (detailed):', allDmsDetails);
      console.log('[PhieuThu51] Target DMS:', JSON.stringify('Phiếu thu 51'));
      return 0;
    }

    console.log('[PhieuThu51] Found', phieuThu51Promotions.length, 'promotions with DMS = "Phiếu thu 51"');

    const totalDiscount = phieuThu51Promotions.reduce((total, promo) => {
      try {
        // Nếu dùng selectedPromotions, kiểm tra isActive
        if (selectedPromotions && selectedPromotions.length > 0) {
          const selectedPromo = selectedPromotions.find(p => p.id === promo.id);
          if (!selectedPromo || selectedPromo.isActive === false) {
            console.log('[PhieuThu51] Skipping promotion (not active in selectedPromotions):', promo.id);
            return total;
          }
        }

        // Lookup fresh type and value from Firebase promotions state
        const freshPromo = promotions.find(p => p.id === promo.id);
        if (!freshPromo && !promo) {
          console.warn('[PhieuThu51] Promotion not found:', promo.id);
          return total;
        }
        
        const type = freshPromo?.type ?? promo.type;
        const value = freshPromo?.value ?? promo.value;
        const promoName = freshPromo?.name ?? promo.name ?? '';

        let discount = 0;
        if (type === 'fixed') {
          discount = parseFloat(value) || 0;
        } else if (type === 'percentage') {
          let percentage = parseFloat(value) || 0;
          // Auto-normalize: nếu value < 1 (ví dụ 0.15), convert sang dạng % (15)
          if (percentage > 0 && percentage < 1) {
            percentage = percentage * 100;
          }
          discount = (price * percentage) / 100;
        }
        
        console.log('[PhieuThu51] ✅ Calculating discount for:', {
          id: promo.id,
          name: promoName,
          type: type,
          value: value,
          discount: discount,
          fromSelected: selectedPromotions?.some(p => p.id === promo.id) || false
        });
        
        return total + discount;
      } catch (error) {
        console.error('[PhieuThu51] Error calculating discount:', error, promo);
        return total;
      }
    }, 0);
    
    console.log('[PhieuThu51] Total discount:', totalDiscount);
    return totalDiscount;
  };

  // Toggle promotion active state
  const togglePromotionActive = (promotionId) => {
    setSelectedPromotions(prev => {
      const updated = prev.map(p =>
        p.id === promotionId
          ? {
            ...p,
            isActive: !p.isActive
          }
          : p
      );
      saveSelectedPromotions(updated);
      return updated;
    });
  };


  // Remove a selected promotion
  const removeSelectedPromotion = (promotionId) => {
    setSelectedPromotions(prev => {
      const updated = prev.filter(p => p.id !== promotionId);
      saveSelectedPromotions(updated);
      return updated;
    });
  };

  const [imageFade, setImageFade] = useState(false);
  const [carImageLoadError, setCarImageLoadError] = useState(false);

  // Helper function to format currency for input (without ₫ symbol)
  const formatCurrencyInput = (value) => {
    if (!value && value !== 0) return '';
    const numericValue = String(value).replace(/\D/g, '');
    if (!numericValue) return '';
    return new Intl.NumberFormat('vi-VN').format(parseInt(numericValue));
  };

  // Helper function to parse currency from formatted string
  const parseCurrencyInput = (value) => {
    if (!value) return 0;
    const numericValue = String(value).replace(/\D/g, '');
    return numericValue ? parseInt(numericValue, 10) : 0;
  };

  // Build derived versions from carPriceData
  const derivedVersions = useMemo(() => {
    if (!Array.isArray(carPriceData)) return [];

    const groups = {};
    carPriceData.forEach((entry) => {
      const model = String(entry.model || '').trim();
      const trim = String(entry.trim || '').trim();
      if (!model) return;
      const key = model + '||' + trim;
      if (!groups[key]) {
        groups[key] = {
          model: model,
          trim: trim,
          min_price_vnd: Infinity,
          exterior_colors: new Set(),
          interior_colors: new Set()
        };
      }

      const g = groups[key];
      const price = Number(entry.price_vnd || 0) || 0;
      if (price > 0 && price < g.min_price_vnd) g.min_price_vnd = price;

      const ext = entry.exterior_color;
      if (ext) g.exterior_colors.add(String(ext).trim());

      const interior = entry.interior_color;
      if (interior) g.interior_colors.add(String(interior).trim());
    });

    // Convert groups to array and sort
    const versions = Object.keys(groups).map((k) => {
      const v = groups[k];
      return {
        model: v.model,
        trim: v.trim,
        price_vnd: v.min_price_vnd === Infinity ? 0 : v.min_price_vnd,
        exterior_colors: Array.from(v.exterior_colors),
        interior_colors: Array.from(v.interior_colors),
      };
    });

    // Define sort orders for different models
    const vf7SortOrder = {
      'Eco': 1,
      'Eco TC 2': 2,
      'Eco HUD': 3,
      'Eco HUD TC2': 4,
      'Plus-1 Cầu': 5,
      'Plus-1 Cầu-TK': 6,
      'Plus-2 Cầu': 7,
      'Plus-2 Cầu-TK': 8
    };

    return versions.sort((a, b) => {
      // For VF 6, sort 'Plus TC 2' to the end
      if (a.model === 'VF 6' && b.model === 'VF 6') {
        if (a.trim === 'Plus TC 2') return 1;
        if (b.trim === 'Plus TC 2') return -1;
        return 0;
      }

      // For VF 7, use the defined sort order
      if (a.model === 'VF 7' && b.model === 'VF 7') {
        return (vf7SortOrder[a.trim] || 999) - (vf7SortOrder[b.trim] || 999);
      }

      // For other models, maintain original order
      return 0;
    });
  }, [carPriceData]);

  // Unique car model names (từ bảng giá) — dùng cho dropdown chọn dòng xe
  const carModels = useMemo(() => {
    const uniqueModels = {};
    derivedVersions.forEach((xe) => {
      if (!uniqueModels[xe.model]) uniqueModels[xe.model] = xe.model;
    });
    return uniqueModels;
  }, [derivedVersions]);

  // Dùng cùng modelNameToCode với getAvailableDongXeForPromotion (có NFD) để mã dòng xe khớp khi lưu & lọc (vd. VF Lạc Hồng -> vf_lac_hong)
  const modelNameToCode = modelNameToCodeFromData;

  // Danh sách dòng xe cho "Dòng xe áp dụng": từ danh_sach_xe + mọi model trong bảng giá (Firebase)
  const availableDongXeForPromotion = useMemo(
    () => getAvailableDongXeForPromotion(carPriceData),
    [carPriceData]
  );

  const dongXeCodeToName = useMemo(
    () => Object.fromEntries(availableDongXeForPromotion.map((x) => [x.code, x.name])),
    [availableDongXeForPromotion]
  );

  // Get available versions for selected model
  const availableVersions = useMemo(() => {
    if (!carModel) return [];
    return derivedVersions.filter(v => v.model === carModel);
  }, [carModel, derivedVersions]);

  // Get selected dong_xe code (hỗ trợ cả model tùy chỉnh như VF Lạc Hồng) — dùng modelNameToCode có NFD để khớp với code đã lưu trong ưu đãi
  const selectedDongXe = useMemo(() => {
    if (!carModel) return '';
    const found = danh_sach_xe.find(x =>
      (x.ten_hien_thi || '').toString().trim().toLowerCase() === carModel.toLowerCase()
    );
    if (found && found.dong_xe) return found.dong_xe;

    const norm = modelNameToCode(carModel);
    const found2 = danh_sach_xe.find(x => x.dong_xe === norm || x.dong_xe === norm.replace(/__+/g, '_'));
    return found2?.dong_xe || norm || '';
  }, [carModel]);

  // Chỉ ưu đãi áp dụng cho dòng xe hiện tại mới hiển thị và tính vào báo giá; chọn dòng xe khác thì ưu đãi không khớp không áp dụng
  const selectedPromotionsForCurrentCar = useMemo(() => {
    if (!selectedDongXe) return []; // Chưa chọn dòng xe thì không áp dụng ưu đãi
    return filterPromotionsByDongXe(selectedPromotions, selectedDongXe);
  }, [selectedPromotions, selectedDongXe]);

  // Get available colors for selected version
  const availableExteriorColors = useMemo(() => {
    if (!carModel || !carVersion) return [];

    // Get all entries for this model+version from carPriceData (in order)
    let entries = carPriceData.filter(e =>
      String(e.model || '').trim() === carModel &&
      String(e.trim || '').trim() === carVersion
    );

    // If no interior color is selected, default to black (CI11)
    const targetInteriorColor = interiorColor || 'CI11';
    entries = entries.filter(e =>
      String(e.interior_color || '').trim() === targetInteriorColor
    );

    // Extract unique exterior colors in the order they appear
    const seenCodes = new Set();
    const colorsInOrder = [];

    entries.forEach(entry => {
      const code = String(entry.exterior_color || '').trim();
      if (code && !seenCodes.has(code)) {
        seenCodes.add(code);
        // Find color info from uniqueNgoaiThatColors
        const colorInfo = enhancedExteriorColors.find(c => c.code === code);
        if (colorInfo) {
          colorsInOrder.push(colorInfo);
        }
      }
    });

    return colorsInOrder;
  }, [carModel, carVersion, interiorColor, carPriceData]);

  const availableInteriorColors = useMemo(() => {
    if (!carModel || !carVersion) return [];
    const selectedCar = derivedVersions.find(xe => xe.model === carModel && xe.trim === carVersion);
    if (!selectedCar) return [];
    return selectedCar.interior_colors.map(code => {
      return enhancedInteriorColors.find(c => c.code === code);
    }).filter(c => c);
  }, [carModel, carVersion, derivedVersions]);

  // Get car image URL (ưu tiên link từ Firebase/quản trị bảng giá)
  const carImageUrl = useMemo(() => {
    return getCarImage(carPriceData, carModel, carVersion, exteriorColor);
  }, [carPriceData, carModel, carVersion, exteriorColor]);

  useEffect(() => {
    setCarImageLoadError(false);
  }, [carImageUrl]);

  const interiorImageUrl = useMemo(() => {
    return getInteriorImage(carModel);
  }, [carModel]);

  // Get car price
  const getCarPrice = () => {
    if (!Array.isArray(carPriceData)) return 0;

    const exact = carPriceData.find(e => {
      const m = String(e.model || '').trim();
      const t = String(e.trim || '').trim();
      const ext = String(e.exterior_color || '').trim();
      const inti = String(e.interior_color || '').trim();
      return m === carModel && t === carVersion && ext === exteriorColor && inti === interiorColor;
    });
    if (exact && typeof exact.price_vnd !== 'undefined') return Number(exact.price_vnd);

    const candidates = carPriceData.filter(e => {
      const m = String(e.model || '').trim();
      const t = String(e.trim || '').trim();
      return m === carModel && t === carVersion;
    });
    if (candidates.length > 0) {
      const prices = candidates.map(c => Number(c.price_vnd || 0) || 0).filter(p => p > 0);
      if (prices.length > 0) return Math.min(...prices);
    }

    return 0;
  };

  // Load selected promotions from localStorage
  const loadSelectedPromotions = () => {
    try {
      const savedPromotions = localStorage.getItem('selectedPromotions');
      if (savedPromotions) {
        const parsed = JSON.parse(savedPromotions);
        // Set isActive to false by default when loading + normalize percentage values
        const withDefaults = parsed.map(p => ({
          ...p,
          isActive: false, // Default to false when loading
          // Normalize percentage: nếu value < 1 (ví dụ 0.15), convert sang dạng % (15)
          value: (p.type === 'percentage' && p.value > 0 && p.value < 1)
            ? p.value * 100
            : p.value
        }));
        setSelectedPromotions(withDefaults);
      }
    } catch (error) {
      console.error('Error loading selected promotions:', error);
    }
  };

  // Save selected promotions to localStorage
  const saveSelectedPromotions = (promotions) => {
    try {
      localStorage.setItem('selectedPromotions', JSON.stringify(promotions));
    } catch (error) {
      console.error('Error saving selected promotions:', error);
    }
  };

  // Initialize default values
  useEffect(() => {
    // Load saved promotions from localStorage
    loadSelectedPromotions();

    // Set default car model
    if (Object.keys(carModels).length > 0 && !carModel) {
      const firstModel = Object.keys(carModels)[0];
      setCarModel(firstModel);
    }
  }, [carModels, carModel]);

  // Save selected promotions to localStorage whenever they change
  useEffect(() => {
    if (selectedPromotions.length > 0) {
      saveSelectedPromotions(selectedPromotions);
    }
  }, [selectedPromotions]);

  // Update deposit amount when car model changes
  useEffect(() => {
    if (selectedDongXe) {
      const depositData = gia_tri_dat_coc.find(item => item.dong_xe === selectedDongXe);
      if (depositData) {
        setDepositAmount(depositData.gia_tri);
      }
    }
  }, [selectedDongXe]);

  // Set default version when model changes
  useEffect(() => {
    if (availableVersions.length > 0 && !carVersion) {
      setCarVersion(availableVersions[0].trim);
    }
  }, [availableVersions, carVersion]);

  // Reset BHVC 2-year discount when model changes (only for VF3 and VF5)
  useEffect(() => {
    if (carModel && carModel !== 'VF 3' && carModel !== 'VF 5') {
      setDiscountBhvc2(false);
    }
  }, [carModel]);

  // Set default colors when version changes
  useEffect(() => {
    if (availableExteriorColors.length > 0 && !exteriorColor) {
      setExteriorColor(availableExteriorColors[0].code);
    }
  }, [availableExteriorColors, exteriorColor]);

  useEffect(() => {
    if (availableInteriorColors.length > 0 && !interiorColor) {
      setInteriorColor(availableInteriorColors[0].code);
    }
  }, [availableInteriorColors, interiorColor]);

  // Reset exterior color if current selection is not available for selected interior
  useEffect(() => {
    if (interiorColor && exteriorColor && availableExteriorColors.length > 0) {
      const isCurrentColorAvailable = availableExteriorColors.some(c => c.code === exteriorColor);
      if (!isCurrentColorAvailable) {
        setExteriorColor(availableExteriorColors[0].code);
      }
    }
  }, [interiorColor, availableExteriorColors]);

  // Handle exterior color change with fade animation
  const handleExteriorColorChange = (colorCode) => {
    setImageFade(true);
    setTimeout(() => {
      setExteriorColor(colorCode);
      setImageFade(false);
    }, 250);
  };

  // Auto-update bodyInsuranceFee when model changes (reset to auto mode)
  useEffect(() => {
    if (carModel) {
      setIsBodyInsuranceManual(false);
      setBodyInsuranceFee(0);
    }
  }, [carModel]);

  // Calculate all costs
  const calculations = useMemo(() => {
    const basePrice = getCarPrice();

    // Discounts
    const discount2Potential = discount2 ? 50000000 : 0;
    const discount3Potential = discount3 ? Math.round(basePrice * 0.04) : 0;

    // BHVC 2-year
    let bhvc2Potential = 0;
    if (selectedDongXe) {
      const entry = quy_doi_2_nam_bhvc.find(e => e.dong_xe === selectedDongXe);
      if (entry && entry.gia_tri) bhvc2Potential = Number(entry.gia_tri) || 0;
    }
    const bhvc2 = discountBhvc2 ? bhvc2Potential : 0;

    // Premium color
    let premiumColorPotential = 0;
    if (selectedDongXe) {
      const exteriorColorObj = enhancedExteriorColors.find(c => c.code === exteriorColor);
      const exteriorText = exteriorColorObj?.name || '';

      if (selectedDongXe === 'vf_3') {
        if (/Vàng Nóc Trắng|Xanh Lá Nhạt|Hồng Nóc Trắng|Xanh Nóc Trắng/i.test(exteriorText)) {
          premiumColorPotential = 8000000;
        }
      } else if (selectedDongXe === 'vf_5') {
        if (/Vàng Nóc Trắng|Xanh Lá Nhạt|Xanh Nóc Trắng/i.test(exteriorText)) {
          premiumColorPotential = 12000000;
        }
      }
    }
    const premiumColor = discountPremiumColor ? premiumColorPotential : 0;

    // Convert support
    let convertSupportDiscount = 0;
    if (convertCheckbox && selectedDongXe) {
      const supportEntry = ho_tro_doi_xe.find(h => h.dong_xe === selectedDongXe);
      if (supportEntry && supportEntry.gia_tri) convertSupportDiscount = Number(supportEntry.gia_tri) || 0;
    }

    // Old hardcoded discounts (keeping for backward compatibility)
    const legacyPromotionDiscount = discount2Potential + discount3Potential;

    // Calculate promotion discounts from selected promotions (chỉ ưu đãi áp dụng cho dòng xe hiện tại)
    const promotionDiscounts = calculatePromotionDiscounts(basePrice, null, selectedDongXe);

    // Total promotion discounts (both from selected promotions and legacy)
    // Use clampDiscount to ensure discount never exceeds base price
    const rawTotalDiscount = (promotionDiscounts || 0) + (legacyPromotionDiscount || 0);
    const totalPromotionDiscounts = clampDiscount(rawTotalDiscount, basePrice);

    const priceAfterBasicPromotions = Math.max(0, basePrice - totalPromotionDiscounts);

    // VinClub discount - tính trên (Giá niêm yết - fix discount)
    // Công thức: VinClub = (Giá niêm yết - fix discount) * % VinClub
    let vinClubDiscount = 0;
    if (vinClubVoucher !== 'none' && !hoTroLaiSuat) {
      const vinClubData = getDataByKey(uu_dai_vin_club, 'hang', vinClubVoucher);
      if (vinClubData) {
        vinClubDiscount = Math.round(priceAfterBasicPromotions * vinClubData.ty_le);
      }
    }

    // Giá XHD = giá sau khi áp dụng hết ưu đãi/chính sách (VinClub + Xăng đổi điện) = giá xuất hóa đơn chuẩn
    // Lưu ý: promotionDiscounts đã bao gồm TẤT CẢ các promotion (kể cả những cái có DMS = "Phiếu thu 51")
    const giaXuatHoaDon = Math.max(0, priceAfterBasicPromotions - vinClubDiscount - convertSupportDiscount);

    // Tính tổng các chương trình có DMS = "Phiếu thu 51" (tính trên basePrice)
    // Ví dụ: "2025_11_CTKM ưu đãi Voucher Vinpearl (quy đổi tiền mặt 50tr)" có DMS = "Phiếu thu 51"
    // Ưu đãi này đã được trừ 1 lần trong promotionDiscounts (tính vào Giá XHD)
    // Bây giờ cần trừ thêm 1 lần nữa vào Giá thanh toán thực tế
    const phieuThu51Discount = calculatePhieuThu51Discount(basePrice, selectedDongXe);
    console.log('[PhieuThu51] Final calculation - basePrice:', basePrice, 'giaXuatHoaDon:', giaXuatHoaDon, 'phieuThu51Discount:', phieuThu51Discount);

    // CÔNG THỨC: Giá thanh toán thực tế = Giá XHD - tổng value của các promotion có DMS = "Phiếu thu 51"
    // finalPayable = giaXuatHoaDon - phieuThu51Discount
    // 
    // Trong đó:
    // - phieuThu51Discount = tổng value của các promotion có dms: "Phiếu thu 51"
    //   đang được chọn trong selectedPromotions và đang active (isActive = true)
    //   và khớp với dòng xe đang chọn
    // 
    // - Nếu promotion có type = "fixed": value = giá trị cố định (ví dụ: 50000000)
    // - Nếu promotion có type = "percentage": value = (basePrice * value) / 100
    //
    // QUAN TRỌNG: Nếu có promotion có DMS = "Phiếu thu 51" đang active, 
    //             thì finalPayable PHẢI KHÁC giaXuatHoaDon (phải trừ đi)
    //
    // Ví dụ: Promotion "2025_11_CTKM ưu đãi Voucher Vinpearl (quy đổi tiền mặt 50tr)" 
    //        có dms: "Phiếu thu 51", type: "fixed", value: 50000000
    // - Giá XHD = Giá niêm yết - 50tr (đã trừ 1 lần trong promotionDiscounts)
    // - Giá thanh toán thực tế = Giá XHD - 50tr (trừ thêm 1 lần nữa) = Giá niêm yết - 100tr
    const finalPayable = Math.max(0, giaXuatHoaDon - phieuThu51Discount);
    
    // Đảm bảo rằng nếu có promotion có DMS = "Phiếu thu 51" đang active, thì phải trừ
    if (phieuThu51Discount > 0 && finalPayable === giaXuatHoaDon) {
      console.error('[PhieuThu51] ❌ ERROR: phieuThu51Discount > 0 but finalPayable equals giaXuatHoaDon! This should not happen.');
    }
    
    console.log('[PhieuThu51] Final payable calculation:', {
      giaXuatHoaDon,
      phieuThu51Discount,
      finalPayable,
      areEqual: finalPayable === giaXuatHoaDon,
      shouldBeDifferent: phieuThu51Discount > 0
    });
    
    // Cảnh báo nếu phieuThu51Discount = 0 nhưng có promotion có DMS = "Phiếu thu 51"
    if (phieuThu51Discount === 0) {
      // Kiểm tra trong selectedPromotions
      if (selectedPromotions && selectedPromotions.length > 0) {
        const hasPhieuThu51 = selectedPromotions.some(p => {
          const freshPromo = promotions.find(fp => fp.id === p.id);
          const dms = (freshPromo?.dms ?? p.dms ?? '').trim();
          return dms === 'Phiếu thu 51';
        });
        if (hasPhieuThu51) {
          console.warn('[PhieuThu51] ⚠️ WARNING: Found promotions with DMS = "Phiếu thu 51" but discount is 0. Check if promotions are active and match selected dongXe.');
        }
      }
      
      // Kiểm tra đặc biệt cho promotion Vinpearl
      const vinpearlPromo = promotions.find(p => {
        const name = (p.name || '').trim();
        return name.includes('Voucher Vinpearl') || name.includes('2025_11_CTKM');
      });
      
      if (vinpearlPromo) {
        const vinpearlDms = (vinpearlPromo.dms || '').trim();
        const isInSelected = selectedPromotions?.some(p => p.id === vinpearlPromo.id);
        console.log('[PhieuThu51] 🔍 Vinpearl Promotion Check:', {
          id: vinpearlPromo.id,
          name: vinpearlPromo.name,
          dms: vinpearlDms,
          isPhieuThu51: vinpearlDms === 'Phiếu thu 51',
          isInSelected: isInSelected,
          isActive: selectedPromotions?.find(p => p.id === vinpearlPromo.id)?.isActive,
          selectedDongXe: selectedDongXe
        });
        
        if (vinpearlDms === 'Phiếu thu 51' && !isInSelected) {
          console.warn('[PhieuThu51] ⚠️ Vinpearl promotion has DMS = "Phiếu thu 51" but is NOT in selectedPromotions!');
        }
      }
    }
    const totalDiscount = totalPromotionDiscounts + (vinClubDiscount || 0) + (convertSupportDiscount || 0);
    const priceAfterDiscount = Math.max(0, basePrice - totalDiscount);
    const amountBeforeVinClub = Math.max(0, priceAfterBasicPromotions - convertSupportDiscount - bhvc2 - premiumColor);

    // On-road costs
    const locationKey = locationMap[registrationLocation] || 'tinh_khac';
    const plateFeeData = getDataByKey(phi_cap_bien_so, 'khu_vuc', locationKey);
    const plateFeeAuto = plateFeeData ? plateFeeData.gia_tri : getDataByKey(phi_cap_bien_so, 'khu_vuc', 'tinh_khac').gia_tri;
    const plateFee = isPlateFeeManual ? plateFeeValue : plateFeeAuto;

    const roadFeeData = getDataByKey(phi_duong_bo, 'loai', customerType);
    const roadFeeAuto = roadFeeData ? roadFeeData.gia_tri : getDataByKey(phi_duong_bo, 'loai', 'ca_nhan').gia_tri;
    const roadFee = isRoadFeeManual ? roadFeeValue : roadFeeAuto;

    const carInfo = getDataByKey(thong_tin_ky_thuat_xe, 'dong_xe', selectedDongXe);
    const liabilityInsuranceAuto = carInfo
      ? businessType === 'khong_kinh_doanh' ? carInfo.phi_tnds_ca_nhan : carInfo.phi_tnds_kinh_doanh
      : getDataByKey(thong_tin_ky_thuat_xe, 'dong_xe', 'vf_7').phi_tnds_ca_nhan;
    const liabilityInsurance = isLiabilityInsuranceManual ? liabilityInsuranceValue : liabilityInsuranceAuto;

    const inspectionFeeAuto = phi_kiem_dinh;
    const inspectionFee = isInspectionFeeManual ? inspectionFeeValue : inspectionFeeAuto;
    const bhvcRate = 0.014;
    // BHVC tính trên Giá XHD
    const bodyInsurance = isBodyInsuranceManual ? bodyInsuranceFee : Math.round(giaXuatHoaDon * bhvcRate);
    const registrationFeeValue = Number(registrationFee) || 0;

    const totalOnRoadCost = plateFee + roadFee + liabilityInsurance + inspectionFee + bodyInsurance + registrationFeeValue;
    const totalCost = finalPayable + totalOnRoadCost;

    // Loan calculations: Tiền vay và lãi dựa trên Giá XHD (giá trị xe), không dựa trên totalCost
    // Số tiền trả trước = (Giá XHD - Tiền vay) + phí đường bộ/đăng ký (trả trước bao gồm đối ứng xe + toàn bộ phí)
    let loanData = {
      downPayment: 0,
      loanAmount: 0,
      totalInterest: 0,
      monthlyPayment: 0,
    };

    if (loanToggle) {
      const loanRatioDecimal = loanRatio / 100;
      let annualRate = lai_suat_vay_hang_nam;
      if (customInterestRate && isValidInterestRate(customInterestRate)) {
        annualRate = Number(customInterestRate) / 100;
      }
      const monthlyRate = annualRate / 12;

      // Tiền vay = loanRatio% × Giá XHD (giá trị xe), không nhân với totalCost
      const loanAmount = Math.round(giaXuatHoaDon * loanRatioDecimal);
      // Số tiền trả trước = (Giá XHD - Tiền vay) + tổng phí (đối ứng xe + phí đường bộ, đăng ký, ...)
      const downPayment = Math.max(0, giaXuatHoaDon - loanAmount) + totalOnRoadCost;

      // Calculate monthly payment using annuity formula
      let monthlyPayment = 0;
      if (monthlyRate > 0 && loanTerm > 0) {
        const numerator = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTerm));
        const denominator = Math.pow(1 + monthlyRate, loanTerm) - 1;
        monthlyPayment = numerator / denominator;
      } else if (loanTerm > 0) {
        monthlyPayment = loanAmount / loanTerm;
      }

      const totalPayment = monthlyPayment * loanTerm;
      const totalInterest = totalPayment - loanAmount;

      loanData = {
        downPayment: Math.round(downPayment),
        loanAmount,
        totalInterest: Math.round(totalInterest),
        monthlyPayment: Math.round(monthlyPayment),
      };
    }

    // Phase 7: Số tiền thanh toán đối ứng (phần xe) = Giá XHD - Tiền vay
    let tienVayTuGiaXHD = loanData.loanAmount || 0;
    let soTienThanhToanDoiUng = Math.max(0, giaXuatHoaDon - tienVayTuGiaXHD);

    return {
      basePrice,
      discount2Potential,
      discount3Potential,
      promotionDiscounts: totalPromotionDiscounts,
      promotionDiscountTotal: totalPromotionDiscounts,
      priceAfterBasicPromotions,
      convertSupportDiscount,
      bhvc2,
      bhvc2Potential,
      premiumColor,
      premiumColorPotential,
      vinClubDiscount,
      amountBeforeVinClub,
      giaXuatHoaDon,
      phieuThu51Discount,
      finalPayable,
      totalDiscount,
      priceAfterDiscount,
      plateFee,
      plateFeeData,
      plateFeeAuto,
      roadFee,
      roadFeeAuto,
      liabilityInsurance,
      liabilityInsuranceAuto,
      inspectionFee,
      inspectionFeeAuto,
      bodyInsurance,
      registrationFee: registrationFeeValue,
      totalOnRoadCost,
      totalCost,
      loanData,
      tienVayTuGiaXHD,
      soTienThanhToanDoiUng,
    };
  }, [
    carModel,
    carVersion,
    exteriorColor,
    interiorColor,
    discount2,
    discount3,
    discountBhvc2,
    discountPremiumColor,
    convertCheckbox,
    vinClubVoucher,
    hoTroLaiSuat,
    customerType,
    businessType,
    registrationLocation,
    selectedDongXe,
    selectedPromotions,
    loanToggle,
    loanRatio,
    loanTerm,
    customInterestRate,
    registrationFee,
    isBodyInsuranceManual,
    bodyInsuranceFee,
    isLiabilityInsuranceManual,
    liabilityInsuranceValue,
    isPlateFeeManual,
    plateFeeValue,
    isInspectionFeeManual,
    inspectionFeeValue,
    isRoadFeeManual,
    roadFeeValue,
  ]);

  // Collect invoice data
  const collectInvoiceData = () => {
    const num = (v) => (typeof v === 'number' && Number.isFinite(v)) ? v : Number(v) || 0;

    const data = {
      // Customer info
      customerName: customerName || 'QUÝ KHÁCH HÀNG',
      customerAddress: customerAddress || 'Thành phố Hồ Chí Minh',
      customerType: customerType || 'ca_nhan',
      businessType: businessType || 'khong_kinh_doanh',
      provinceSatNhap: provinceSatNhap || '',
      depositAmount: num(depositAmount),
      depositDate: depositDate || '',
      deliveryDate: deliveryDate || '',
      gifts: Array.isArray(gifts) ? gifts : [],

      // Car info
      carModel: carModel || '',
      carVersion: carVersion || '',
      exteriorColor: exteriorColor || '',
      interiorColor: interiorColor || '',
      carDongXe: selectedDongXe || '',

      // Get color names
      exteriorColorName: enhancedExteriorColors.find(c => c.code === exteriorColor)?.name || exteriorColor,
      interiorColorName: enhancedInteriorColors.find(c => c.code === interiorColor)?.name || interiorColor,

      // Prices (ensure numbers for correct display on invoice)
      carBasePrice: num(calculations.basePrice),
      carPriceAfterPromotions: num(calculations.priceAfterBasicPromotions),
      carTotal: num(calculations.finalPayable),
      priceFinalPayment: num(calculations.finalPayable),

      // Discounts
      vinClubDiscount: num(calculations.vinClubDiscount),
      convertSupportDiscount: num(calculations.convertSupportDiscount),
      premiumColorDiscount: num(calculations.premiumColorPotential),
      bhvc2Discount: num(calculations.bhvc2Potential),

      // On-road costs (key for location, not label - Invoice2Page maps key to label)
      registrationLocation: registrationLocation || 'hcm',
      plateFee: num(calculations.plateFee),
      isPlateFeeManual: Boolean(isPlateFeeManual),
      liabilityInsurance: num(calculations.liabilityInsurance),
      isLiabilityInsuranceManual: Boolean(isLiabilityInsuranceManual),
      inspectionFee: num(calculations.inspectionFee),
      isInspectionFeeManual: Boolean(isInspectionFeeManual),
      roadFee: num(calculations.roadFee),
      isRoadFeeManual: Boolean(isRoadFeeManual),
      registrationFee: num(calculations.registrationFee),
      bodyInsurance: num(calculations.bodyInsurance),
      bodyInsuranceFee: num(bodyInsuranceFee),
      isBodyInsuranceManual: Boolean(isBodyInsuranceManual),
      totalOnRoadCost: num(calculations.totalOnRoadCost),

      // Loan info
      hasLoan: Boolean(loanToggle),
      loanRatio: num(loanRatio),
      loanAmount: num(calculations.loanData?.loanAmount),
      downPayment: num(calculations.loanData?.downPayment),

      // Detailed promotions for invoice display (tính calculatedDiscount cho loại %)
      selectedPromotions: Array.isArray(selectedPromotions)
        ? selectedPromotions.map((p) => {
            const base = num(calculations.basePrice) || 0;
            const calculatedDiscount = p.type === 'percentage' || p.type === 'fixed'
              ? applyPromotion(p, base)
              : (p.calculatedDiscount != null ? num(p.calculatedDiscount) : num(p.value));
            return { ...p, calculatedDiscount };
          })
        : [],
      promotionCheckboxes: {
        discount2,
        discount3,
        discountBhvc2,
        discountPremiumColor,
        convertCheckbox,
        vinClubVoucher,
        hoTroLaiSuat,
      },

      // Calculated promotion values
      promotionDetails: {
        basicDiscount: num((calculations.basePrice || 0) - (calculations.priceAfterBasicPromotions || 0)),
        vinClubDiscount: num(calculations.vinClubDiscount),
        bhvc2Discount: num(calculations.bhvc2Potential),
        premiumColorDiscount: num(calculations.premiumColorPotential),
        convertSupportDiscount: num(calculations.convertSupportDiscount),
      },

      // Final prices
      giaXuatHoaDon: num(calculations.giaXuatHoaDon),
      giaThanhToanThucTe: num(calculations.finalPayable),
      tongChiPhiLanBanh: num(calculations.totalCost), // Tổng chi phí lăn bánh = Giá thanh toán thực tế + Tổng chi phí lăn bánh
      tienVayTuGiaXHD: num(calculations.tienVayTuGiaXHD),
      soTienThanhToanDoiUng: num(calculations.soTienThanhToanDoiUng),
    };

    // Save to localStorage
    localStorage.setItem('invoiceData', JSON.stringify(data));

    // Navigate to invoice page
    navigate('/in-bao-gia-2');
  };

  // Save quote to homepage
  const saveToHomepage = () => {
    const quoteData = {
      id: Date.now().toString(), // Simple ID based on timestamp
      carModel: carModel || '',
      carVersion: carVersion || '',
      exteriorColorName: enhancedExteriorColors.find(c => c.code === exteriorColor)?.name || exteriorColor,
      interiorColorName: enhancedInteriorColors.find(c => c.code === interiorColor)?.name || interiorColor,
      basePrice: calculations.basePrice || 0,
      totalCost: calculations.finalPayable || 0,
      carImageUrl: carImageUrl || '',
      createdAt: new Date().toISOString(),
    };

    // Get existing quotes from localStorage
    const existingQuotes = JSON.parse(localStorage.getItem('homepageQuotes') || '[]');

    // Add new quote to the beginning of the array
    const updatedQuotes = [quoteData, ...existingQuotes];

    // Save back to localStorage
    localStorage.setItem('homepageQuotes', JSON.stringify(updatedQuotes));

    // Show success message (you can replace with toast notification)
    alert('Báo giá đã được lưu vào trang chủ!');
  };

  // Helper to get registration location label
  const getRegistrationLocationLabel = () => {
    const locationLabels = {
      hcm: 'TP. Hồ Chí Minh',
      hanoi: 'Hà Nội',
      danang: 'Đà Nẵng',
      cantho: 'Cần Thơ',
      haiphong: 'Hải Phòng',
      other: 'Tỉnh thành khác',
    };
    return locationLabels[registrationLocation] || 'TP. Hồ Chí Minh';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/menu")}
              className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100"
              aria-label="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Quay lại</span>
            </button>
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden bg-white border-2 border-gray-200">
                <img src={logoImage} alt="VinFast Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 ml-2">
              Công cụ tính giá xe VinFast
            </h1>
          </div>
          <div className="relative">
            <button
              onClick={openAddPromotionModal}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg border-2 border-transparent hover:bg-white hover:border-purple-600 hover:text-purple-600 transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm"
            >
              <Gift className="w-4 h-4" />
              <span>Chọn chương trình ưu đãi</span>
              {selectedPromotions.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {selectedPromotions.length}
                </span>
              )}
            </button>

            {/* Promotion Modal */}
            {isAddPromotionModalOpen && (
              <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                <div className="modal-box bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[calc(100vh-2rem)] overflow-auto">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-purple-400 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg">
                    <h3 className="text-lg font-medium text-white flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      <span>Chọn chương trình ưu đãi</span>
                    </h3>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6">
                    <div>
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">Danh sách chương trình ưu đãi</h4>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => loadPromotions()}
                            disabled={loadingPromotions}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            title="Tải lại từ database"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${loadingPromotions ? 'animate-spin' : ''}`} />
                            Tải lại
                          </button>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setFilterType('all')}
                            className={`px-2 py-1 text-xs rounded-lg border ${filterType === 'all'
                              ? 'bg-purple-100 border-purple-500 text-purple-700 font-medium'
                              : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                              }`}
                            title="Tất cả"
                          >
                            Tất cả
                          </button>
                          <button
                            onClick={() => setFilterType('display')}
                            className={`px-2 py-1 text-xs rounded-lg border ${filterType === 'display'
                              ? 'bg-purple-100 border-purple-500 text-purple-700 font-medium'
                              : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                              }`}
                            title="Chỉ hiển thị"
                          >
                            Hiển thị
                          </button>
                          <button
                            onClick={() => setFilterType('percentage')}
                            className={`px-2 py-1 text-xs rounded-lg border ${filterType === 'percentage'
                              ? 'bg-purple-100 border-purple-500 text-purple-700 font-medium'
                              : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                              }`}
                            title="Giảm %"
                          >
                            Giảm %
                          </button>
                          <button
                            onClick={() => setFilterType('fixed')}
                            className={`px-2 py-1 text-xs rounded-lg border ${filterType === 'fixed'
                              ? 'bg-purple-100 border-purple-500 text-purple-700 font-medium'
                              : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                              }`}
                            title="Giảm tiền"
                          >
                            Giảm tiền
                          </button>
                        </div>
                      </div>

                      {/* Thông báo lọc theo dòng xe */}
                      {carModel && (
                        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <span className="font-medium">Áp dụng dòng xe:</span> {carModel}
                            <span className="text-xs block mt-0.5">Chỉ ưu đãi áp dụng cho dòng xe này mới được chọn và tính vào báo giá.</span>
                          </p>
                        </div>
                      )}

                      {/* Tìm kiếm chương trình ưu đãi */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm chương trình</label>
                        <input
                          type="text"
                          value={promotionSearchTerm}
                          onChange={(e) => setPromotionSearchTerm(e.target.value)}
                          placeholder="Nhập tên chương trình ưu đãi..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {loadingPromotions ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">Đang tải...</p>
                        </div>
                      ) : promotions.length === 0 ? (
                        <div className="text-center py-4 text-sm text-gray-500">
                          Chưa có chương trình ưu đãi nào trong database. Bấm <strong>Tải lại</strong>.
                        </div>
                      ) : (() => {
                        const filtered = promotions
                          .filter(promotion => filterType === 'all' || promotion.type === filterType)
                          .filter(promotion => isPromotionAssignedToDongXe(promotion, selectedDongXe))
                          .filter(promotion => !promotionSearchTerm.trim() || (promotion.name || '').toLowerCase().includes(promotionSearchTerm.trim().toLowerCase()));
                        if (filtered.length === 0) {
                          return (
                            <div className="text-center py-4 text-sm text-gray-500">
                              {carModel ? (
                                <>Không có ưu đãi nào áp dụng cho <strong>{carModel}</strong>. Bấm <strong>Tải lại</strong> hoặc thử bỏ chọn dòng xe ở báo giá.</>
                              ) : (
                                <>Không có ưu đãi nào trùng bộ lọc. Thử đổi bộ lọc hoặc bấm <strong>Tải lại</strong>.</>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div key="promo-list" className="space-y-2 max-h-[400px] overflow-y-auto">
                            {filtered.map((promotion) => (
                              <div
                                key={promotion.id}
                                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`promo-${promotion.id}`}
                                      checked={selectedPromotions.some(p => p.id === promotion.id) ||
                                        selectedPromotionIds.includes(promotion.id)}
                                      onChange={() => togglePromotionSelection(promotion.id)}
                                      className="w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-offset-2 focus:ring-2 checked:bg-purple-600 checked:border-purple-600"
                                    />
                                    <label htmlFor={`promo-${promotion.id}`} className="sr-only">
                                      Chọn ưu đãi {promotion.name}
                                    </label>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <div className="text-sm font-medium text-gray-700">{promotion.name}</div>
                                      {promotion.type === 'fixed' && (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded whitespace-nowrap">
                                          Giảm {formatCurrency(promotion.value)}
                                        </span>
                                      )}
                                      {promotion.type === 'percentage' && (
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded whitespace-nowrap">
                                          Giảm {promotion.value}%
                                        </span>
                                      )}
                                      {promotion.type === 'display' && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded whitespace-nowrap">
                                          Chỉ hiển thị
                                        </span>
                                      )}
                                    </div>
                                    {/* Hiển thị dòng xe áp dụng */}
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {(() => {
                                        const list = normalizeDongXe(promotion.dongXe);
                                        return list.length > 0 ? (
                                          <>Áp dụng: {list.map(c => dongXeCodeToName[c] || c).join(', ')}</>
                                        ) : (
                                          <span className="text-amber-600">Chưa gán dòng xe (áp dụng tất cả)</span>
                                        );
                                      })()}
                                    </p>
                                    {promotion.createdAt && (
                                      <p className="text-xs text-gray-500">
                                        Tạo lúc: {new Date(promotion.createdAt).toLocaleString('vi-VN')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Add selected promotions button */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={addSelectedPromotions}
                          disabled={selectedPromotionIds.length === 0}
                          className={`w-full py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 ${selectedPromotionIds.length > 0
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Thêm {selectedPromotionIds.length} ưu đãi đã chọn</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-b-lg flex flex-col sm:flex-row justify-between items-center gap-3 sticky bottom-0 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Đã chọn: <span className="font-medium">{selectedPromotions.length}</span> ưu đãi
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        onClick={closeAddPromotionModal}
                        className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <X className="w-4 h-4" />
                        <span>Đóng</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Grid - 2x2 Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          {/* Customer Info Card */}
          <div className="bg-white rounded-xl shadow-md p-5 flex flex-col h-full">
            <h2 className="text-base font-bold text-gray-900 mb-5 pb-3 border-b-2 border-gray-200">
              Thông tin khách hàng & Giao dịch
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Họ tên khách hàng
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập họ tên"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Loại khách hàng
                </label>
                <select
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white cursor-pointer"
                >
                  <option value="ca_nhan">Cá nhân</option>
                  <option value="cong_ty">Công ty</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Loại sử dụng
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white cursor-pointer"
                >
                  <option value="khong_kinh_doanh">Không kinh doanh</option>
                  <option value="kinh_doanh">Kinh doanh</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Tỉnh/TP sau sát nhập
                </label>
                <select
                  value={provinceSatNhap}
                  onChange={(e) => setProvinceSatNhap(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white cursor-pointer"
                >
                  <option value="">-- Chọn tỉnh/thành --</option>
                  {provinces.map((province, idx) => (
                    <option key={idx} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Số tiền cọc
                </label>
                <CurrencyInput
                  value={depositAmount}
                  onChange={(val) => setDepositAmount(val)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập số tiền cọc"
                />
              </div>

              {/* Quà tặng & Phụ kiện */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Quà tặng & Phụ kiện
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="border-b border-r border-gray-300 px-2 py-1.5 text-left w-10">STT</th>
                        <th className="border-b border-r border-gray-300 px-2 py-1.5 text-left">Tên Quà Tặng & Phụ Kiện</th>
                        <th className="border-b border-gray-300 px-2 py-1.5 text-center w-28">Tặng/Giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gifts.map((gift, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border-b border-r border-gray-300 px-2 py-1 text-center">{index + 1}</td>
                          <td className="border-b border-r border-gray-300 px-1 py-1">
                            <input
                              type="text"
                              value={gift.name}
                              onChange={(e) => {
                                const newGifts = [...gifts];
                                newGifts[index].name = e.target.value;
                                setGifts(newGifts);
                              }}
                              className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-blue-500 rounded"
                              placeholder="Nhập tên quà tặng"
                            />
                          </td>
                          <td className="border-b border-gray-300 px-1 py-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={gift.price}
                                onChange={(e) => {
                                  const newGifts = [...gifts];
                                  newGifts[index].price = e.target.value;
                                  setGifts(newGifts);
                                }}
                                className="w-full px-2 py-1 border-0 focus:ring-1 focus:ring-blue-500 rounded text-center"
                                placeholder="Tặng"
                              />
                              <button
                                onClick={() => {
                                  const newGifts = gifts.filter((_, i) => i !== index);
                                  setGifts(newGifts);
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button
                    onClick={() => setGifts([...gifts, { name: '', price: 'Tặng' }])}
                    className="w-full py-2 text-red-600 hover:bg-red-50 flex items-center justify-center gap-1 border-t border-gray-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Configuration Card */}
          <div className="bg-white rounded-xl shadow-md p-5 flex flex-col h-full">
            {/* Car Image */}
            <div className="w-full aspect-[1.8] rounded-lg overflow-hidden mb-5 bg-gray-800 relative">
              <img
                src={carImageLoadError ? vf3Full : carImageUrl}
                alt="Ngoại thất"
                onError={() => setCarImageLoadError(true)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageFade ? 'opacity-0' : 'opacity-100'
                  }`}
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                Ngoại thất
              </div>
            </div>

            {/* Configuration Sections */}
            <div className="space-y-6">
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-3">1. Chọn mẫu xe</div>
                <select
                  value={carModel}
                  onChange={(e) => {
                    setCarModel(e.target.value);
                    setCarVersion('');
                    setExteriorColor('');
                    setInteriorColor('');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white cursor-pointer"
                >
                  {Object.keys(carModels).map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-600 mb-3">2. Chọn phiên bản</div>
                <div className="space-y-2">
                  {availableVersions.map((version) => {
                    // Get actual price for this version based on selected colors
                    let displayPrice = version.price_vnd;
                    if (carVersion === version.trim && exteriorColor && interiorColor) {
                      const actualPrice = getCarPrice();
                      if (actualPrice > 0) {
                        displayPrice = actualPrice;
                      }
                    }

                    return (
                      <label
                        key={version.trim}
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${carVersion === version.trim
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                          }`}
                      >
                        <input
                          type="radio"
                          name="carVersion"
                          value={version.trim}
                          checked={carVersion === version.trim}
                          onChange={(e) => setCarVersion(e.target.value)}
                          className="w-5 h-5 mr-3 text-blue-600"
                        />
                        <span className="flex-1 font-medium text-gray-700">{version.trim}</span>
                        <span className="text-blue-600 font-semibold">{formatCurrency(displayPrice)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-600 mb-3">3. Ngoại thất</div>
                <div className="flex gap-3 flex-wrap">
                  {availableExteriorColors.map((color) => (
                    <div
                      key={color.code}
                      onClick={() => handleExteriorColorChange(color.code)}
                      className={`rounded-xl cursor-pointer transition-all ${exteriorColor === color.code
                        ? 'border-blue-600 shadow-lg scale-105'
                        : 'border-transparent hover:scale-110'
                        }`}
                      style={{ width: '60px', height: '60px', borderWidth: '3px', borderStyle: 'solid' }}
                    >
                      <img
                        src={color.icon}
                        alt={color.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-600 mb-3">4. Nội thất</div>
                <div className="flex gap-3 flex-wrap">
                  {availableInteriorColors.map((color) => (
                    <div
                      key={color.code}
                      onClick={() => setInteriorColor(color.code)}
                      className={`rounded-xl cursor-pointer transition-all ${interiorColor === color.code
                        ? 'border-blue-600 shadow-lg scale-105'
                        : 'border-transparent hover:scale-110'
                        }`}
                      style={{ width: '60px', height: '60px', borderWidth: '3px', borderStyle: 'solid' }}
                    >
                      <img
                        src={color.icon}
                        alt={color.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-600 mb-3">5. Chọn nơi đăng ký biển số</div>
                <select
                  value={registrationLocation}
                  onChange={(e) => setRegistrationLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white cursor-pointer"
                >
                  <option value="hcm">TP. Hồ Chí Minh</option>
                  <option value="other">Tỉnh thành khác</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cost Estimation Card */}
          <div className="bg-white rounded-xl shadow-md p-5 flex flex-col h-full">
            <h2 className="text-base font-bold text-gray-900 mb-5 pb-3 border-b-2 border-gray-200">
              Dự toán chi phí cho {carModel} {carVersion}
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Giá xe (gồm VAT)</span>
                <span className="text-gray-900 font-semibold">{formatCurrency(calculations.basePrice)}</span>
              </div>

              <div className="my-4">
                <div className="text-sm font-medium text-gray-600">Chọn ưu đãi áp dụng {carModel && <span className="text-gray-500 font-normal">(chỉ ưu đãi cho {carModel})</span>}</div>
                <div className="space-y-2">
                  {selectedPromotionsForCurrentCar.length === 0 ? (
                    <div className="text-sm text-gray-500 py-2 text-center">
                      {selectedDongXe ? 'Chưa có ưu đãi nào áp dụng cho dòng xe này' : 'Chọn dòng xe để xem ưu đãi áp dụng'}
                    </div>
                  ) : (
                    selectedPromotionsForCurrentCar.map((promo) => (
                      <div key={promo.id} className="flex justify-between items-center py-3 border-b border-gray-200">
                        <label className="flex items-center gap-2 flex-1">
                          <input
                            type="checkbox"
                            checked={promo.isActive === true}
                            onChange={() => togglePromotionActive(promo.id)}
                            className="w-5 h-5 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{promo.name}</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-red-600`}>
                            {promo.isActive
                              ? (() => {
                                // Lấy value và type mới nhất từ promotions (Firebase) thay vì selectedPromotions (localStorage cũ)
                                const freshPromo = promotions.find(p => p.id === promo.id);
                                const value = freshPromo?.value ?? promo.value;
                                const type = freshPromo?.type ?? promo.type;
                                const discount = calculatePromotionDiscounts(calculations.basePrice, [{
                                  ...promo,
                                  value,
                                  type
                                }]);
                                return `-${formatCurrency(discount)}`;
                              })()
                              : '0 ₫'
                            }
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Giá sau ưu đãi</span>
                <span className="text-gray-900 font-semibold">
                  {formatCurrency(calculations.priceAfterBasicPromotions)}
                </span>
              </div>
              {selectedPromotionsForCurrentCar.length > 0 && (
                <div className="flex justify-between py-1 text-sm text-gray-600">
                  <span>Bao gồm ưu đãi:</span>
                  <span className="text-red-600">-{formatCurrency(calculations.promotionDiscounts || 0)}</span>
                </div>
              )}

              <div className="my-4 space-y-3">
                {/* Hỗ trợ lãi suất - nếu chọn thì không được hưởng VinClub */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <label className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={hoTroLaiSuat}
                      onChange={(e) => setHoTroLaiSuat(e.target.checked)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Hỗ trợ lãi suất (không áp dụng ưu đãi VinClub)</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Hạng thành viên VinClub</label>
                  <div className="flex gap-4 justify-between items-center">
                    <select
                      value={hoTroLaiSuat ? 'none' : vinClubVoucher}
                      onChange={(e) => setVinClubVoucher(e.target.value)}
                      disabled={hoTroLaiSuat}
                      className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${hoTroLaiSuat ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="none">Không áp dụng</option>
                      <option value="gold">Gold (0.5%)</option>
                      <option value="platinum">Platinum (1%)</option>
                      <option value="diamond">Diamond (1.5%)</option>
                    </select>
                    <div className={`font-semibold ${hoTroLaiSuat ? 'text-gray-400 line-through' : 'text-red-600'}`}>
                      {formatCurrency(hoTroLaiSuat ? 0 : calculations.vinClubDiscount)}
                    </div>
                  </div>
                  {hoTroLaiSuat && (
                    <p className="text-xs text-orange-600 mt-1">* KH tham gia CT hỗ trợ lãi suất không được hưởng ưu đãi này</p>
                  )}
                </div>

                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <label className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={convertCheckbox}
                      onChange={(e) => setConvertCheckbox(e.target.checked)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Xăng → Điện (áp dụng chi phí đổi)</span>
                  </label>
                  <span className="text-gray-900 font-semibold">
                    {formatCurrency(calculations.convertSupportDiscount)}
                  </span>
                </div>

                {(carModel === 'VF 3' || carModel === 'VF 5') && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <label className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={discountBhvc2}
                        onChange={(e) => setDiscountBhvc2(e.target.checked)}
                        className="w-5 h-5 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Quy đổi 2 năm bảo hiểm (BHVC)</span>
                    </label>
                    <span className="text-red-600 font-semibold">
                      -{formatCurrency(calculations.bhvc2Potential)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <label className="flex items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={discountPremiumColor}
                      onChange={(e) => setDiscountPremiumColor(e.target.checked)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Miễn Phí Màu Nâng Cao</span>
                  </label>
                  <span className="text-red-600 font-semibold">
                    -{formatCurrency(calculations.premiumColorPotential)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Giá xuất hóa đơn (Giá XHD)</span>
                <span className="text-gray-900 font-semibold">{formatCurrency(calculations.giaXuatHoaDon)}</span>
              </div>

              <div className="flex justify-between py-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Giá thanh toán thực tế</span>
                <span className="text-gray-900 font-semibold">{formatCurrency(calculations.finalPayable)}</span>
              </div>

              {/* Phase 7: Số tiền thanh toán đối ứng (chỉ hiển thị khi có vay) */}
              {loanToggle && (
                <>
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="text-gray-600">Tiền vay ngân hàng ({loanRatio}%)</span>
                    <span className="text-blue-600 font-semibold">{formatCurrency(Math.abs(calculations.tienVayTuGiaXHD || 0))}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-200 bg-green-50 -mx-4 px-4">
                    <span className="text-green-700 font-medium">Số tiền thanh toán (đối ứng)</span>
                    <span className="text-green-700 font-bold">{formatCurrency(calculations.soTienThanhToanDoiUng)}</span>
                  </div>
                </>
              )}

              <div className="mt-5">
                <div className="text-sm font-semibold text-gray-600 mb-3">Chi phí lăn bánh dự tính</div>
                <div className="space-y-3">
                  {/* Phí 01 năm BH Dân sự - Editable */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Phí 01 năm BH Dân sự</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formatCurrencyInput(isLiabilityInsuranceManual ? liabilityInsuranceValue : calculations.liabilityInsurance)}
                        onChange={(e) => {
                          const parsedValue = parseCurrencyInput(e.target.value);
                          setLiabilityInsuranceValue(Math.max(0, parsedValue));
                          setIsLiabilityInsuranceManual(true);
                        }}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right font-semibold"
                        placeholder="0"
                      />
                      <button
                        onClick={() => {
                          setIsLiabilityInsuranceManual(false);
                          setLiabilityInsuranceValue(0);
                        }}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded border border-gray-300 transition-colors"
                        title="Tính lại tự động"
                      >
                        ↻
                      </button>
                    </div>
                  </div>
                  {/* Phí biển số - Editable */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">
                      Phí biển số ({calculations.plateFeeData?.ten_khu_vuc || 'N/A'})
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formatCurrencyInput(isPlateFeeManual ? plateFeeValue : calculations.plateFee)}
                        onChange={(e) => {
                          const parsedValue = parseCurrencyInput(e.target.value);
                          setPlateFeeValue(Math.max(0, parsedValue));
                          setIsPlateFeeManual(true);
                        }}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right font-semibold"
                        placeholder="0"
                      />
                      <button
                        onClick={() => {
                          setIsPlateFeeManual(false);
                          setPlateFeeValue(0);
                        }}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded border border-gray-300 transition-colors"
                        title="Tính lại tự động"
                      >
                        ↻
                      </button>
                    </div>
                  </div>
                  {/* Phí kiểm định - Editable */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Phí kiểm định</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formatCurrencyInput(isInspectionFeeManual ? inspectionFeeValue : calculations.inspectionFee)}
                        onChange={(e) => {
                          const parsedValue = parseCurrencyInput(e.target.value);
                          setInspectionFeeValue(Math.max(0, parsedValue));
                          setIsInspectionFeeManual(true);
                        }}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right font-semibold"
                        placeholder="0"
                      />
                      <button
                        onClick={() => {
                          setIsInspectionFeeManual(false);
                          setInspectionFeeValue(0);
                        }}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded border border-gray-300 transition-colors"
                        title="Tính lại tự động"
                      >
                        ↻
                      </button>
                    </div>
                  </div>
                  {/* Phí bảo trì đường bộ - Editable */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Phí bảo trì đường bộ</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formatCurrencyInput(isRoadFeeManual ? roadFeeValue : calculations.roadFee)}
                        onChange={(e) => {
                          const parsedValue = parseCurrencyInput(e.target.value);
                          setRoadFeeValue(Math.max(0, parsedValue));
                          setIsRoadFeeManual(true);
                        }}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right font-semibold"
                        placeholder="0"
                      />
                      <button
                        onClick={() => {
                          setIsRoadFeeManual(false);
                          setRoadFeeValue(0);
                        }}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded border border-gray-300 transition-colors"
                        title="Tính lại tự động"
                      >
                        ↻
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Phí dịch vụ</span>
                    <input
                      type="text"
                      value={formatCurrencyInput(registrationFee)}
                      onChange={(e) => {
                        const parsedValue = parseCurrencyInput(e.target.value);
                        if (isSafeCurrency(parsedValue)) {
                          setRegistrationFee(parsedValue);
                        }
                      }}
                      className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right font-semibold"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">BHVC bao gồm Pin</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={formatCurrencyInput(isBodyInsuranceManual ? bodyInsuranceFee : calculations.bodyInsurance)}
                        onChange={(e) => {
                          const parsedValue = parseCurrencyInput(e.target.value);
                          if (isSafeCurrency(parsedValue)) {
                            setBodyInsuranceFee(parsedValue);
                            setIsBodyInsuranceManual(true);
                          }
                        }}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right font-semibold"
                        placeholder="0"
                      />
                      <button
                        onClick={() => {
                          setIsBodyInsuranceManual(false); // Reset về chế độ tự động
                          // BHVC tính trên Giá XHD
                          const calculatedBodyInsurance = Math.round(calculations.giaXuatHoaDon * 0.014);
                          setBodyInsuranceFee(calculatedBodyInsurance);
                        }}
                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded border border-gray-300 transition-colors"
                        title="Tính lại tự động"
                      >
                        ↻
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between py-4 mt-4 border-t-2 border-gray-200">
                <span className="text-xl font-bold text-blue-600">TỔNG CHI PHÍ</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(calculations.totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Loan Options Card */}
          <div className="bg-white rounded-xl shadow-md p-5 flex flex-col h-full">
            <h2 className="text-base font-bold text-gray-900 mb-5">Tùy chọn & Chi tiết trả góp</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Vay mua xe trả góp</span>
                <label className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={loanToggle}
                    onChange={(e) => setLoanToggle(e.target.checked)}
                    className="opacity-0 w-0 h-0"
                  />
                  <span
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors ${loanToggle ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                  >
                    <span
                      className={`absolute h-4 w-4 rounded-full bg-white top-1 transition-transform ${loanToggle ? 'translate-x-6 left-1' : 'left-1'
                        }`}
                    />
                  </span>
                </label>
              </div>

              {loanToggle && (
                <>
                  <div className="flex items-center gap-3 py-4 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700 flex-shrink-0">Tỷ lệ vay</span>
                    <div className="flex-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={loanRatio}
                        onChange={(e) => setLoanRatio(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={loanRatio}
                      onChange={(e) => setLoanRatio(Math.max(0, Math.min(100, Number(e.target.value))))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-lg"
                    />
                    <span className="text-sm font-semibold text-blue-600 min-w-[120px] text-right">
                      {loanRatio}% giá trị xe
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-4 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Thời hạn vay</span>
                    <select
                      value={loanTerm}
                      onChange={(e) => setLoanTerm(Number(e.target.value))}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white cursor-pointer max-w-[200px]"
                    >
                      <option value="12">12 tháng</option>
                      <option value="24">24 tháng</option>
                      <option value="36">36 tháng</option>
                      <option value="48">48 tháng</option>
                      <option value="60">60 tháng (5 năm)</option>
                      <option value="72">72 tháng</option>
                      <option value="84">84 tháng (7 năm)</option>
                      <option value="96">96 tháng (8 năm)</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center py-4 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Lãi suất ngân hàng</span>
                    <input
                      type="number"
                      value={customInterestRate}
                      onChange={(e) => setCustomInterestRate(e.target.value)}
                      placeholder="Lãi suất (%)"
                      min="0"
                      step="0.01"
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="mt-5 pt-5 border-t-2 border-gray-200">
                    <div className="text-sm font-semibold text-gray-600 mb-3">Chi tiết trả góp dự tính</div>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Số tiền trả trước</span>
                        <span className="text-gray-900 font-semibold">
                          {formatCurrency(calculations.loanData.downPayment)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Số tiền vay</span>
                        <span className="text-gray-900 font-semibold">
                          {formatCurrency(calculations.loanData.loanAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Tổng lãi phải trả</span>
                        <span className="text-gray-900 font-semibold">
                          {formatCurrency(calculations.loanData.totalInterest)}
                        </span>
                      </div>
                      <div className="flex justify-between py-4 mt-4 border-t-2 border-gray-200">
                        <span className="text-xl font-bold text-blue-600">Gốc & lãi hàng tháng</span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatCurrency(calculations.loanData.monthlyPayment)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={collectInvoiceData}
            className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
          >
            In Báo Giá 2
          </button>
          <button
            onClick={saveToHomepage}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Báo giá trang chủ
          </button>
          <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition">
            Gửi Email Báo Giá
          </button>
        </div>
      </div >
    </div >
  );
}
