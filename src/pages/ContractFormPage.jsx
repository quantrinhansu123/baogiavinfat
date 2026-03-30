import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ref, update, push, get, set, remove } from 'firebase/database';
import { database } from '../firebase/config';
import { X, Check, ArrowLeft, ChevronDown, Search, Gift } from 'lucide-react';
import { toast } from 'react-toastify';
import { carPriceData as staticCarPriceData, uniqueNgoaiThatColors, uniqueNoiThatColors, getAvailableDongXeForPromotion } from '../data/calculatorData';
import { useCarPriceData } from '../contexts/CarPriceDataContext';
import { getAllBranches, getBranchByShowroomName } from '../data/branchData';
import { loadPromotionsFromFirebase, defaultPromotions, filterPromotionsByDongXe, normalizeDongXe } from '../data/promotionsData';
import CurrencyInput from '../components/shared/CurrencyInput';
import { generateVSO } from '../utils/vsoGenerator';
import { isValidCCCD, isValidPhone, validateRequiredFields } from '../utils/validation';
import { sanitizeContractData } from '../utils/sanitize';
import { validateContract, normalizeContract } from '../utils/contract-data-validation-normalizer';

export default function ContractFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const contractData = location.state?.contract || null;
  const mode = location.state?.mode || (contractData ? 'edit' : 'create'); // 'create', 'edit', or 'details'
  const isEditMode = mode === 'edit';
  const isDetailsMode = mode === 'details';
  const isCreateMode = mode === 'create';

  const { carPriceData: carPriceDataFromContext } = useCarPriceData();
  const carPriceData = Array.isArray(carPriceDataFromContext) && carPriceDataFromContext.length > 0 ? carPriceDataFromContext : staticCarPriceData;
  const modelToDongXeMapFromData = useMemo(() => {
    const list = getAvailableDongXeForPromotion(carPriceData);
    return Object.fromEntries(list.map((x) => [x.name, x.code]));
  }, [carPriceData]);

  const dongXeToModelMapFromData = useMemo(() => {
    const list = getAvailableDongXeForPromotion(carPriceData);
    return Object.fromEntries(list.map((x) => [x.code, x.name]));
  }, [carPriceData]);

  // Get all branches for showroom dropdown
  const branches = getAllBranches();

  // List of issue places (nơi cấp)
  const issuePlaces = [
    "Bộ Công An",
    "Cục trưởng cục cảnh sát quản lý hành chính về trật tự xã hội"
  ];

  // State for employees list
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerKey, setSelectedCustomerKey] = useState('');

  // Load customers from Firebase
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const customersRef = ref(database, 'customers');
        const snapshot = await get(customersRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const customersList = Object.entries(data || {}).map(([key, customer]) => ({
            firebaseKey: key,
            ...customer,
          }));

          customersList.sort((a, b) => {
            const nameA = (a.tenKhachHang || '').toLowerCase();
            const nameB = (b.tenKhachHang || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });

          setCustomers(customersList);
        } else {
          setCustomers([]);
        }
      } catch (error) {
        console.error('Error loading customers:', error);
        setCustomers([]);
      }
    };

    loadCustomers();
  }, []);

  const mapContractValue = (value, customer) => {
    if (value) return value;
    if (!customer) return '';
    return (
      customer.customerName ||
      customer.tenKhachHang ||
      customer.phone ||
      customer.email ||
      customer.address ||
      customer.cccd ||
      ''
    );
  };

  // Load employees from Firebase
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const employeesRef = ref(database, 'employees');
        const snapshot = await get(employeesRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const employeesList = Object.values(data)
            .map((emp) => ({
              id: emp.id || '',
              TVBH: emp.TVBH || emp['TVBH'] || '',
            }))
            .filter((emp) => emp.TVBH) // Only include employees with TVBH
            .sort((a, b) => a.TVBH.localeCompare(b.TVBH)); // Sort by name

          setEmployees(employeesList);
        }
      } catch (err) {
        console.error('Error loading employees:', err);
      }
    };

    loadEmployees();
  }, []);

  const [contract, setContract] = useState({
    id: null,
    createdAt: new Date().toISOString().split("T")[0],
    tvbh: "",
    showroom: "",
    vso: "",
    customerName: "",
    phone: "",
    email: "",
    address: "",
    cccd: "",
    issueDate: "",
    issuePlace: "",
    model: "",
    variant: "",
    exterior: "",
    interior: "",
    contractPrice: "",
    deposit: "",
    tienDoiUng: "",
    payment: "",
    loanAmount: "",
    bank: "",
    uuDai: [],
    quaTang: "",
    quaTangKhac: "",
    soTienVay: "",
    soTienPhaiThu: "",
    status: "mới",
    khachHangLa: '',
    msdn: '',
    daiDien: '',
    chucVu: '',
    giayUyQuyen: '',
    giayUyQuyenNgay: '',
  });

  // List of all available promotions - loaded from Firebase but not shown directly in dropdown
  const [allPromotions, setAllPromotions] = useState([]);
  // Only promotions that have been selected and added will be shown in the dropdown
  const [selectedPromotions, setSelectedPromotions] = useState([]);

  // Load promotions from Firebase on component mount
  useEffect(() => {
    const loadPromotions = async () => {
      try {
        let promotionsList = await loadPromotionsFromFirebase();
        if (!promotionsList || promotionsList.length === 0) {
          promotionsList = defaultPromotions;
        }
        
        setAllPromotions(promotionsList);
        
        // If there are promotions in the contract, add them to selected promotions
        if (contract.uuDai && contract.uuDai.length > 0) {
          const selected = [];
          contract.uuDai.forEach(promoName => {
            const found = promotionsList.find(p => p.name === promoName);
            if (found) {
              selected.push(found);
            }
          });
          setSelectedPromotions(selected);
        } else {
          setSelectedPromotions([]);
        }
      } catch (err) {
        console.error('Error loading promotions:', err);
        setAllPromotions(defaultPromotions);
        setSelectedPromotions([]);
      }
    };
    
    // Only load promotions if we don't have any loaded yet
    if (allPromotions.length === 0) {
      loadPromotions();
    } else if (contract.uuDai && contract.uuDai.length > 0 && selectedPromotions.length === 0) {
      // If we have promotions but no selected ones, try to sync with contract.uuDai
      const selected = [];
      contract.uuDai.forEach(promoName => {
        const found = allPromotions.find(p => p.name === promoName);
        if (found) {
          selected.push(found);
        }
      });
      setSelectedPromotions(selected);
    }
  }, [contract.uuDai, allPromotions]);

  // State for dropdown visibility
  const [isUuDaiDropdownOpen, setIsUuDaiDropdownOpen] = useState(false);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [promotionSearch, setPromotionSearch] = useState('');
  const [dropdownDirection, setDropdownDirection] = useState('down'); // 'down' or 'up'
  const [selectedPromotionIds, setSelectedPromotionIds] = useState(new Set());
  
  // Update selected promotion IDs when selectedPromotions changes
  useEffect(() => {
    if (selectedPromotions && selectedPromotions.length > 0) {
      const ids = new Set(selectedPromotions.map(p => p.id));
      setSelectedPromotionIds(ids);
    } else {
      setSelectedPromotionIds(new Set());
    }
  }, [selectedPromotions]);

  useEffect(() => {
    if (contractData) {
      // Helper to map color name to code for dropdown compatibility
      const mapExteriorColor = (colorValue) => {
        if (!colorValue) return "";
        // Check if it's already a code
        const foundByCode = uniqueNgoaiThatColors.find(c => c.code === colorValue);
        if (foundByCode) return colorValue;
        // Check if it's a name
        const foundByName = uniqueNgoaiThatColors.find(
          c => c.name.toLowerCase() === colorValue.toLowerCase()
        );
        return foundByName ? foundByName.code : colorValue;
      };

      const mapInteriorColor = (colorValue) => {
        if (!colorValue) return "";
        // Check if it's already a code
        const foundByCode = uniqueNoiThatColors.find(c => c.code === colorValue);
        if (foundByCode) return colorValue;
        // Check if it's a name
        const foundByName = uniqueNoiThatColors.find(
          c => c.name.toLowerCase() === colorValue.toLowerCase()
        );
        return foundByName ? foundByName.code : colorValue;
      };

      // Helper to map showroom name to branch full name
      const mapShowroom = (showroomValue) => {
        if (!showroomValue) return "";
        // Try to find branch by showroom name
        const foundBranch = getBranchByShowroomName(showroomValue);
        if (foundBranch) {
          return foundBranch.name; // Use full name for form
        }
        // If not found, check if it matches any branch shortName or name
        const exactMatch = branches.find(
          (branch) =>
            branch.shortName.toLowerCase() === showroomValue.toLowerCase() ||
            branch.name.toLowerCase() === showroomValue.toLowerCase()
        );
        return exactMatch ? exactMatch.name : showroomValue; // Return original if no match
      };

      // Helper to parse uuDai safely (do not split by comma)
      const parseUuDai = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) {
          return value
            .map((item) => String(item || "").trim())
            .filter(Boolean);
        }
        if (typeof value === 'string') {
          const normalized = value.replace(/\r\n/g, '\n').trim();
          if (!normalized) return [];
          const splitLegacyByProgramPrefix = (text) =>
            text
              .split(
                /,\s*(?=(?:-?\s*CTKM:|Chương trình|CHƯƠNG TRÌNH|Ưu đãi|ƯU ĐÃI))/i
              )
              .map((item) => item.replace(/^-CTKM:\s*/i, '').trim())
              .filter(Boolean);

          // Try to parse as JSON array first
          try {
            const parsed = JSON.parse(normalized);
            if (Array.isArray(parsed)) {
              return parsed
                .map((item) => String(item || "").trim())
                .filter(Boolean);
            }
          } catch (e) {
            // Not JSON: support newline list or -CTKM: markers, and keep comma as normal character
            if (normalized.includes('\n')) {
              return normalized
                .split('\n')
                .map(v => v.replace(/^-CTKM:\s*/i, '').trim())
                .filter(Boolean);
            }
            if (normalized.includes('-CTKM:')) {
              return normalized
                .split(/-CTKM:\s*/i)
                .map(v => v.trim())
                .filter(Boolean);
            }
            const legacyParts = splitLegacyByProgramPrefix(normalized);
            if (legacyParts.length > 1) return legacyParts;
            return [normalized];
          }
        }
        return [];
      };

      // Map contract data for editing
      console.log("Loading contract data for editing:", contractData);
      console.log("Loan amount from contractData:", contractData.loanAmount, contractData.soTienVay, contractData.tienVay);
      
      setContract({
        id: contractData.id || null,
        createdAt: contractData.createdAt || contractData.createdDate || new Date().toISOString().split("T")[0],
        tvbh: contractData.tvbh || contractData.TVBH || "",
        showroom: mapShowroom(contractData.showroom || ""),
        vso: contractData.vso || "",
        customerName: contractData.customerName || contractData["Tên KH"] || "",
        phone: contractData.phone || "",
        email: contractData.email || "",
        address: contractData.address || "",
        cccd: contractData.cccd || "",
        issueDate: contractData.issueDate || contractData.ngayCap || "",
        issuePlace: contractData.issuePlace || contractData.noiCap || "",
        model: contractData.model || contractData.dongXe || "",
        variant: contractData.variant || contractData.phienBan || "",
        exterior: mapExteriorColor(contractData.exterior || contractData.ngoaiThat || ""),
        interior: mapInteriorColor(contractData.interior || contractData.noiThat || ""),
        contractPrice: contractData.contractPrice || contractData.giaHD || "",
        deposit: contractData.deposit || contractData.soTienCoc || "",
        tienDoiUng: contractData.tienDoiUng || contractData["Tiền đối ứng"] || contractData.convertSupportDiscount || "",
        payment: contractData.payment || contractData.thanhToan || "",
        loanAmount: contractData.loanAmount || contractData.soTienVay || contractData.tienVay || "",
        bank: contractData.bank || contractData.nganHang || "",
        uuDai: parseUuDai(contractData.uuDai || contractData["Ưu đãi"] || contractData["ưu đãi"] || ""),
        quaTang: contractData.quaTang || contractData["Quà tặng"] || contractData["quà tặng"] || "",
        quaTangKhac: contractData.quaTangKhac || contractData["Quà tặng khác"] || contractData["quà tặng khác"] || "",
        soTienVay: contractData.soTienVay || contractData["Số tiền vay"] || "",
        soTienPhaiThu: contractData.soTienPhaiThu || contractData["Số tiền phải thu"] || contractData.giamGia || contractData["Giảm giá"] || "",
        status: contractData.status || contractData.trangThai || "mới",
        khachHangLa: contractData.khachHangLa || '',
        msdn: contractData.msdn || '',
        daiDien: contractData.daiDien || '',
        chucVu: contractData.chucVu || '',
        giayUyQuyen: contractData.giayUyQuyen || '',
        giayUyQuyenNgay: contractData.giayUyQuyenNgay || '',
        congTy: contractData.congTy || '',
        congTyDiaChi: contractData.congTyDiaChi || '',
        congTyMST: contractData.congTyMST || '',
        congTySDT: contractData.congTySDT || '',
        congTyEmail: contractData.congTyEmail || '',
      });
    }
  }, [contractData]);

  // Close dropdown when clicking outside
  const dropdownRef = useRef(null);
  const dropdownButtonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUuDaiDropdownOpen(false);
      }
    };

    if (isUuDaiDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);

      // Calculate dropdown direction based on available space
      if (dropdownButtonRef.current) {
        const buttonRect = dropdownButtonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        const estimatedDropdownHeight = 240; // max-h-60 = 240px

        // Show dropdown above if not enough space below but enough space above
        if (spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow) {
          setDropdownDirection('up');
        } else {
          setDropdownDirection('down');
        }
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUuDaiDropdownOpen]);

  // Get unique car models from carPriceData (từ Firebase khi có, gồm dòng xe mới thêm ở quản trị bảng giá)
  const carModels = useMemo(() => {
    const uniqueModels = new Set();
    carPriceData.forEach((car) => {
      if (car.model) uniqueModels.add(car.model);
    });

    const modelOrder = ['VF 3', 'VF 5', 'VF 6', 'VF 7', 'VF 8', 'VF 9', 'Minio', 'Herio', 'Nerio', 'Limo', 'EC', 'EC Nâng Cao'];

    return Array.from(uniqueModels).sort((a, b) => {
      const indexA = modelOrder.indexOf(a);
      const indexB = modelOrder.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [carPriceData]);

  // Get available trims (variants) for selected model
  const availableTrims = useMemo(() => {
    if (!contract.model) return [];
    const trims = new Set();
    carPriceData.forEach((car) => {
      if (car.model === contract.model && car.trim) {
        trims.add(car.trim);
      }
    });
    return Array.from(trims).sort();
  }, [contract.model]);

  // Get available exterior colors for selected model and trim
  const availableExteriorColors = useMemo(() => {
    if (!contract.model || !contract.variant) return [];
    const colorCodes = new Set();
    carPriceData.forEach((car) => {
      if (car.model === contract.model && car.trim === contract.variant && car.exterior_color) {
        colorCodes.add(car.exterior_color);
      }
    });
    return uniqueNgoaiThatColors.filter((color) => colorCodes.has(color.code));
  }, [contract.model, contract.variant]);

  // Get available interior colors for selected model and trim
  const availableInteriorColors = useMemo(() => {
    if (!contract.model || !contract.variant) return [];
    const colorCodes = new Set();
    carPriceData.forEach((car) => {
      if (car.model === contract.model && car.trim === contract.variant && car.interior_color) {
        colorCodes.add(car.interior_color);
      }
    });
    return uniqueNoiThatColors.filter((color) => colorCodes.has(color.code));
  }, [contract.model, contract.variant]);

  // Helper function to map color name to code
  const mapColorNameToCode = (colorName, isExterior = true) => {
    if (!colorName) return '';
    const colorList = isExterior ? uniqueNgoaiThatColors : uniqueNoiThatColors;
    const found = colorList.find(
      (color) => color.name.toLowerCase() === colorName.toLowerCase()
    );
    return found ? found.code : colorName; // Return code if found, otherwise return original value
  };

  // Helper function to map color code to name (for display)
  const mapColorCodeToName = (colorCode, isExterior = true) => {
    if (!colorCode) return '';
    const colorList = isExterior ? uniqueNgoaiThatColors : uniqueNoiThatColors;
    const found = colorList.find(
      (color) => color.code === colorCode
    );
    return found ? found.name : colorCode; // Return name if found, otherwise return original value
  };

  // Format currency for display (add thousand separators)
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '0';
    return new Intl.NumberFormat('vi-VN').format(Number(value));
  };

  // Parse currency input (remove thousand separators)
  const parseCurrency = (value) => {
    // Remove all non-digit characters
    return String(value).replace(/\D/g, '');
  };

  const handleInputChange = async (field, value) => {
    // Normalize null/undefined to empty string
    const normalized = value === null || value === undefined ? '' : value;

    // Auto-generate VSO when showroom changes
    if (field === 'showroom' && normalized) {
      const selectedBranch = branches.find(b => b.name === normalized);
      if (selectedBranch) {
        try {
          const newVSO = await generateVSO(selectedBranch.maDms);
          setContract((prev) => ({
            ...prev,
            showroom: normalized,
            vso: newVSO,
          }));
          return;
        } catch (error) {
          console.error('Error generating VSO:', error);
          // Fallback to maDms if generation fails
          setContract((prev) => ({
            ...prev,
            showroom: normalized,
            vso: selectedBranch.maDms,
          }));
          return;
        }
      }
    }

    setContract((prev) => {
      const updated = {
        ...prev,
        [field]: normalized,
      };

      // Reset dependent fields when model changes (but keep contractPrice)
      if (field === 'model') {
        updated.variant = '';
        updated.exterior = '';
        updated.interior = '';
      }

      // Reset dependent fields when variant changes (but keep contractPrice)
      if (field === 'variant') {
        updated.exterior = '';
        updated.interior = '';
      }

      // Reset dependent fields when exterior changes (but keep contractPrice)
      if (field === 'exterior') {
        updated.interior = '';
      }

      return updated;
    });
  };

  // Helper to normalize date values
  const normalizeDateInputValue = (value) => {
    if (!value) return '';
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    const str = String(value).trim();
    if (!str) return '';

    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        if (day && month && year) {
          const dd = day.padStart(2, '0');
          const mm = month.padStart(2, '0');
          const yyyy = year.length === 2 ? `20${year}` : year.padStart(4, '0');
          return `${yyyy}-${mm}-${dd}`;
        }
      }
    }

    return str;
  };

  const handleCustomerSelect = (customerKey) => {
    setSelectedCustomerKey(customerKey);
    const selected = customers.find((customer) => customer.firebaseKey === customerKey);

    if (!selected) return;

    const issueDate = selected.issueDate || selected.ngayCap || '';

    const formattedIssueDate = issueDate && issueDate.includes('/')
      ? (() => {
        const [day, month, year] = issueDate.split('/');
        if (day && month && year) {
          const dd = day.padStart(2, '0');
          const mm = month.padStart(2, '0');
          const yyyy = year.length === 2 ? `20${year}` : year.padStart(4, '0');
          return `${yyyy}-${mm}-${dd}`;
        }
        return issueDate;
      })()
      : issueDate;

    handleInputChange('customerName', selected.tenKhachHang || '');
    handleInputChange('phone', selected.soDienThoai || '');
    handleInputChange('email', selected.email || '');
    handleInputChange('address', selected.diaChi || selected.address || '');
    handleInputChange('cccd', selected.cccd || '');
    handleInputChange('issueDate', formattedIssueDate);
    handleInputChange('issuePlace', selected.noiCap || '');
    handleInputChange('model', selected.dongXe || '');
    handleInputChange('variant', selected.phienBan || '');
    handleInputChange('exterior', selected.mauSac || selected.ngoaiThat || '');
    handleInputChange('payment', selected.thanhToan || '');
    handleInputChange('bank', selected.nganHang || '');

    if (selected.mauSacTrong || selected.noiThat) {
      handleInputChange('interior', selected.mauSacTrong || selected.noiThat || '');
    }

    if (selected.thanhToan) {
      handleInputChange('payment', selected.thanhToan);
    }

    if (selected.soTienVay || selected.tienVay || selected.loanAmount) {
      handleInputChange('loanAmount', selected.soTienVay || selected.tienVay || selected.loanAmount || '');
    }

    if (selected.tvbh) {
      handleInputChange('tvbh', selected.tvbh);
    }

    // Populate customer type and company fields if available
    handleInputChange('khachHangLa', selected.khachHangLa || '');
    if (selected.khachHangLa === 'Công ty') {
      handleInputChange('msdn', selected.msdn || '');
      handleInputChange('daiDien', selected.daiDien || '');
      handleInputChange('chucVu', selected.chucVu || '');
      handleInputChange('giayUyQuyen', selected.giayUyQuyen || '');
      handleInputChange('giayUyQuyenNgay', normalizeDateInputValue(selected.giayUyQuyenNgay || ''));
    } else {
      // Clear company fields if not a company
      handleInputChange('msdn', '');
      handleInputChange('daiDien', '');
      handleInputChange('chucVu', '');
      handleInputChange('giayUyQuyen', '');
      handleInputChange('giayUyQuyenNgay', '');
    }
  };

  // Handle currency input change (format on display, store raw number)
  const handleCurrencyChange = (field, value) => {
    // Parse the input to get raw number
    const rawValue = parseCurrency(value);
    // Update state with raw number
    handleInputChange(field, rawValue);
  };

  // Handle adding selected promotions from modal
  const handleAddPromotions = (promotions) => {
    setSelectedPromotions(promotions);
    // Update the contract form with the selected promotion names
    setContract(prev => ({
      ...prev,
      uuDai: promotions.map(p => p.name)
    }));
  };

  const handleSubmit = async () => {
    // Required fields validation
    const requiredFields = ['customerName', 'phone', 'cccd', 'address', 'model'];
    const validation = validateRequiredFields(contract, requiredFields);

    if (!validation.valid) {
      const fieldNames = {
        customerName: 'Tên khách hàng',
        phone: 'Số điện thoại',
        cccd: 'CCCD',
        address: 'Địa chỉ',
        model: 'Dòng xe'
      };
      const missingNames = validation.missing.map(f => fieldNames[f] || f);
      toast.error(`Vui lòng điền: ${missingNames.join(', ')}`);
      return;
    }

    // CCCD format validation (12 digits)
    if (contract.cccd && !isValidCCCD(contract.cccd)) {
      toast.error('CCCD không hợp lệ. Vui lòng nhập đúng 12 chữ số.');
      return;
    }

    // Phone format validation (VN format)
    if (!isValidPhone(contract.phone)) {
      toast.error('Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng VN.');
      return;
    }

    // Validate contract data using validation utility
    const contractValidation = validateContract(contract);
    if (!contractValidation.isValid) {
      toast.error(`Dữ liệu không hợp lệ: ${contractValidation.errors.join(', ')}`);
      return;
    }

    // Normalize contract data before saving
    const normalizedContract = normalizeContract(contract);

    try {
      const safeValue = (val) => val !== undefined && val !== null ? val : "";

      // Helper to parse currency value
      const parseCurrency = (val) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const num = parseInt(val.replace(/[^\d]/g, ''), 10);
          return isNaN(num) ? 0 : num;
        }
        return 0;
      };

      // Auto-calculate tiền đối ứng = Giá hợp đồng - Số tiền vay
      const parseValue = (val) => {
        if (!val) return 0;
        if (typeof val === "string") {
          return parseFloat(val.replace(/[^\d]/g, "")) || 0;
        }
        return typeof val === "number" ? val : 0;
      };

      const contractPriceNum = parseValue(normalizedContract.contractPrice);
      const loanAmountNum = parseValue(normalizedContract.loanAmount);
      let calculatedTienDoiUng = normalizedContract.tienDoiUng;

      // Nếu có giá hợp đồng và số tiền vay, tự động tính tiền đối ứng
      if (contractPriceNum > 0 && loanAmountNum > 0) {
        const tienDoiUngNum = contractPriceNum - loanAmountNum;
        calculatedTienDoiUng = tienDoiUngNum > 0 ? tienDoiUngNum.toString() : "0";
      } else if (contractPriceNum > 0 && (normalizedContract.payment === "trả thẳng" || normalizedContract.payment === "tra thang")) {
        // Nếu trả thẳng (không vay), tiền đối ứng = giá hợp đồng
        calculatedTienDoiUng = contractPriceNum.toString();
      }

      if (isEditMode && contractData.firebaseKey) {
        // Get old status to check if we need to sync with exportedContracts
        const oldStatus = contractData.status || contractData.trangThai || "";
        const newStatus = safeValue(normalizedContract.status) || "mới";
        const oldStatusLower = oldStatus.toLowerCase();
        const newStatusLower = newStatus.toLowerCase();

        // Update existing contract
        const contractRef = ref(database, `contracts/${contractData.firebaseKey}`);
        const updateData = {
          id: normalizedContract.id || "",
          createdDate: normalizedContract.createdAt || normalizedContract.createdDate || "",
          tvbh: safeValue(normalizedContract.tvbh),
          showroom: safeValue(normalizedContract.showroom),
          vso: safeValue(normalizedContract.vso),
          customerName: safeValue(normalizedContract.customerName),
          phone: safeValue(normalizedContract.phone),
          email: safeValue(normalizedContract.email),
          address: safeValue(normalizedContract.address),
          cccd: safeValue(normalizedContract.cccd),
          ngayCap: safeValue(normalizedContract.issueDate),
          noiCap: safeValue(normalizedContract.issuePlace),
          dongXe: safeValue(normalizedContract.model),
          phienBan: safeValue(normalizedContract.variant),
          ngoaiThat: safeValue(normalizedContract.exterior),
          noiThat: safeValue(normalizedContract.interior),
          giaHD: normalizedContract.contractPrice,
          soTienCoc: normalizedContract.deposit,
          tienDoiUng: parseCurrency(calculatedTienDoiUng),
          "Tiền đối ứng": parseCurrency(calculatedTienDoiUng),
          thanhToan: normalizedContract.payment,
          soTienVay: normalizedContract.loanAmount,
          nganHang: safeValue(normalizedContract.bank),
          uuDai: Array.isArray(normalizedContract.uuDai) ? normalizedContract.uuDai : [],
          quaTang: safeValue(normalizedContract.quaTang),
          quaTangKhac: safeValue(normalizedContract.quaTangKhac),
          soTienPhaiThu: normalizedContract.soTienPhaiThu,
          trangThai: newStatus,
          // Company fields
          khachHangLa: safeValue(normalizedContract.khachHangLa),
          msdn: safeValue(normalizedContract.msdn),
          daiDien: safeValue(normalizedContract.daiDien),
          chucVu: safeValue(normalizedContract.chucVu),
          giayUyQuyen: safeValue(normalizedContract.giayUyQuyen),
          giayUyQuyenNgay: safeValue(normalizedContract.giayUyQuyenNgay),
        };

        console.log("Update data being sent to Firebase:", updateData);
        console.log("Loan amount in update data:", updateData.soTienVay);

        // Sanitize data before Firebase write
        const sanitizedUpdateData = sanitizeContractData(updateData);
        await update(contractRef, sanitizedUpdateData);

        // Sync with exportedContracts based on status change
        const exportKey = contractData.firebaseKey;
        const exportedContractRef = ref(database, `exportedContracts/${exportKey}`);

        // If changing from non-"xuất" to "xuất": add to exportedContracts
        if (oldStatusLower !== "xuất" && newStatusLower === "xuất") {
          // Get current date/time in format YYYY-MM-DD
          const now = new Date();
          const ngayXhd = now.toISOString().split("T")[0];

          // Map contract data to exported format (matching HopDongDaXuat format)
          const exportedData = {
            id: safeValue(normalizedContract.id),
            stt: safeValue(contractData.stt),
            "ngày xhd": ngayXhd, // Export date - now
            tvbh: safeValue(normalizedContract.tvbh),
            showroom: safeValue(normalizedContract.showroom),
            VSO: safeValue(normalizedContract.vso),
            "Tên Kh": safeValue(normalizedContract.customerName),
            "Số Điện Thoại": safeValue(normalizedContract.phone),
            Email: safeValue(normalizedContract.email || ""),
            "Địa Chỉ": safeValue(normalizedContract.address || ""),
            CCCD: safeValue(normalizedContract.cccd),
            "Ngày Cấp": safeValue(normalizedContract.issueDate),
            "Nơi Cấp": safeValue(normalizedContract.issuePlace),
            "Dòng xe": safeValue(normalizedContract.model),
            "Phiên Bản": safeValue(normalizedContract.variant),
            "Ngoại Thất": safeValue(normalizedContract.exterior),
            "Nội Thất": safeValue(normalizedContract.interior),
            "Giá Niêm Yết": normalizedContract.contractPrice,
            "Giá Giảm": normalizedContract.giamGia || 0,
            "Giá Hợp Đồng": normalizedContract.contractPrice,
            "Tiền đặt cọc": normalizedContract.deposit,
            tienDatCoc: normalizedContract.deposit,
            "Tiền đối ứng": parseCurrency(calculatedTienDoiUng),
            tienDoiUng: parseCurrency(calculatedTienDoiUng),
            "Số Khung": safeValue(contractData.soKhung || contractData.chassisNumber || contractData["Số Khung"] || ""),
            "Số Máy": safeValue(contractData.soMay || contractData.engineNumber || contractData["Số Máy"] || ""),
            "Tình Trạng": safeValue(contractData.tinhTrangXe || contractData.vehicleStatus || contractData["Tình Trạng Xe"] || ""),
            "ngân hàng": safeValue(normalizedContract.bank || ""),
            thanhToan: normalizedContract.payment,
            soTienVay: normalizedContract.loanAmount,
            uuDai: Array.isArray(normalizedContract.uuDai)
              ? normalizedContract.uuDai
                  .map((item) => String(item || '').trim())
                  .filter(Boolean)
              : [],
            "ưu đãi": (() => {
              const uuDaiValue = normalizedContract.uuDai || "";
              if (Array.isArray(uuDaiValue)) {
                return uuDaiValue.length > 0
                  ? uuDaiValue
                      .map((item) => String(item || '').trim())
                      .filter(Boolean)
                      .join("\n")
                  : "";
              }
              return safeValue(uuDaiValue);
            })(),
            "Quà tặng": safeValue(normalizedContract.quaTang),
            "Quà tặng khác": safeValue(normalizedContract.quaTangKhac),
            "Số tiền vay": normalizedContract.soTienVay || normalizedContract.loanAmount,
            "Số tiền phải thu": normalizedContract.soTienPhaiThu,
            quaTang: safeValue(normalizedContract.quaTang),
            quaTangKhac: safeValue(normalizedContract.quaTangKhac),
            soTienPhaiThu: normalizedContract.soTienPhaiThu,
          };

          // Sanitize data before Firebase write
          const sanitizedExportedData = sanitizeContractData(exportedData);
          await set(exportedContractRef, sanitizedExportedData);
        }
        // If changing from "xuất" to non-"xuất": remove from exportedContracts
        else if (oldStatusLower === "xuất" && newStatusLower !== "xuất") {
          await remove(exportedContractRef);
        }

        toast.success("Cập nhật hợp đồng thành công!");
      } else {
        // Create new contract
        const id = `local-${Date.now()}`;
        const contractsRef = ref(database, "contracts");
        const newContractData = {
          id: id || "",
          createdDate: normalizedContract.createdAt || "",
          tvbh: safeValue(normalizedContract.tvbh),
          showroom: safeValue(normalizedContract.showroom),
          vso: safeValue(normalizedContract.vso),
          customerName: safeValue(normalizedContract.customerName),
          phone: safeValue(normalizedContract.phone),
          email: safeValue(normalizedContract.email),
          address: safeValue(normalizedContract.address),
          cccd: safeValue(normalizedContract.cccd),
          ngayCap: safeValue(normalizedContract.issueDate),
          noiCap: safeValue(normalizedContract.issuePlace),
          dongXe: safeValue(normalizedContract.model),
          phienBan: safeValue(normalizedContract.variant),
          ngoaiThat: safeValue(normalizedContract.exterior),
          noiThat: safeValue(normalizedContract.interior),
          giaHD: normalizedContract.contractPrice,
          soTienCoc: normalizedContract.deposit,
          tienDoiUng: parseCurrency(calculatedTienDoiUng),
          "Tiền đối ứng": parseCurrency(calculatedTienDoiUng),
          thanhToan: normalizedContract.payment,
          soTienVay: normalizedContract.loanAmount,
          nganHang: safeValue(normalizedContract.bank),
          uuDai: Array.isArray(normalizedContract.uuDai) ? normalizedContract.uuDai : [],
          quaTang: safeValue(normalizedContract.quaTang),
          quaTangKhac: safeValue(normalizedContract.quaTangKhac),
          soTienPhaiThu: normalizedContract.soTienPhaiThu,
          trangThai: normalizedContract.status || "mới",
          // Company fields
          khachHangLa: safeValue(normalizedContract.khachHangLa),
          msdn: safeValue(normalizedContract.msdn),
          daiDien: safeValue(normalizedContract.daiDien),
          chucVu: safeValue(normalizedContract.chucVu),
          giayUyQuyen: safeValue(normalizedContract.giayUyQuyen),
          giayUyQuyenNgay: safeValue(normalizedContract.giayUyQuyenNgay),
        };

        console.log("New contract data being sent to Firebase:", newContractData);
        console.log("Loan amount in new contract:", newContractData.soTienVay);

        // Sanitize data before Firebase write
        const sanitizedNewContractData = sanitizeContractData(newContractData);
        const newRef = await push(contractsRef, sanitizedNewContractData);

        // If new contract status is "xuất", also add to exportedContracts
        const newStatus = normalizedContract.status || "mới";
        if (newStatus.toLowerCase() === "xuất") {
          const exportKey = newRef.key;
          if (exportKey) {
            // Get current date/time in format YYYY-MM-DD
            const now = new Date();
            const ngayXhd = now.toISOString().split("T")[0];

            // Map contract data to exported format
            const exportedData = {
              id: id || "",
              stt: "",
              "ngày xhd": ngayXhd,
              tvbh: safeValue(normalizedContract.tvbh),
              showroom: safeValue(normalizedContract.showroom),
              VSO: safeValue(normalizedContract.vso),
              "Tên Kh": safeValue(normalizedContract.customerName),
              "Số Điện Thoại": safeValue(normalizedContract.phone),
              Email: safeValue(normalizedContract.email || ""),
              "Địa Chỉ": safeValue(normalizedContract.address || ""),
              CCCD: safeValue(normalizedContract.cccd),
              "Ngày Cấp": safeValue(normalizedContract.issueDate),
              "Nơi Cấp": safeValue(normalizedContract.issuePlace),
              "Dòng xe": safeValue(normalizedContract.model),
              "Phiên Bản": safeValue(normalizedContract.variant),
              "Ngoại Thất": safeValue(normalizedContract.exterior),
              "Nội Thất": safeValue(normalizedContract.interior),
              "Giá Niêm Yết": normalizedContract.contractPrice,
              "Giá Giảm": normalizedContract.giamGia || 0,
              "Giá Hợp Đồng": normalizedContract.contractPrice,
              "Tiền đặt cọc": normalizedContract.deposit,
              tienDatCoc: normalizedContract.deposit,
              "Tiền đối ứng": parseCurrency(calculatedTienDoiUng),
              tienDoiUng: parseCurrency(calculatedTienDoiUng),
              "Số Khung": "",
              "Số Máy": "",
              "Tình Trạng": "",
              "ngân hàng": safeValue(normalizedContract.bank || ""),
              thanhToan: normalizedContract.payment,
              soTienVay: normalizedContract.loanAmount,
              uuDai: Array.isArray(normalizedContract.uuDai)
                ? normalizedContract.uuDai
                    .map((item) => String(item || '').trim())
                    .filter(Boolean)
                : [],
              "ưu đãi": (() => {
                const uuDaiValue = normalizedContract.uuDai || "";
                if (Array.isArray(uuDaiValue)) {
                  return uuDaiValue.length > 0
                    ? uuDaiValue
                        .map((item) => String(item || '').trim())
                        .filter(Boolean)
                        .join("\n")
                    : "";
                }
                return safeValue(uuDaiValue);
              })(),
              "Quà tặng": safeValue(normalizedContract.quaTang),
              "Quà tặng khác": safeValue(normalizedContract.quaTangKhac),
              "Số tiền vay": normalizedContract.soTienVay || normalizedContract.loanAmount,
              "Số tiền phải thu": normalizedContract.soTienPhaiThu,
              quaTang: safeValue(normalizedContract.quaTang),
              quaTangKhac: safeValue(normalizedContract.quaTangKhac),
              soTienPhaiThu: normalizedContract.soTienPhaiThu,
            };

            const exportedContractRef = ref(database, `exportedContracts/${exportKey}`);
            // Sanitize data before Firebase write
            const sanitizedExportedData = sanitizeContractData(exportedData);
            await set(exportedContractRef, sanitizedExportedData);
          }
        }

        toast.success("Thêm hợp đồng thành công!");
      }

      // Navigate back to contracts page with reload flag
      setTimeout(() => {
        navigate("/hop-dong", { state: { reload: true } });
      }, 500);
    } catch (err) {
      console.error("Error saving contract:", err);
      toast.error("Đã xảy ra lỗi khi lưu hợp đồng: " + err.message);
    }
  };

  return (
    <div className="mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 bg-gradient-to-br from-slate-100 to-slate-200 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-400 px-4 sm:px-6 py-4 sm:py-5 rounded-t-2xl shadow-lg">
          <div className="flex items-center justify-between relative">
            <button
              onClick={() => navigate(isDetailsMode ? "/dashboard" : "/hop-dong")}
              className="text-white hover:text-gray-200 transition-colors flex items-center gap-2 px-2 sm:px-4 py-2 rounded-lg hover:bg-white/10 z-10"
              aria-label="Quay lại"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Quay lại</span>
            </button>
            <h2 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white absolute left-1/2 transform -translate-x-1/2 px-2 text-center">
              {isDetailsMode
                ? "Chi tiết hợp đồng"
                : isEditMode
                  ? "Chỉnh sửa thông tin hợp đồng"
                  : "Thêm hợp đồng mới"}
            </h2>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-b-2xl shadow-xl overflow-hidden">
          {/* Form Sections */}
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
            {/* Section 1: Thông tin cơ bản */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-3 sm:mb-4">
                Thông tin cơ bản
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {/* Created Date */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Ngày tạo
                  </label>
                  <input
                    type="date"
                    value={(contract.createdAt || "").slice(0, 10)}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleInputChange("createdAt", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* TVBH */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    TVBH
                  </label>
                  <select
                    value={contract.tvbh || ""}
                    onChange={(e) => handleInputChange("tvbh", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Chọn TVBH</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.TVBH}>
                        {emp.TVBH}
                      </option>
                    ))}
                    {/* Show current value if it doesn't match any option (for editing existing contracts) */}
                    {contract.tvbh && !employees.find(e => e.TVBH === contract.tvbh) && (
                      <option value={contract.tvbh}>
                        {contract.tvbh} (giá trị hiện tại)
                      </option>
                    )}
                  </select>
                </div>

                {/* Showroom */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Showroom
                  </label>
                  <select
                    value={contract.showroom || ""}
                    onChange={(e) => handleInputChange("showroom", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Chọn showroom</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                    {/* Show current value if it doesn't match any option (for editing existing contracts) */}
                    {contract.showroom && !branches.find(b => b.name === contract.showroom) && (
                      <option value={contract.showroom}>
                        {contract.showroom} (giá trị hiện tại)
                      </option>
                    )}
                  </select>
                </div>

                {/* VSO */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    VSO
                  </label>
                  <input
                    type="text"
                    value={contract.vso || ""}
                    onChange={(e) => handleInputChange("vso", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="VSO"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Thông tin khách hàng */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-3 sm:mb-4">
                Thông tin khách hàng
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">

                {/* Customer selector */}
                {!isDetailsMode && (
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Chọn khách hàng đã có
                    </label>
                    <select
                      value={selectedCustomerKey}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white"
                    >
                      <option value="">-- Chọn khách hàng --</option>
                      {customers.map((customer) => (
                        <option key={customer.firebaseKey} value={customer.firebaseKey}>
                          {customer.tenKhachHang || customer.customerName || customer.soDienThoai || 'Khách hàng không tên'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Customer Name */}
                <div className={`sm:col-span-2 lg:col-span-1 ${!isDetailsMode ? 'mt-3 sm:mt-0' : ''}`}>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Tên khách hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contract.customerName || ""}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Tên khách hàng"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={contract.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Số điện thoại"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={contract.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Email"
                  />
                </div>

                {/* Customer Type */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Khách hàng là
                  </label>
                  <select
                    value={contract.khachHangLa || ""}
                    onChange={(e) => handleInputChange("khachHangLa", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Chọn loại khách hàng --</option>
                    <option value="Cá nhân">Cá nhân</option>
                    <option value="Công ty">Công ty</option>
                  </select>
                </div>

                {/* Company Fields */}
                {contract.khachHangLa === 'Công ty' && (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        MSDN / Mã số thuế
                      </label>
                      <input
                        type="text"
                        value={contract.msdn || ""}
                        onChange={(e) => handleInputChange("msdn", e.target.value)}
                        disabled={isDetailsMode}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="MSDN / Mã số thuế"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Người đại diện
                      </label>
                      <input
                        type="text"
                        value={contract.daiDien || ""}
                        onChange={(e) => handleInputChange("daiDien", e.target.value)}
                        disabled={isDetailsMode}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Người đại diện"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Chức vụ
                      </label>
                      <input
                        type="text"
                        value={contract.chucVu || ""}
                        onChange={(e) => handleInputChange("chucVu", e.target.value)}
                        disabled={isDetailsMode}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Chức vụ"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Số giấy ủy quyền
                      </label>
                      <input
                        type="text"
                        value={contract.giayUyQuyen || ""}
                        onChange={(e) => handleInputChange("giayUyQuyen", e.target.value)}
                        disabled={isDetailsMode}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Số giấy ủy quyền"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Ngày giấy ủy quyền
                      </label>
                      <input
                        type="date"
                        value={normalizeDateInputValue(contract.giayUyQuyenNgay || "")}
                        onChange={(e) => handleInputChange("giayUyQuyenNgay", e.target.value)}
                        disabled={isDetailsMode}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {/* Address */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={contract.address || ""}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Địa chỉ"
                  />
                </div>

                {/* CCCD */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Số CCCD
                  </label>
                  <input
                    type="text"
                    value={contract.cccd || ""}
                    onChange={(e) => handleInputChange("cccd", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="CCCD"
                  />
                </div>

                {/* Issue Date */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Ngày cấp
                  </label>
                  <input
                    type="date"
                    value={(contract.issueDate || "").slice(0, 10)}
                    onChange={(e) => handleInputChange("issueDate", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Issue Place */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Nơi cấp
                  </label>
                  <select
                    value={contract.issuePlace || ""}
                    onChange={(e) => handleInputChange("issuePlace", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Chọn nơi cấp</option>
                    {issuePlaces.map((place) => (
                      <option key={place} value={place}>
                        {place}
                      </option>
                    ))}
                    {/* Show current value if it doesn't match any option (for editing existing contracts) */}
                    {contract.issuePlace && !issuePlaces.includes(contract.issuePlace) && (
                      <option value={contract.issuePlace}>
                        {contract.issuePlace} (giá trị hiện tại)
                      </option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Thông tin xe */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-3 sm:mb-4">
                Thông tin xe
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">

                {/* Model (Dòng xe) */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Dòng xe
                  </label>
                  <select
                    value={contract.model || ""}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Chọn dòng xe</option>
                    {carModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                    {/* Show current value if it doesn't match any option (for editing existing contracts) */}
                    {contract.model && !carModels.includes(contract.model) && (
                      <option value={contract.model}>
                        {contract.model} (giá trị hiện tại)
                      </option>
                    )}
                  </select>
                </div>

                {/* Variant */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Phiên Bản
                  </label>
                  <select
                    value={contract.variant || ""}
                    onChange={(e) => handleInputChange("variant", e.target.value)}
                    disabled={isDetailsMode || !contract.model}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Chọn phiên bản</option>
                    {availableTrims.map((trim) => (
                      <option key={trim} value={trim}>
                        {trim}
                      </option>
                    ))}
                    {/* Show current value if it doesn't match any option (for editing existing contracts) */}
                    {contract.variant && !availableTrims.includes(contract.variant) && (
                      <option value={contract.variant}>
                        {contract.variant} (giá trị hiện tại)
                      </option>
                    )}
                  </select>
                </div>

                {/* Exterior */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Ngoại Thất
                  </label>
                  <select
                    value={contract.exterior || ""}
                    onChange={(e) => handleInputChange("exterior", e.target.value)}
                    disabled={isDetailsMode || !contract.model || !contract.variant}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Chọn màu ngoại thất</option>
                    {availableExteriorColors.map((color) => (
                      <option key={color.code} value={color.code}>
                        {color.name}
                      </option>
                    ))}
                    {/* Show current value if it doesn't match any option (for editing existing contracts) */}
                    {contract.exterior && !availableExteriorColors.find(c => c.code === contract.exterior) && (
                      <option value={contract.exterior}>
                        {mapColorCodeToName(contract.exterior, true)} (giá trị hiện tại)
                      </option>
                    )}
                  </select>
                </div>

                {/* Interior */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Nội Thất
                  </label>
                  <select
                    value={contract.interior || ""}
                    onChange={(e) => handleInputChange("interior", e.target.value)}
                    disabled={isDetailsMode || !contract.model || !contract.variant}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Chọn màu nội thất</option>
                    {availableInteriorColors.map((color) => (
                      <option key={color.code} value={color.code}>
                        {color.name}
                      </option>
                    ))}
                    {/* Show current value if it doesn't match any option (for editing existing contracts) */}
                    {contract.interior && !availableInteriorColors.find(c => c.code === contract.interior) && (
                      <option value={contract.interior}>
                        {mapColorCodeToName(contract.interior, false)} (giá trị hiện tại)
                      </option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Thông tin thanh toán */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-3 sm:mb-4">
                Thông tin thanh toán
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">

                {/* Contract Price */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Giá hợp đồng
                  </label>
                  <CurrencyInput
                    value={contract.contractPrice}
                    onChange={(val) => handleInputChange("contractPrice", val)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Nhập giá hợp đồng"
                  />
                </div>

                {/* Deposit */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Số tiền cọc
                  </label>
                  <CurrencyInput
                    value={contract.deposit}
                    onChange={(val) => handleInputChange("deposit", val)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Nhập số tiền cọc"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Thanh toán
                  </label>
                  <select
                    value={contract.payment || ""}
                    onChange={(e) => handleInputChange("payment", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Chọn hình thức thanh toán</option>
                    <option value="trả thẳng">Trả thẳng</option>
                    <option value="trả góp">Trả góp</option>
                  </select>
                </div>

                {/* Loan Amount - Only show when payment is "trả góp" */}
                {contract.payment === "trả góp" && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Số tiền vay
                    </label>
                    <CurrencyInput
                      value={contract.loanAmount}
                      onChange={(val) => handleInputChange("loanAmount", val)}
                      disabled={isDetailsMode}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Nhập số tiền vay"
                    />
                  </div>
                )}

                {/* Bank - Only show when payment is "trả góp" */}
                {contract.payment === "trả góp" && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Ngân hàng
                    </label>
                    <select
                      value={contract.bank || ""}
                      onChange={(e) => handleInputChange("bank", e.target.value)}
                      disabled={isDetailsMode}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Chọn ngân hàng</option>
                      <option value="BIDV">BIDV</option>
                      <option value="Vietcombank">Vietcombank</option>
                      <option value="VietinBank">VietinBank</option>
                      <option value="Techcombank">Techcombank (TCB)</option>
                      <option value="MB Bank">MB Bank</option>
                      <option value="ACB">ACB</option>
                      <option value="VPBank">VPBank</option>
                      <option value="Sacombank">Sacombank</option>
                      <option value="TPBank">TPBank</option>
                      <option value="Shinhan Bank">Shinhan Bank</option>
                      <option value="HDBank">HDBank</option>
                      <option value="MSB">MSB</option>
                      <option value="SHB">SHB</option>
                      <option value="OCB">OCB</option>
                      <option value="LPBank">LPBank</option>
                      <option value="Agribank">Agribank</option>
                      <option value="Khác">Khác</option>
                      {/* Show current value if it doesn't match any option */}
                      {contract.bank && !["", "BIDV", "Vietcombank", "VietinBank", "Techcombank", "MB Bank", "ACB", "VPBank", "Sacombank", "TPBank", "Shinhan Bank", "HDBank", "MSB", "SHB", "OCB", "LPBank", "Agribank", "Khác"].includes(contract.bank) && (
                        <option value={contract.bank}>
                          {contract.bank} (giá trị hiện tại)
                        </option>
                      )}
                    </select>
                  </div>
                )}

                {/* Uu Dai - Dropdown with checkboxes */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Ưu đãi áp dụng
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPromotionModalOpen(true)}
                      className="px-3 sm:px-4 py-2 bg-primary-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Chọn ưu đãi
                    </button>
                    {selectedPromotions.length > 0 && (
                      <span className="text-xs sm:text-sm text-gray-600 self-center">
                        Đã chọn {selectedPromotions.length} ưu đãi
                      </span>
                    )}
                  </div>
                  
                  {/* Display selected promotions */}
                  {selectedPromotions.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {selectedPromotions.map((promotion) => (
                        <div
                          key={promotion.id}
                          className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div>
                            <div className="font-medium text-sm text-gray-900">{promotion.name}</div>
                            {promotion.type === 'fixed' && (
                              <div className="text-xs text-gray-600">
                                Giảm trực tiếp: {formatCurrency(promotion.value)} VNĐ
                              </div>
                            )}
                            {promotion.type === 'percentage' && (
                              <div className="text-xs text-gray-600">
                                Giảm: {promotion.value}%{promotion.maxDiscount > 0 ? ` (tối đa ${formatCurrency(promotion.maxDiscount)} VNĐ)` : ''}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPromotions(prev => 
                                prev.filter(p => p.id !== promotion.id)
                              );
                              setContract(prev => ({
                                ...prev,
                                uuDai: prev.uuDai ? prev.uuDai.filter(p => p !== promotion.name) : []
                              }));
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quà tặng theo xe */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Quà tặng theo xe
                  </label>
                  <input
                    type="text"
                    value={contract.quaTang || ""}
                    onChange={(e) => handleInputChange("quaTang", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Áo trùm, bao tay lái, sáp thơm, bình chữa cháy."
                  />
                </div>

                {/* Quà tặng khác */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Quà tặng khác
                  </label>
                  <input
                    type="text"
                    value={contract.quaTangKhac || ""}
                    onChange={(e) => handleInputChange("quaTangKhac", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Bảo Hiểm Vật Chất Kinh Doanh, Cam, Film, Sàn"
                  />
                </div>

                {/* Số tiền phải thu */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Số tiền phải thu
                  </label>
                  <CurrencyInput
                    value={contract.soTienPhaiThu}
                    onChange={(val) => handleInputChange("soTienPhaiThu", val)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Nhập số tiền phải thu"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Trạng thái
                  </label>
                  <select
                    value={contract.status || ""}
                    onChange={(e) => handleInputChange("status", e.target.value)}
                    disabled={isDetailsMode}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="mới">mới</option>
                    <option value="hoàn">hoàn</option>
                    <option value="hủy">hủy</option>
                    <option value="xuất">xuất</option>
                    <option value="chuyển tên">chuyển tên</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Required fields note */}
          <div className="px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-3 sm:pb-4 border-t border-gray-200">
            <p className="text-xs sm:text-sm text-gray-500">
              <span className="text-red-500 font-semibold">*</span> Các trường bắt buộc
            </p>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:gap-4 border-t border-gray-200">
            <button
              onClick={() => navigate(isDetailsMode ? "/dashboard" : "/hop-dong")}
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-sm sm:text-base"
              aria-label={isDetailsMode ? "Quay lại" : "Hủy"}
            >
              <X className="w-4 h-4" />
              <span>{isDetailsMode ? "Quay lại" : "Hủy"}</span>
            </button>
            {!isDetailsMode && (
              <button
                onClick={handleSubmit}
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-secondary-600 text-white font-medium rounded-lg hover:bg-secondary-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-sm sm:text-base"
                aria-label={isEditMode ? "Lưu thay đổi" : "Thêm hợp đồng"}
              >
                <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{isEditMode ? "Lưu thay đổi" : "Thêm hợp đồng"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Promotions Modal */}
      {isPromotionModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="modal-box bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[calc(100vh-2rem)] overflow-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-400 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg sticky top-0 z-10">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Quản lý chương trình ưu đãi</span>
              </h3>
            </div>

            {/* Search */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm ưu đãi..."
                  value={promotionSearch}
                  onChange={(e) => setPromotionSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              {contract.model && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Lọc theo dòng xe:</span> {contract.model}
                    <br />
                    <span className="text-xs">Chỉ hiển thị ưu đãi áp dụng cho dòng xe này</span>
                  </p>
                </div>
              )}
            </div>

            {/* Promotions List */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 max-h-96 overflow-y-auto">
              {allPromotions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Gift className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Chưa có chương trình ưu đãi nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allPromotions
                    .filter(promotion => 
                      promotion.name.toLowerCase().includes(promotionSearch.toLowerCase())
                    )
                    .filter(promotion => {
                      // Lọc theo dòng xe đã chọn (dùng map từ bảng giá để hỗ trợ dòng xe mới như VF Lạc Hồng)
                      if (!contract.model) return true;
                      const selectedDongXe = modelToDongXeMapFromData[contract.model];
                      if (!selectedDongXe) return true;
                      return filterPromotionsByDongXe([promotion], selectedDongXe).length > 0;
                    })
                    .map((promotion) => (
                      <div key={promotion.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedPromotionIds.has(promotion.id)}
                            onChange={() => {
                              const newSelected = new Set(selectedPromotionIds);
                              if (newSelected.has(promotion.id)) {
                                newSelected.delete(promotion.id);
                              } else {
                                newSelected.add(promotion.id);
                              }
                              setSelectedPromotionIds(newSelected);
                              
                              // Also update selectedPromotions array
                              if (newSelected.has(promotion.id)) {
                                setSelectedPromotions(prev => [...prev, promotion]);
                              } else {
                                setSelectedPromotions(prev => prev.filter(p => p.id !== promotion.id));
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900">{promotion.name}</div>
                            {promotion.type === 'fixed' && (
                              <div className="text-xs text-gray-600">
                                Giảm trực tiếp: {formatCurrency(promotion.value)} VNĐ
                              </div>
                            )}
                            {promotion.type === 'percentage' && (
                              <div className="text-xs text-gray-600">
                                Giảm: {promotion.value}%{promotion.maxDiscount > 0 ? ` (tối đa ${formatCurrency(promotion.maxDiscount)} VNĐ)` : ''}
                              </div>
                            )}
                            {promotion.type === 'display' && (
                              <div className="text-xs text-gray-600">
                                Hiển thị: {promotion.description || 'Không có mô tả'}
                              </div>
                             )}
                            {/* Display assigned car models */}
                            <div className="mt-1 flex flex-wrap gap-1">
                              {normalizeDongXe(promotion.dongXe).length > 0 ? (
                                normalizeDongXe(promotion.dongXe).map(code => (
                                  <span key={code} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                    {dongXeToModelMapFromData[code] || code}
                                  </span>
                                ))
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100">
                                  Tất cả dòng xe
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {promotion.type === 'fixed' && 'Giảm tiền'}
                            {promotion.type === 'percentage' && 'Giảm %'}
                            {promotion.type === 'display' && 'Hiển thị'}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-b-lg flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 sticky bottom-0 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Đã chọn: {selectedPromotionIds.size} ưu đãi
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    // Update contract with selected promotions
                    const selectedPromos = allPromotions.filter(p => selectedPromotionIds.has(p.id));
                    handleAddPromotions(selectedPromos);
                    setIsPromotionModalOpen(false);
                  }}
                  disabled={selectedPromotionIds.size === 0}
                  className={`w-full sm:w-auto px-4 py-2 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ${
                    selectedPromotionIds.size > 0 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Thêm vào hợp đồng</span>
                </button>
                <button
                  onClick={() => setIsPromotionModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  aria-label="Đóng"
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
  );
}
