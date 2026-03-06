import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FilterPanel from '../components/FilterPanel';
import { ref, get, update, remove, push, set } from 'firebase/database';
import { database } from '../firebase/config';
import { X, Trash2, Plus, Check, AlertTriangle, Edit, Download, ArrowLeft, Gift } from 'lucide-react';
import { toast } from 'react-toastify';
import { uniqueNgoaiThatColors, uniqueNoiThatColors, getAvailableDongXeForPromotion } from '../data/calculatorData';
import { useCarPriceData } from '../contexts/CarPriceDataContext';
import { getBranchByShowroomName, getAllBranches } from '../data/branchData';
import { loadPromotionsFromFirebase, filterPromotionsByDongXe, normalizeDongXe } from '../data/promotionsData';
import CurrencyInput from '../components/shared/CurrencyInput';

export default function HopDongPage() {
  const { carPriceData } = useCarPriceData();
  const availableDongXeForPromotion = getAvailableDongXeForPromotion(carPriceData);

  const [userTeam, setUserTeam] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [userEmail, setUserEmail] = useState('');
  const [username, setUsername] = useState('');
  const [userDepartment, setUserDepartment] = useState('');
  const [actualEmployeeName, setActualEmployeeName] = useState(''); // Actual name from employees collection
  const [employeesMap, setEmployeesMap] = useState({}); // Map TVBH -> department
  const [teamEmployeeNames, setTeamEmployeeNames] = useState([]); // List of employee names in team (for leader)
  const [employeesLoaded, setEmployeesLoaded] = useState(false); // Flag to know when employees data is loaded

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    products: [], // will hold unique "Dòng xe" values from sample
    markets: [], // repurposed to hold payment methods from sample
    searchText: '',
  });

  const [availableFilters, setAvailableFilters] = useState({
    products: [], // unique models (dongXe)
    markets: [], // payment methods
  });

  const [quickSelectValue, setQuickSelectValue] = useState('');

  // Contract management states
  const [allContracts, setAllContracts] = useState([]); // Store all contracts before filtering
  const [contracts, setContracts] = useState([]); // Filtered contracts based on permissions
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [deletingContract, setDeletingContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedContracts, setSelectedContracts] = useState(new Set());
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddPromotionModalOpen, setIsAddPromotionModalOpen] = useState(false);
  const [newPromotionName, setNewPromotionName] = useState('');
  const [promotions, setPromotions] = useState([]);
  const [editingPromotion, setEditingPromotion] = useState({
    id: null,
    name: '',
    type: 'display', // 'display', 'percentage', 'fixed'
    value: 0,
    maxDiscount: 0,
    minPurchase: 0
  });
  const [deletingPromotionId, setDeletingPromotionId] = useState(null);
  const [loadingPromotions, setLoadingPromotions] = useState(true); // Initialize as true to show loading state initially
  const [promotionType, setPromotionType] = useState('display'); // 'display', 'percentage', 'fixed'
  const [filterType, setFilterType] = useState('all'); // 'all', 'display', 'percentage', 'fixed'
  const [selectedPromotionIds, setSelectedPromotionIds] = useState(new Set()); // Track selected promotion IDs
  const [selectedDongXeFilter, setSelectedDongXeFilter] = useState('all'); // Lọc ưu đãi theo dòng xe
  const [selectedDongXeList, setSelectedDongXeList] = useState([]); // Danh sách dòng xe được chọn cho promotion mới

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to map color code to name
  const getColorName = (colorCode, isExterior = true) => {
    if (!colorCode) return colorCode || "-";
    const colorList = isExterior ? uniqueNgoaiThatColors : uniqueNoiThatColors;
    const found = colorList.find(
      (color) => color.code === colorCode || color.name.toLowerCase() === colorCode.toLowerCase()
    );
    return found ? found.name : colorCode; // Return name if found, otherwise return original value
  };

  // Helper function to get shortName from showroom (full name)
  const getShowroomShortName = (showroomValue) => {
    if (!showroomValue) return showroomValue || "-";
    // Try to find branch by showroom name
    const foundBranch = getBranchByShowroomName(showroomValue);
    if (foundBranch) {
      return foundBranch.shortName;
    }
    // If not found, check if it matches any branch name
    const branches = getAllBranches();
    const exactMatch = branches.find(
      (branch) =>
        branch.name.toLowerCase() === showroomValue.toLowerCase() ||
        branch.shortName.toLowerCase() === showroomValue.toLowerCase()
    );
    return exactMatch ? exactMatch.shortName : showroomValue; // Return shortName if found, otherwise return original value
  };

  // Helper function to format currency (VNĐ)
  const formatCurrency = (value) => {
    if (!value && value !== 0) return "-";
    // Remove any existing formatting and convert to number
    const numValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[^\d.-]/g, '')) 
      : Number(value);
    
    if (isNaN(numValue)) return value || "-";
    
    // Format with thousand separators
    return numValue.toLocaleString('vi-VN');
  };

  useEffect(() => {
    const team = localStorage.getItem('userTeam') || '';
    const role = localStorage.getItem('userRole') || 'user';
    const email = localStorage.getItem('userEmail') || '';
    const usernameValue = localStorage.getItem('username') || '';
    const userDepartmentValue = localStorage.getItem('userDepartment') || '';
    
    setUserTeam(team);
    setUserRole(role);
    setUserEmail(email);
    setUsername(usernameValue);
    setUserDepartment(userDepartmentValue);

    // populate filters by scanning existing contracts in Firebase
    const fetchFiltersFromDB = async () => {
      try {
        const contractsRef = ref(database, 'contracts');
        const snapshot = await get(contractsRef);
        const data = snapshot.exists() ? snapshot.val() : {};
        const contracts = Object.values(data || {});

        const models = [
          ...new Set(contracts.map((c) => c.dongXe || c.model).filter(Boolean)),
        ].sort();
        const paymentMethods = [
          ...new Set(contracts.map((c) => c.thanhToan || c.payment).filter(Boolean)),
        ].sort();

        setAvailableFilters((prev) => ({ ...prev, products: models, markets: paymentMethods }));
      } catch (err) {
        console.error('Error loading filter options from Firebase contracts', err);
      }
    };

    fetchFiltersFromDB();
  }, []);

  // Load employees data to get actual employee name and map TVBH -> department
  useEffect(() => {
    const loadEmployeesData = async () => {
      setEmployeesLoaded(false);
      
      if (!userEmail && !userRole) {
        setEmployeesLoaded(true);
        return;
      }

      try {
        const employeesRef = ref(database, "employees");
        const snapshot = await get(employeesRef);
        const data = snapshot.exists() ? snapshot.val() : {};

        const employeesMapping = {};
        const teamNames = [];
        let foundEmployeeName = "";

        // Find current user's actual name from employees by email
        if (userEmail) {
          const userEntry = Object.entries(data).find(([key, employee]) => {
            const employeeEmail = (employee && (employee.mail || employee.Mail || employee.email || "")).toString().toLowerCase();
            return employeeEmail === userEmail.toLowerCase();
          });

          if (userEntry) {
            const [userId, employeeData] = userEntry;
            // Get actual name from employee - try multiple fields
            foundEmployeeName = employeeData.TVBH || employeeData.user || employeeData.username || employeeData.name || "";
            setActualEmployeeName(foundEmployeeName);
          }
        }

        // Build employees mapping and team names
        Object.entries(data).forEach(([key, employee]) => {
          const employeeName = employee.TVBH || employee.user || employee.username || employee.name || "";
          const employeeDept = employee.phongBan || employee["Phòng Ban"] || employee.department || employee["Bộ phận"] || "";
          const employeeEmail = (employee.mail || employee.Mail || employee.email || "").toString().toLowerCase();

          if (employeeName) {
            employeesMapping[employeeName] = employeeDept;
            
            // For leader: collect all employees in same department
            if (userRole === "leader" && userDepartment && employeeDept === userDepartment) {
              teamNames.push(employeeName);
            }
          }
        });

        setEmployeesMap(employeesMapping);
        
        if (userRole === "leader") {
          // Include current user in team if found
          if (foundEmployeeName && !teamNames.includes(foundEmployeeName)) {
            teamNames.push(foundEmployeeName);
          }
          setTeamEmployeeNames(teamNames);
        } else if (userRole === "admin") {
          // Admin can see all employees
          setTeamEmployeeNames(Object.keys(employeesMapping));
        }
        
        setEmployeesLoaded(true);
      } catch (err) {
        toast.error("Lỗi khi tải dữ liệu nhân viên: " + err.message);
        // Set empty array on error so filter can proceed
        setTeamEmployeeNames([]);
        setEmployeesLoaded(true);
      }
    };

    loadEmployeesData();
  }, [userRole, userDepartment, userEmail]);

  // Load all contracts from Firebase (without permission filter)
  useEffect(() => {
    const mapSample = (c) => ({
      id: c.id,
      stt: c.stt,
      createdAt: c.createdDate || c.createdAt,
      TVBH: c.tvbh || c.TVBH,
      showroom: c.showroom,
      vso: c.vso,
      customerName: c.customerName || c["Tên KH"],
      phone: c.phone,
      email: c.email || c.Email || c["Email"] || "",
      address: c.address || c["Địa chỉ"] || c["Địa Chỉ"] || "",
      cccd: c.cccd,
      issueDate: c.ngayCap || c.issueDate,
      issuePlace: c.noiCap || c.issuePlace,
      model: c.dongXe || c["Dòng xe"],
      variant: c.phienBan || c["Phiên Bản"],
      exterior: c.ngoaiThat || c["Ngoại Thất"],
      interior: c.noiThat || c["Nội Thất"],
      contractPrice: c.giaHD || c["Giá HD"],
      deposit: c.soTienCoc || c["Số tiền cọc"],
      payment: c.thanhToan || c["thanh toán"],
      loanAmount: c.soTienVay || c.loanAmount || c.tienVay || "",
      bank: c.nganHang || c["ngân hàng"],
      uuDai: c.uuDai || c["Ưu đãi"] || c["ưu đãi"] || "",
      quaTang: c.quaTang || c["Quà tặng"] || c["quà tặng"] || "",
      quaTangKhac: c.quaTangKhac || c["Quà tặng khác"] || c["quà tặng khác"] || "",
      giamGia: c.giamGia || c["Giảm giá"] || c["giảm giá"] || "",
      status: c.trangThai || c.status,
      // Company fields
      khachHangLa: c.khachHangLa || '',
      msdn: c.msdn || '',
      daiDien: c.daiDien || '',
      chucVu: c.chucVu || '',
      giayUyQuyen: c.giayUyQuyen || '',
      giayUyQuyenNgay: c.giayUyQuyenNgay || '',
    });
    
    const loadFromFirebase = async () => {
      try {
        const contractsRef = ref(database, "contracts");
        const snapshot = await get(contractsRef);
        const data = snapshot.exists() ? snapshot.val() : {};

        const mapped = Object.entries(data || {}).map(([key, c], idx) => {
          const base = mapSample(c || {});
          return { ...base, firebaseKey: key };
        });

        setAllContracts(mapped);
      } catch (err) {
        console.error("Error loading contracts from Firebase:", err);
        toast.error("Lỗi khi tải dữ liệu hợp đồng từ Firebase");
        setAllContracts([]);
      }
    };

    loadFromFirebase();
  }, []);

  // Apply permission filter to contracts
  useEffect(() => {
    // If no contracts loaded yet and not admin, wait for contracts to load
    if (allContracts.length === 0) {
      // If admin, can set loading false immediately (no contracts to show)
      if (userRole === "admin") {
        setContracts([]);
        setFilteredContracts([]);
        setLoading(false);
        return;
      }
      // For user/leader, wait for contracts to load first
      // But if employees are already loaded, we know there are no contracts
      if (employeesLoaded) {
        setContracts([]);
        setFilteredContracts([]);
        setLoading(false);
        return;
      }
      // Still waiting for either contracts or employees to load
      return;
    }

    let filtered = [];

    if (userRole === "user") {
      // User: only see their own contracts (by TVBH matching actual employee name)
      if (!employeesLoaded) {
        // Still loading employee data, show empty but keep loading
        filtered = [];
      } else if (actualEmployeeName) {
        // Filter by actual employee name
        filtered = allContracts.filter((contract) => {
          const contractTVBH = contract.TVBH || "";
          return contractTVBH === actualEmployeeName || 
                 contractTVBH.toLowerCase() === actualEmployeeName.toLowerCase();
        });
      } else {
        // Employee name not found, show empty
        filtered = [];
      }
      // Set loading false after filtering for user (whether employees loaded or not)
      if (employeesLoaded) {
        setLoading(false);
      }
    } else if (userRole === "leader") {
      // Leader: see contracts of employees in same department
      if (!employeesLoaded) {
        // Still loading employee data, show empty but keep loading
        filtered = [];
      } else {
        if (userDepartment && teamEmployeeNames.length > 0) {
          // Filter by team employee names
          filtered = allContracts.filter((contract) => {
            const contractTVBH = contract.TVBH || "";
            return teamEmployeeNames.includes(contractTVBH);
          });
        } else {
          // No team members found, show empty
          filtered = [];
        }
        // Set loading false after filtering for leader
        setLoading(false);
      }
    } else if (userRole === "admin") {
      // Admin: see all contracts (no filter)
      filtered = allContracts;
      setLoading(false);
    }

    setContracts(filtered);
    setFilteredContracts(filtered);
  }, [allContracts, userRole, actualEmployeeName, userDepartment, teamEmployeeNames, employeesLoaded]);

  // Reload contracts when returning from form page
  useEffect(() => {
    if (location.pathname === '/hop-dong' && location.state?.reload) {
      const mapSample = (c) => ({
        id: c.id,
        stt: c.stt,
        createdAt: c.createdDate || c.createdAt,
        TVBH: c.tvbh || c.TVBH,
        showroom: c.showroom,
        vso: c.vso,
        customerName: c.customerName || c["Tên KH"],
        phone: c.phone,
        email: c.email || c.Email || c["Email"] || "",
        address: c.address || c["Địa chỉ"] || c["Địa Chỉ"] || "",
        cccd: c.cccd,
        issueDate: c.ngayCap || c.issueDate,
        issuePlace: c.noiCap || c.issuePlace,
        model: c.dongXe || c["Dòng xe"],
        variant: c.phienBan || c["Phiên Bản"],
        exterior: c.ngoaiThat || c["Ngoại Thất"],
        interior: c.noiThat || c["Nội Thất"],
        contractPrice: c.giaHD || c["Giá HD"],
        deposit: c.soTienCoc || c["Số tiền cọc"],
        payment: c.thanhToan || c["thanh toán"],
        loanAmount: c.soTienVay || c.loanAmount || c.tienVay || "",
        bank: c.nganHang || c["ngân hàng"],
        uuDai: c.uuDai || c["Ưu đãi"] || c["ưu đãi"] || "",
        quaTang: c.quaTang || c["Quà tặng"] || c["quà tặng"] || "",
        quaTangKhac: c.quaTangKhac || c["Quà tặng khác"] || c["quà tặng khác"] || "",
        giamGia: c.giamGia || c["Giảm giá"] || c["giảm giá"] || "",
        status: c.trangThai || c.status,
        // Company / customer type fields (must match initial load mapSample so edit form has full data)
        khachHangLa: c.khachHangLa || '',
        msdn: c.msdn || '',
        daiDien: c.daiDien || '',
        chucVu: c.chucVu || '',
        giayUyQuyen: c.giayUyQuyen || '',
        giayUyQuyenNgay: c.giayUyQuyenNgay || '',
      });

      const loadFromFirebase = async () => {
        try {
          const contractsRef = ref(database, "contracts");
          const snapshot = await get(contractsRef);
          const data = snapshot.exists() ? snapshot.val() : {};

          const mapped = Object.entries(data || {}).map(([key, c], idx) => {
            const base = mapSample(c || {});
            return { ...base, firebaseKey: key };
          });

          // Just reload allContracts, permission filter will be applied in separate useEffect
          setAllContracts(mapped);
        } catch (err) {
          console.error("Error reloading contracts:", err);
        }
      };
      
      loadFromFirebase();
    }
  }, [location]);

  // Apply filters to contracts (permission filter already applied in loadFromFirebase)
  useEffect(() => {
    // Contracts are already filtered by permission in loadFromFirebase
    // Now apply user-selected filters (date, product, payment, search)
    let filtered = [...contracts];

    // Apply product/model filter (Dòng xe)
    if (filters.products && filters.products.length > 0) {
      filtered = filtered.filter((contract) =>
        filters.products.includes(contract.model || contract.dongXe || contract.model)
      );
    }

    // Apply payment method filter
    if (filters.markets && filters.markets.length > 0) {
      filtered = filtered.filter((contract) =>
        filters.markets.includes(contract.payment || contract.thanhToan)
      );
    }

    // Apply search filter: search across all fields in the row (global table search)
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter((contract) => {
        return Object.values(contract).some((val) => {
          if (val === null || val === undefined) return false;
          if (typeof val === "object") {
            try {
              return JSON.stringify(val).toLowerCase().includes(searchLower);
            } catch (e) {
              return false;
            }
          }
          return String(val).toLowerCase().includes(searchLower);
        });
      });
    }

    // Apply date range filter (createdAt)
    try {
      const start = filters.startDate ? new Date(filters.startDate) : null;
      const end = filters.endDate ? new Date(filters.endDate) : null;
      // make end inclusive to the end of the day if a date string without time is provided
      if (end && filters.endDate && filters.endDate.length === 10) {
        end.setHours(23, 59, 59, 999);
      }

      if (start || end) {
        filtered = filtered.filter((contract) => {
          const raw = contract.createdAt || contract.createdDate || contract.createdAt;
          if (!raw) return false;
          const d = new Date(raw);
          if (isNaN(d)) return false;
          if (start && d < start) return false;
          if (end && d > end) return false;
          return true;
        });
      }
    } catch (e) {
      // ignore parse errors and continue
      console.warn("Error parsing date filters for HopDong:", e);
    }

    setFilteredContracts(filtered);
    setCurrentPage(1); // Reset to page 1 when search changes
  }, [
    contracts,
    filters.searchText,
    filters.products,
    filters.markets,
    filters.startDate,
    filters.endDate,
  ]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => {
      if (Array.isArray(value)) return { ...prev, [filterType]: value };
      if (Array.isArray(prev[filterType])) {
        const newValues = prev[filterType].includes(value)
          ? prev[filterType].filter((v) => v !== value)
          : [...prev[filterType], value];
        return { ...prev, [filterType]: newValues };
      }
      return { ...prev, [filterType]: value };
    });
  };

  const handleQuickDateSelect = (e) => {
    const value = e.target.value;
    setQuickSelectValue(value);
    if (!value) return;

    // Helper function to format date as YYYY-MM-DD in local timezone
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Get today's date at local midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // helper: get start of week (Monday) and end of week (Sunday)
    const getWeekRange = (refDate) => {
      const d = new Date(refDate);
      d.setHours(0, 0, 0, 0);
      const day = d.getDay(); // 0 (Sun) - 6 (Sat)
      // calculate Monday of current week
      // If Sunday (0), go back 6 days. If Monday (1), no change. Otherwise, go back (day - 1) days
      const mondayDiff = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + mondayDiff);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return { start: monday, end: sunday };
    };

    let startDate = null;
    let endDate = null;

    if (value === 'today') {
      startDate = new Date(today);
      endDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (value === 'yesterday') {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      startDate = new Date(d);
      endDate = new Date(d);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (value === 'this-week') {
      const range = getWeekRange(today);
      startDate = range.start;
      endDate = range.end;
    } else if (value === 'last-week') {
      const range = getWeekRange(today);
      const lastWeekStart = new Date(range.start);
      lastWeekStart.setDate(range.start.getDate() - 7);
      const lastWeekEnd = new Date(range.end);
      lastWeekEnd.setDate(range.end.getDate() - 7);
      startDate = lastWeekStart;
      endDate = lastWeekEnd;
    } else if (value === 'next-week') {
      const range = getWeekRange(today);
      const nextWeekStart = new Date(range.start);
      nextWeekStart.setDate(range.start.getDate() + 7);
      const nextWeekEnd = new Date(range.end);
      nextWeekEnd.setDate(range.end.getDate() + 7);
      startDate = nextWeekStart;
      endDate = nextWeekEnd;
    } else if (value.startsWith('month-')) {
      // month-N (1-12) -> use current year
      const parts = value.split('-');
      const m = parseInt(parts[1], 10);
      if (!Number.isNaN(m) && m >= 1 && m <= 12) {
        const year = today.getFullYear();
        // First day of month
        startDate = new Date(year, m - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        // Last day of month: use next month, day 0 to get last day of current month
        endDate = new Date(year, m, 0);
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (value.startsWith('q')) {
      // quarters q1..q4
      const q = parseInt(value.slice(1), 10);
      if (!Number.isNaN(q) && q >= 1 && q <= 4) {
        const year = today.getFullYear();
        const startMonth = (q - 1) * 3; // 0-based: Q1=0, Q2=3, Q3=6, Q4=9
        // First day of quarter
        startDate = new Date(year, startMonth, 1);
        startDate.setHours(0, 0, 0, 0);
        // Last day of quarter: use (startMonth + 3), day 0 to get last day of last month in quarter
        endDate = new Date(year, startMonth + 3, 0);
        endDate.setHours(23, 59, 59, 999);
      }
    } else if (value === 'this-month') {
      const year = today.getFullYear();
      const month = today.getMonth();
      startDate = new Date(year, month, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(year, month + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    setFilters((prev) => ({
      ...prev,
      startDate: startDate ? formatLocalDate(startDate) : '',
      endDate: endDate ? formatLocalDate(endDate) : '',
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      products: [],
      markets: [],
      searchText: '',
    });
    setQuickSelectValue('');
  };

  const hasActiveFilters = () => {
    return (
      filters.searchText ||
      filters.startDate ||
      filters.endDate ||
      (filters.products && filters.products.length > 0) ||
      (filters.markets && filters.markets.length > 0)
    );
  };


  // Navigate to edit contract page
  const openEditModal = (contract) => {
    navigate("/hop-dong/chinh-sua", {
      state: { contract },
    });
  };

  // Navigate to add contract page
  const openAddModal = () => {
    navigate("/hop-dong/them-moi");
  };


  // Open delete confirmation modal
  const openDeleteConfirm = (contract) => {
    setDeletingContract(contract);
  };

  // Close delete confirmation modal
  const closeDeleteConfirm = () => {
    setDeletingContract(null);
  };

  // Delete contract from Firebase
  const handleDeleteContract = async () => {
    if (!deletingContract) return;

    try {
      // determine firebase key (if provided) or try to find by id
      let keyToRemove = deletingContract.firebaseKey;
      if (!keyToRemove) {
        const found = contracts.find((u) => u.id === deletingContract.id);
        if (found && found.firebaseKey) keyToRemove = found.firebaseKey;
      }

      if (keyToRemove) {
        const contractRef = ref(database, `contracts/${keyToRemove}`);
        await remove(contractRef);
        setContracts((prev) =>
          prev.filter((contract) => contract.firebaseKey !== keyToRemove)
        );
        setFilteredContracts((prev) =>
          prev.filter((contract) => contract.firebaseKey !== keyToRemove)
        );
      } else {
        // If no key found, just remove from local state by id as a fallback
        setContracts((prev) =>
          prev.filter((contract) => contract.id !== deletingContract.id)
        );
        setFilteredContracts((prev) =>
          prev.filter((contract) => contract.id !== deletingContract.id)
        );
      }

      closeDeleteConfirm();
      toast.success("Xóa hợp đồng thành công!");
    } catch (err) {
      console.error("Error deleting contract:", err);
      toast.error("Lỗi khi xóa hợp đồng");
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContracts = filteredContracts.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle checkbox selection
  const handleToggleContract = (contractKey) => {
    setSelectedContracts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contractKey)) {
        newSet.delete(contractKey);
      } else {
        newSet.add(contractKey);
      }
      return newSet;
    });
  };

  // Handle select all on current page
  const handleSelectAll = () => {
    // Only select contracts that are not exported (status !== "xuất")
    const selectableContracts = currentContracts.filter((c) => c.status !== "xuất");
    const allCurrentKeys = selectableContracts.map((c) => c.firebaseKey || c.id).filter(Boolean);
    const allSelected = allCurrentKeys.length > 0 && allCurrentKeys.every((key) => selectedContracts.has(key));
    
    setSelectedContracts((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        allCurrentKeys.forEach((key) => newSet.delete(key));
      } else {
        allCurrentKeys.forEach((key) => newSet.add(key));
      }
      return newSet;
    });
  };

  // Open export confirmation modal
  const openExportModal = () => {
    if (selectedContracts.size === 0) {
      toast.warning("Vui lòng chọn ít nhất một hợp đồng để xuất!");
      return;
    }
    setIsExportModalOpen(true);
  };

  // Close export confirmation modal
  const closeExportModal = () => {
    setIsExportModalOpen(false);
  };

  // Load promotions from Firebase
  const loadPromotions = async () => {
    console.log('Loading promotions...');
    setLoadingPromotions(true);
    try {
      const promotionsList = await loadPromotionsFromFirebase();
      console.log('Raw promotions from Firebase:', promotionsList);
      
      // Ensure all promotions have the required fields with default values
      const formattedPromotions = promotionsList.map(promotion => {
        // If it's an old format (just a string), convert to new format
        if (typeof promotion === 'string') {
          return {
            id: Math.random().toString(36).substr(2, 9), // Generate a random ID
            name: promotion,
            type: 'display',
            value: 0,
            maxDiscount: 0,
            minPurchase: 0,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          };
        }
        
        // For existing objects, ensure all fields are present; giữ dongXe để hiển thị đúng
        return {
          id: promotion.id || Math.random().toString(36).substr(2, 9),
          name: promotion.name || 'Tên ưu đãi',
          type: promotion.type || 'display',
          value: typeof promotion.value === 'number' ? promotion.value : 0,
          maxDiscount: typeof promotion.maxDiscount === 'number' ? promotion.maxDiscount : 0,
          minPurchase: typeof promotion.minPurchase === 'number' ? promotion.minPurchase : 0,
          dongXe: promotion.dongXe,
          createdAt: promotion.createdAt || new Date().toISOString(),
          createdBy: promotion.createdBy || 'system'
        };
      });
      
      console.log('Formatted promotions:', formattedPromotions);
      setPromotions(formattedPromotions);
      
      if (formattedPromotions.length === 0) {
        console.warn('No promotions found in the database');
        // Add default promotions if none found
        const defaultPromotions = [
          {
            id: '1',
            name: 'Giảm trực tiếp 10.000.000 VNĐ',
            type: 'fixed',
            value: 10000000,
            maxDiscount: 0,
            minPurchase: 0,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          },
          {
            id: '2',
            name: 'Giảm thêm 5% tối đa 20.000.000 VNĐ',
            type: 'percentage',
            value: 5,
            maxDiscount: 20000000,
            minPurchase: 0,
            createdAt: new Date().toISOString(),
            createdBy: 'system'
          }
        ];
        setPromotions(defaultPromotions);
      }
    } catch (error) {
      console.error("Error loading promotions:", error);
      toast.error("Lỗi khi tải chương trình ưu đãi: " + (error.message || 'Lỗi không xác định'));
      
      // Fallback to default promotions on error
      const defaultPromotions = [
        {
          id: '1',
          name: 'Giảm trực tiếp 10.000.000 VNĐ',
          type: 'fixed',
          value: 10000000,
          maxDiscount: 0,
          minPurchase: 0,
          createdAt: new Date().toISOString(),
          createdBy: 'system'
        },
        {
          id: '2',
          name: 'Giảm thêm 5% tối đa 20.000.000 VNĐ',
          type: 'percentage',
          value: 5,
          maxDiscount: 20000000,
          minPurchase: 0,
          createdAt: new Date().toISOString(),
          createdBy: 'system'
        }
      ];
      setPromotions(defaultPromotions);
    } finally {
      setLoadingPromotions(false);
    }
  };
  
  // Load promotions when component mounts
  useEffect(() => {
    loadPromotions();
  }, []);

  // Open add promotion modal
  const openAddPromotionModal = () => {
    setIsAddPromotionModalOpen(true);
    setFilterType('all'); // Reset to show all promotions
    setSelectedDongXeFilter('all'); // Reset filter
    setNewPromotionName('');
    setPromotionType('display');
    setSelectedDongXeList([]);
    setEditingPromotion({
      id: null,
      name: '',
      type: 'display',
      value: 0,
      maxDiscount: 0,
      minPurchase: 0
    });
  };

  // Close add promotion modal
  const closeAddPromotionModal = () => {
    setIsAddPromotionModalOpen(false);
    setEditingPromotion({
      id: null,
      name: '',
      type: 'display',
      value: 0,
      maxDiscount: 0,
      minPurchase: 0
    });
    setNewPromotionName('');
    setPromotionType('display');
    setSelectedDongXeList([]);
  };

  // Handle promotion type change
  const handlePromotionTypeChange = (type) => {
    setPromotionType(type);
    setEditingPromotion({
      ...editingPromotion,
      type,
      value: 0,
      maxDiscount: 0,
      minPurchase: 0
    });
  };

  // Add new promotion
  const handleAddPromotion = async () => {
    if (!newPromotionName || !newPromotionName.trim()) {
      toast.warning("Vui lòng nhập tên chương trình ưu đãi!");
      return;
    }

    if (promotionType !== 'display' && (!editingPromotion.value || editingPromotion.value <= 0)) {
      toast.warning(`Vui lòng nhập ${promotionType === 'percentage' ? 'phần trăm giảm giá' : 'số tiền giảm'} hợp lệ!`);
      return;
    }

    try {
      const newPromotion = {
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

      const promotionsRef = ref(database, 'promotions');
      const newPromotionRef = push(promotionsRef);
      
      await set(newPromotionRef, {
        ...newPromotion,
        id: newPromotionRef.key // Add the ID to the promotion object
      });
      
      toast.success("Thêm chương trình ưu đãi thành công!");
      setNewPromotionName('');
      setSelectedDongXeList([]);
      setEditingPromotion({
        id: null,
        name: '',
        type: 'display',
        value: 0,
        maxDiscount: 0,
        minPurchase: 0
      });
      await loadPromotions(); // Reload list
    } catch (err) {
      console.error("Error adding promotion:", err);
      toast.error("Lỗi khi thêm chương trình ưu đãi: " + err.message);
    }
  };

  // Start editing promotion — khôi phục dòng xe áp dụng để hiển thị đúng khi sửa
  const startEditPromotion = (promotion) => {
    const dongXe = normalizeDongXe(promotion.dongXe);
    setSelectedDongXeList(dongXe);
    setEditingPromotion({
      id: promotion.id,
      name: promotion.name || '',
      type: promotion.type || 'display',
      value: promotion.value || 0,
      maxDiscount: promotion.maxDiscount || 0,
      minPurchase: promotion.minPurchase || 0,
      dongXe: [...dongXe],
    });
    setPromotionType(promotion.type || 'display');
  };

  // Cancel editing
  const cancelEditPromotion = () => {
    setSelectedDongXeList([]);
    setEditingPromotion({
      id: null,
      name: '',
      type: 'display',
      value: 0,
      maxDiscount: 0,
      minPurchase: 0
    });
    setPromotionType('display');
  };

  // Save edited promotion
  const handleSaveEditPromotion = async () => {
    if (!editingPromotion.name || !editingPromotion.name.trim()) {
      toast.warning("Vui lòng nhập tên chương trình ưu đãi!");
      return;
    }

    if (editingPromotion.type !== 'display' && (!editingPromotion.value || editingPromotion.value <= 0)) {
      toast.warning(`Vui lòng nhập ${editingPromotion.type === 'percentage' ? 'phần trăm giảm giá' : 'số tiền giảm'} hợp lệ!`);
      return;
    }

    try {
      const promotionRef = ref(database, `promotions/${editingPromotion.id}`);
      const dongXeToSave = normalizeDongXe(selectedDongXeList);
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
      cancelEditPromotion();
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

    try {
      const promotionRef = ref(database, `promotions/${deletingPromotionId}`);
      await remove(promotionRef);
      
      toast.success("Xóa chương trình ưu đãi thành công!");
      setDeletingPromotionId(null);
      await loadPromotions(); // Reload list
    } catch (err) {
      console.error("Error deleting promotion:", err);
      toast.error("Lỗi khi xóa chương trình ưu đãi: " + err.message);
    }
  };

  // Export selected contracts to exportedContracts
  const handleExportContracts = async () => {
    if (selectedContracts.size === 0) return;

    try {
      // Get all contracts to export
      const contractsToExport = contracts.filter((contract) => {
        const key = contract.firebaseKey || contract.id;
        return key && selectedContracts.has(key);
      });

      // Validate required fields before export
      const requiredFields = ['customerName', 'phone', 'model', 'cccd'];
      const invalidContracts = contractsToExport.filter((c) =>
        requiredFields.some((f) => !c[f] || !String(c[f]).trim())
      );

      if (invalidContracts.length > 0) {
        toast.error(
          `${invalidContracts.length} hợp đồng thiếu thông tin bắt buộc (Tên KH, SĐT, Dòng xe, CCCD)`
        );
        return;
      }

      const exportedContractsRef = ref(database, "exportedContracts");

      // Prepare data for export with all required fields
      const exportedKeys = []; // Store exported keys to pass to next page
      const exportPromises = contractsToExport.map(async (contract) => {
        const safeValue = (val) => val !== undefined && val !== null ? val : "";
        
        // Get current date/time in format YYYY-MM-DD
        const now = new Date();
        const ngayXhd = now.toISOString().split("T")[0];
        
        // Map contract data to exported format (matching HopDongDaXuat format)
        const exportedData = {
          id: safeValue(contract.id),
          stt: safeValue(contract.stt),
          "ngày xhd": ngayXhd, // Export date - now
          tvbh: safeValue(contract.TVBH || contract.tvbh),
          showroom: safeValue(contract.showroom || contract.Showroom || contract["Showroom"] || ""),
          VSO: safeValue(contract.vso),
          "Tên Kh": safeValue(contract.customerName),
          "Số Điện Thoại": safeValue(contract.phone),
          Email: safeValue(contract.email || contract.Email || contract["Email"] || ""),
          "Địa Chỉ": safeValue(contract.address || contract["Địa chỉ"] || contract["Địa Chỉ"] || ""),
          CCCD: safeValue(contract.cccd),
          "Ngày Cấp": safeValue(contract.issueDate),
          "Nơi Cấp": safeValue(contract.issuePlace),
          "Dòng xe": safeValue(contract.model),
          "Phiên Bản": safeValue(contract.variant),
          "Ngoại Thất": safeValue(contract.exterior),
          "Nội Thất": safeValue(contract.interior),
          "Giá Niêm Yết": safeValue(contract.contractPrice),
          "Giá Giảm": safeValue(contract.deposit),
          "Giá Hợp Đồng": safeValue(contract.contractPrice),
          "Số Khung": safeValue(contract.soKhung || contract.chassisNumber || contract["Số Khung"] || ""),
          "Số Máy": safeValue(contract.soMay || contract.engineNumber || contract["Số Máy"] || ""),
          "Tình Trạng": safeValue(contract.tinhTrangXe || contract.vehicleStatus || contract["Tình Trạng Xe"] || ""), // Tình trạng xe, không phải tình trạng hợp đồng
          "ngân hàng": safeValue(contract.bank || contract.nganHang || contract["ngân hàng"] || ""),
          "ưu đãi": (() => {
            const uuDaiValue = contract.uuDai || contract["Ưu đãi"] || contract["ưu đãi"] || "";
            if (Array.isArray(uuDaiValue)) {
              return uuDaiValue.length > 0 ? uuDaiValue.join(", ") : "";
            }
            return safeValue(uuDaiValue);
          })(),
          "Quà tặng": safeValue(contract.quaTang || contract["Quà tặng"] || contract["quà tặng"] || ""),
          "Quà tặng khác": safeValue(contract.quaTangKhac || contract["Quà tặng khác"] || contract["quà tặng khác"] || ""),
          "Giảm giá": safeValue(contract.giamGia || contract["Giảm giá"] || contract["giảm giá"] || ""),
          quaTang: safeValue(contract.quaTang || contract["Quà tặng"] || contract["quà tặng"] || ""),
          quaTangKhac: safeValue(contract.quaTangKhac || contract["Quà tặng khác"] || contract["quà tặng khác"] || ""),
          giamGia: safeValue(contract.giamGia || contract["Giảm giá"] || contract["giảm giá"] || ""),
        };

        // Use firebaseKey as the key in exportedContracts, or generate new key
        const exportKey = contract.firebaseKey || `exported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        exportedKeys.push(exportKey); // Store the key
        const exportRef = ref(database, `exportedContracts/${exportKey}`);
        await set(exportRef, exportedData);
      });

      await Promise.all(exportPromises);

      // Update status of exported contracts to "xuất"
      const updateStatusPromises = contractsToExport.map(async (contract) => {
        const targetKey = contract.firebaseKey;
        if (targetKey) {
          const contractRef = ref(database, `contracts/${targetKey}`);
          await update(contractRef, {
            trangThai: "xuất",
          });
        }
      });

      await Promise.all(updateStatusPromises);

      // Update local state to reflect status change
      setContracts((prev) =>
        prev.map((contract) => {
          const key = contract.firebaseKey || contract.id;
          if (key && selectedContracts.has(key)) {
            return { ...contract, status: "xuất" };
          }
          return contract;
        })
      );
      setFilteredContracts((prev) =>
        prev.map((contract) => {
          const key = contract.firebaseKey || contract.id;
          if (key && selectedContracts.has(key)) {
            return { ...contract, status: "xuất" };
          }
          return contract;
        })
      );

      // Clear selection
      setSelectedContracts(new Set());
      closeExportModal();
      toast.success(`Đã xuất ${contractsToExport.length} hợp đồng thành công!`);
      
      // Navigate to exported contracts page after successful export with state to open image modal
      // Pass the first exported contract's key to open image modal
      const firstExportedKey = exportedKeys[0] || contractsToExport[0]?.firebaseKey;
      setTimeout(() => {
        navigate("/hop-dong-da-xuat", { 
          state: { 
            openImageModal: true, 
            contractKey: firstExportedKey,
            exportedCount: contractsToExport.length
          } 
        });
      }, 1000); // Small delay to show the success message
    } catch (err) {
      console.error("Error exporting contracts:", err);
      toast.error("Lỗi khi xuất hợp đồng: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 bg-gradient-to-br from-slate-100 to-slate-200 min-h-screen">
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-500 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-sm sm:text-base text-secondary-600">Đang tải dữ liệu hợp đồng...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 bg-gradient-to-br from-slate-100 to-slate-200 min-h-screen">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <button
                onClick={() => navigate("/menu")}
                className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2 px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-100"
                aria-label="Quay lại"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Quay lại</span>
              </button>
              <h2 className="text-xl sm:text-2xl font-bold text-primary-700 truncate">Hợp đồng</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {userRole === "admin" && selectedContracts.size > 0 && (
                <button
                  onClick={openExportModal}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg border-2 border-transparent hover:bg-white hover:border-primary-600 hover:text-primary-600 transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất hợp đồng ({selectedContracts.size})</span>
                </button>
              )}
              {userRole === "admin" && (
                <button
                  onClick={openAddPromotionModal}
                  className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg border-2 border-transparent hover:bg-white hover:border-purple-600 hover:text-purple-600 transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
                >
                  <Gift className="w-4 h-4" />
                  <span>Thêm chương trình ưu đãi</span>
                </button>
              )}
              <button
                onClick={openAddModal}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-secondary-600 text-white rounded-lg border-2 border-transparent hover:bg-white hover:border-secondary-600 hover:text-secondary-600 transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm mới</span>
              </button>
            </div>
          </div>

      {/* Filter Panel - Horizontal */}
      <div className="mb-6">
        <FilterPanel
          activeTab={'hopdong'}
          filters={filters}
          handleFilterChange={handleFilterChange}
          quickSelectValue={quickSelectValue}
          handleQuickDateSelect={handleQuickDateSelect}
          availableFilters={availableFilters}
          userRole={userRole}
          hasActiveFilters={hasActiveFilters}
          clearAllFilters={clearAllFilters}
        />
      </div>

      {/* Statistics */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-sm sm:text-base text-secondary-600">
              Tổng số:{" "}
              <span className="font-semibold text-primary-600">
                {filteredContracts.length}
              </span>{" "}
              hợp đồng
              {filteredContracts.length > itemsPerPage && (
                <span className="hidden sm:inline ml-2">
                  | Trang {currentPage}/{totalPages}
                  <span className="ml-2 text-sm">
                    (Hiển thị {startIndex + 1}-
                    {Math.min(endIndex, filteredContracts.length)})
                  </span>
                </span>
              )}
            </p>
            {filteredContracts.length > itemsPerPage && (
              <p className="text-xs sm:hidden text-secondary-500">
                Trang {currentPage}/{totalPages} ({startIndex + 1}-{Math.min(endIndex, filteredContracts.length)})
              </p>
            )}
          </div>

      {/* User Management Table */}
      {filteredContracts.length === 0 ? (
            <div className="text-center py-8 bg-secondary-50 rounded-lg">
              <p className="text-secondary-600">Không có dữ liệu hợp đồng</p>
            </div>
          ) : (
            <div className="overflow-x-auto shadow-md rounded-lg -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-secondary-100">
                  <thead className="bg-primary-400">
                    <tr>
                      {userRole === "admin" && (
                        <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                          {currentContracts.some((c) => c.status !== "xuất") && (
                            <input
                              type="checkbox"
                              checked={currentContracts.length > 0 && currentContracts.filter((c) => c.status !== "xuất").every((c) => {
                                const key = c.firebaseKey || c.id;
                                return key && selectedContracts.has(key);
                              })}
                              onChange={handleSelectAll}
                              className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                            />
                          )}
                        </th>
                      )}
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        STT
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Mã HĐ
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Ngày tạo
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        TVBH
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Showroom
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        VSO
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Tên KH
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Số Điện thoại
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        email
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Địa chỉ
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        sô CCCD
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Ngày Cấp
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Nơi Cấp
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Dòng xe
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Phiên Bản
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Ngoại Thất
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Nội Thất
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Giá HD
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Số tiền cọc
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        thanh toán
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        ngân hàng
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        ưu đãi
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        trạng thái
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 sticky right-0 z-30 bg-primary-400 whitespace-nowrap">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                <tbody className="bg-neutral-white divide-y divide-secondary-100">
                  {currentContracts.map((contract, index) => {
                    const contractKey = contract.firebaseKey || contract.id;
                    const isSelected = contractKey && selectedContracts.has(contractKey);
                    const isExported = contract.status === "xuất";
                    return (
                    <tr
                      key={contractKey}
                      className={`hover:bg-secondary-50 ${isSelected ? 'bg-primary-50' : ''}`}
                    >
                      {userRole === "admin" && (
                        <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                          {!isExported && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleContract(contractKey)}
                              className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                            />
                          )}
                        </td>
                      )}
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-semibold text-black border border-secondary-400">
                        {startIndex + index + 1}
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        <div className="max-w-[80px] sm:max-w-none truncate font-mono text-[10px] sm:text-xs" title={contract.firebaseKey || contract.id || "-"}>
                          {(contract.firebaseKey || contract.id || "-").slice(-8)}
                        </div>
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        {contract.createdAt || contract["Ngày tạo"] || "-"}
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        <div className="max-w-[80px] sm:max-w-none truncate" title={contract["TVBH"] || contract["Họ Và Tên"] || contract.name || "-"}>
                          {contract["TVBH"] ||
                            contract["Họ Và Tên"] ||
                            contract.name ||
                            "-"}
                        </div>
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        <div className="max-w-[80px] sm:max-w-none truncate" title={getShowroomShortName(contract.showroom || contract["Showroom"] || "")}>
                          {getShowroomShortName(contract.showroom || contract["Showroom"] || "")}
                        </div>
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        {contract.vso || contract["VSO"] || "-"}
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        <div className="max-w-[100px] sm:max-w-none truncate" title={contract.customerName || contract["Tên KH"] || "-"}>
                          {contract.customerName || contract["Tên KH"] || "-"}
                        </div>
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        {contract.phone ||
                          contract["Số Điện Thoại"] ||
                          contract.phoneNumber ||
                          "-"}
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        <div className="max-w-[120px] sm:max-w-none truncate" title={contract.email || "-"}>
                          {contract.email || "-"}
                        </div>
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        <div className="max-w-[120px] sm:max-w-none truncate" title={contract.address || contract["Địa chỉ"] || "-"}>
                          {contract.address || contract["Địa chỉ"] || "-"}
                        </div>
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        {contract.cccd ||
                          contract["sô CCCD"] ||
                          contract["số CCCD"] ||
                          "-"}
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        {contract.issueDate || contract["Ngày Cấp"] || "-"}
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        <div className="max-w-[100px] sm:max-w-none truncate" title={contract.issuePlace || contract["Nơi Cấp"] || "-"}>
                          {contract.issuePlace || contract["Nơi Cấp"] || "-"}
                        </div>
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        {contract.model || contract["Dòng xe"] || "-"}
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        <div className="max-w-[100px] sm:max-w-none truncate" title={contract.variant || contract["Phiên Bản"] || "-"}>
                          {contract.variant || contract["Phiên Bản"] || "-"}
                        </div>
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        <div className="max-w-[100px] sm:max-w-none truncate" title={getColorName(contract.exterior || contract["Ngoại Thất"] || contract.ngoaiThat, true)}>
                          {getColorName(contract.exterior || contract["Ngoại Thất"] || contract.ngoaiThat, true)}
                        </div>
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        <div className="max-w-[100px] sm:max-w-none truncate" title={getColorName(contract.interior || contract["Nội Thất"] || contract.noiThat, false)}>
                          {getColorName(contract.interior || contract["Nội Thất"] || contract.noiThat, false)}
                        </div>
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        {formatCurrency(
                          contract.contractPrice ||
                          contract["Giá HD"] ||
                          ""
                        )}
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        {formatCurrency(
                          contract.deposit || 
                          contract["Số tiền cọc"] || 
                          ""
                        )}
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        {contract.payment || contract["thanh toán"] || "-"}
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        <div className="max-w-[100px] sm:max-w-none truncate" title={contract.bank || contract["ngân hàng"] || "-"}>
                          {contract.bank || contract["ngân hàng"] || "-"}
                        </div>
                      </td>

                      <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-black border border-secondary-400 max-w-xs">
                        {(() => {
                          const uuDaiValue = contract.uuDai || contract["Ưu đãi"] || contract["ưu đãi"] || "";
                          if (!uuDaiValue) return "-";
                          // Handle array or string
                          const uuDaiArray = Array.isArray(uuDaiValue) 
                            ? uuDaiValue 
                            : (typeof uuDaiValue === 'string' && uuDaiValue.includes(',') 
                                ? uuDaiValue.split(',').map(v => v.trim()).filter(Boolean)
                                : [uuDaiValue]);
                          
                          if (uuDaiArray.length === 0) return "-";
                          
                          // Display all promotions in compact badges
                          return (
                            <div className="flex flex-wrap gap-1">
                              {uuDaiArray.map((item, idx) => (
                                <div 
                                  key={idx} 
                                  className="text-[10px] sm:text-xs bg-primary-100 text-primary-800 px-1 sm:px-2 py-0.5 rounded truncate max-w-[150px] sm:max-w-[200px]"
                                  title={item}
                                >
                                  {item}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </td>

                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        {contract.status || "-"}
                      </td>
                      {/* Actions column - sticky to right */}
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400 sticky right-0 z-20 bg-primary-200">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <button
                            onClick={() => openEditModal(contract)}
                            className="px-1.5 sm:px-3 py-1 bg-secondary-600 text-white rounded-md hover:bg-secondary-700 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                            aria-label={`Sửa hợp đồng ${
                              contract.customerName || contract.id
                            }`}
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Sửa</span>
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(contract)}
                            className="px-1.5 sm:px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                            aria-label={`Xóa hợp đồng ${
                              contract.customerName || contract.id
                            }`}
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Xóa</span>
                          </button>
                          {/* Print / In hợp đồng button */}
                          <button
                            onClick={() => {
                              // Navigate to print contract page with prepared data
                              const printData = {
                                id: contract.id,
                                stt: contract.stt || startIndex + index + 1,
                                createdAt:
                                  contract.createdAt || contract.createdDate,
                                TVBH: contract.TVBH || contract.tvbh,
                                showroom: contract.showroom,
                                vso: contract.vso,
                                customerName:
                                  contract.customerName || contract["Tên KH"],
                                phone: contract.phone,
                                email: contract.email,
                                Email: contract.email,
                                address: contract.address,
                                cccd: contract.cccd,
                                issueDate: contract.issueDate || contract.ngayCap,
                                issuePlace: contract.issuePlace || contract.noiCap,
                                model: contract.model || contract.dongXe,
                                variant: contract.variant || contract.phienBan,
                                exterior: contract.exterior || contract.ngoaiThat,
                                interior: contract.interior || contract.noiThat,
                                contractPrice:
                                  contract.contractPrice || contract.giaHD,
                                deposit: contract.deposit || contract.soTienCoc,
                                payment: contract.payment || contract.thanhToan,
                                loanAmount: contract.loanAmount || contract.soTienVay || "",
                                bank: contract.bank || contract.nganHang,
                                uuDai: (() => {
                                  const uuDaiValue = contract.uuDai || contract["Ưu đãi"] || contract["ưu đãi"] || "";
                                  return Array.isArray(uuDaiValue) ? uuDaiValue : (uuDaiValue ? [uuDaiValue] : []);
                                })(),
                                status: contract.status,
                                soKhung: contract.soKhung || contract["Số Khung"] || contract.chassisNumber || contract.vin || "",
                                soMay: contract.soMay || contract["Số Máy"] || contract.engineNumber || "",
                                "Số Khung": contract.soKhung || contract["Số Khung"] || contract.chassisNumber || contract.vin || "",
                                "Số Máy": contract.soMay || contract["Số Máy"] || contract.engineNumber || "",
                                chassisNumber: contract.soKhung || contract["Số Khung"] || contract.chassisNumber || contract.vin || "",
                                engineNumber: contract.soMay || contract["Số Máy"] || contract.engineNumber || "",
                                representativeName: contract.TVBH || contract.tvbh || "",
                                quaTang: contract.quaTang || contract["Quà tặng"] || contract["quà tặng"] || "",
                                quaTangKhac: contract.quaTangKhac || contract["Quà tặng khác"] || contract["quà tặng khác"] || "",
                                giamGia: contract.giamGia || contract["Giảm giá"] || contract["giảm giá"] || "",
                                "Quà tặng": contract.quaTang || contract["Quà tặng"] || contract["quà tặng"] || "",
                                "Quà tặng khác": contract.quaTangKhac || contract["Quà tặng khác"] || contract["quà tặng khác"] || "",
                                "Giảm giá": contract.giamGia || contract["Giảm giá"] || contract["giảm giá"] || "",
                                // Company fields
                                khachHangLa: contract.khachHangLa || '',
                                msdn: contract.msdn || '',
                                daiDien: contract.daiDien || '',
                                chucVu: contract.chucVu || '',
                                giayUyQuyen: contract.giayUyQuyen || '',
                                giayUyQuyenNgay: contract.giayUyQuyenNgay || '',
                              };
                              navigate("/hop-dong-mua-ban-xe", { state: printData });
                            }}
                            className="px-1.5 sm:px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                            aria-label={`In hợp đồng ${
                              contract.customerName || contract.id
                            }`}
                          >
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 9V2h12v7M6 18h12v4H6v-4zM6 14h12v4H6v-4z"
                              ></path>
                            </svg>
                            <span className="hidden sm:inline">In</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>
            </div>
      )}

      {/* Pagination */}
      {filteredContracts.length > itemsPerPage && (
            <div className="mt-6 flex items-center justify-between border-t border-secondary-100 bg-neutral-white px-4 py-3 sm:px-6 rounded-lg shadow">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  }`}
                >
                  Trước
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  }`}
                >
                  Sau
                </button>
              </div>

              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-secondary-600">
                    Hiển thị <span className="font-medium">{startIndex + 1}</span>{" "}
                    đến{" "}
                    <span className="font-medium">
                      {Math.min(endIndex, filteredContracts.length)}
                    </span>{" "}
                    trong tổng số{" "}
                    <span className="font-medium">{filteredContracts.length}</span>{" "}
                    hợp đồng
                  </p>
                </div>
                <div>
                  <nav
                    className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                    aria-label="Pagination"
                  >
                    {/* Previous button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-secondary-400 ring-1 ring-inset ring-secondary-400 hover:bg-secondary-50 focus:z-20 focus:outline-offset-0 ${
                        currentPage === 1 ? "cursor-not-allowed opacity-50" : ""
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                page === currentPage
                                  ? "z-10 bg-primary-600 text-neutral-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                                  : "text-secondary-900 ring-1 ring-inset ring-secondary-400 hover:bg-secondary-50 focus:z-20 focus:outline-offset-0"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span
                              key={page}
                              className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      }
                    )}

                    {/* Next button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-secondary-400 ring-1 ring-inset ring-secondary-400 hover:bg-secondary-50 focus:z-20 focus:outline-offset-0 ${
                        currentPage === totalPages
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingContract && (
            <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="modal-box bg-white rounded-lg shadow-xl max-w-md w-full max-h-[calc(100vh-2rem)] overflow-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-pink-600 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg sticky top-0 z-10">
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Xác nhận xóa hợp đồng</span>
                  </h3>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  <p className="text-gray-700 mb-4">
                    Bạn có chắc chắn muốn xóa hợp đồng này không?
                  </p>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">Tên KH:</span>{" "}
                      <span className="text-gray-900">
                        {deletingContract.customerName ||
                          deletingContract["Họ Và Tên"] ||
                          "-"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">
                        Số điện thoại:
                      </span>{" "}
                      <span className="text-gray-900">
                        {deletingContract.phone || "-"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">Dòng xe:</span>{" "}
                      <span className="text-gray-900">
                        {deletingContract.model || deletingContract.dongXe || "-"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">VSO:</span>{" "}
                      <span className="text-gray-900">
                        {deletingContract.vso || "-"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">Ngày tạo:</span>{" "}
                      <span className="text-gray-900">
                        {deletingContract.createdAt ||
                          deletingContract.createdDate ||
                          "-"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">
                        Thanh toán:
                      </span>{" "}
                      <span className="text-gray-900">
                        {deletingContract.payment ||
                          deletingContract.thanhToan ||
                          "-"}
                      </span>
                    </p>
                    {(deletingContract.payment === "trả góp" || deletingContract.thanhToan === "trả góp") && (
                      <p className="text-sm">
                        <span className="font-semibold text-gray-700">
                          Số tiền vay:
                        </span>{" "}
                        <span className="text-gray-900">
                          {deletingContract.loanAmount ? formatCurrency(deletingContract.loanAmount) : "-"}
                        </span>
                      </p>
                    )}
                  </div>

                  <p className="text-red-600 font-medium text-sm mt-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Hành động này không thể hoàn tác!</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-lg flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 sticky bottom-0">
                  <button
                    onClick={closeDeleteConfirm}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                    aria-label="Hủy"
                  >
                    <X className="w-4 h-4" />
                    <span>Hủy</span>
                  </button>
                  <button
                    onClick={handleDeleteContract}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                    aria-label="Xóa hợp đồng"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa hợp đồng</span>
                  </button>
                </div>
              </div>
            </div>
      )}

      {/* Add Promotion Modal */}
      {isAddPromotionModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="modal-box bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[calc(100vh-2rem)] overflow-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-400 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg sticky top-0 z-10">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Quản lý chương trình ưu đãi</span>
              </h3>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              {/* Add new promotion form */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loại ưu đãi <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => handlePromotionTypeChange('display')}
                      className={`px-3 py-2 text-sm rounded-lg border ${
                        promotionType === 'display' 
                          ? 'bg-purple-100 border-purple-500 text-purple-700' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Chỉ hiển thị
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePromotionTypeChange('percentage')}
                      className={`px-3 py-2 text-sm rounded-lg border ${
                        promotionType === 'percentage' 
                          ? 'bg-purple-100 border-purple-500 text-purple-700' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Giảm %
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePromotionTypeChange('fixed')}
                      className={`px-3 py-2 text-sm rounded-lg border ${
                        promotionType === 'fixed' 
                          ? 'bg-purple-100 border-purple-500 text-purple-700' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Giảm tiền
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="promotionName" className="block text-sm font-medium text-gray-700 mb-2">
                    Tên chương trình ưu đãi <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="promotionName"
                    type="text"
                    value={editingPromotion.id ? editingPromotion.name : newPromotionName}
                    onChange={(e) => 
                      editingPromotion.id 
                        ? setEditingPromotion({...editingPromotion, name: e.target.value})
                        : setNewPromotionName(e.target.value)
                    }
                    placeholder="Ví dụ: Chính sách MLTTVN 3: Giảm 4% Tiền mặt"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm sm:text-base"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        editingPromotion.id ? handleSaveEditPromotion() : handleAddPromotion();
                      } else if (e.key === 'Escape' && editingPromotion.id) {
                        cancelEditPromotion();
                      }
                    }}
                  />
                </div>

                {/* Chọn dòng xe áp dụng */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dòng xe áp dụng
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {availableDongXeForPromotion.map((car) => (
                      <label key={car.code} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedDongXeList.includes(car.code)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDongXeList(prev => [...prev, car.code]);
                            } else {
                              setSelectedDongXeList(prev => prev.filter(code => code !== car.code));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-gray-700">{car.name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedDongXeList.length === 0 
                      ? 'Không chọn dòng xe nào = áp dụng cho tất cả dòng xe' 
                      : `Đã chọn ${selectedDongXeList.length} dòng xe`
                    }
                  </p>
                </div>

                {promotionType !== 'display' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="promotionValue" className="block text-sm font-medium text-gray-700 mb-2">
                        {promotionType === 'percentage' ? 'Phần trăm giảm giá (%)' : 'Số tiền giảm (VNĐ)'} <span className="text-red-500">*</span>
                      </label>
                      {promotionType === 'percentage' ? (
                        <input
                          id="promotionValue"
                          type="number"
                          min="0"
                          max="100"
                          value={editingPromotion.value}
                          onChange={(e) => setEditingPromotion({...editingPromotion, value: parseFloat(e.target.value) || 0})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm sm:text-base"
                          placeholder="0-100%"
                        />
                      ) : (
                        <CurrencyInput
                          value={editingPromotion.value}
                          onChange={(val) => setEditingPromotion({...editingPromotion, value: val})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm sm:text-base"
                          placeholder="0"
                        />
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <button
                    onClick={editingPromotion.id ? handleSaveEditPromotion : handleAddPromotion}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {editingPromotion.id ? (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Lưu thay đổi</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Thêm chương trình ưu đãi</span>
                      </>
                    )}
                  </button>
                  {editingPromotion.id && (
                    <button
                      onClick={cancelEditPromotion}
                      className="w-full mt-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Hủy chỉnh sửa</span>
                    </button>
                  )}
                </div>
              </div>

              {/* List of existing promotions */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Danh sách chương trình ưu đãi</h4>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-2 py-1 text-xs rounded-lg border ${
                        filterType === 'all'
                          ? 'bg-purple-100 border-purple-500 text-purple-700 font-medium'
                          : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                      }`}
                      title="Tất cả"
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setFilterType('display')}
                      className={`px-2 py-1 text-xs rounded-lg border ${
                        filterType === 'display'
                          ? 'bg-purple-100 border-purple-500 text-purple-700 font-medium'
                          : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                      }`}
                      title="Chỉ hiển thị"
                    >
                      Hiển thị
                    </button>
                    <button
                      onClick={() => setFilterType('percentage')}
                      className={`px-2 py-1 text-xs rounded-lg border ${
                        filterType === 'percentage'
                          ? 'bg-purple-100 border-purple-500 text-purple-700 font-medium'
                          : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                      }`}
                      title="Giảm %"
                    >
                      Giảm %
                    </button>
                    <button
                      onClick={() => setFilterType('fixed')}
                      className={`px-2 py-1 text-xs rounded-lg border ${
                        filterType === 'fixed'
                          ? 'bg-purple-100 border-purple-500 text-purple-700 font-medium'
                          : 'border-gray-300 hover:bg-gray-50 text-gray-600'
                      }`}
                      title="Giảm tiền"
                    >
                      Giảm tiền
                    </button>
                  </div>
                </div>

                {/* Lọc theo dòng xe */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lọc theo dòng xe
                  </label>
                  <select
                    value={selectedDongXeFilter}
                    onChange={(e) => setSelectedDongXeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  >
                    <option value="all">Tất cả dòng xe</option>
                    {availableDongXeForPromotion.map((car) => (
                      <option key={car.code} value={car.code}>{car.name}</option>
                    ))}
                  </select>
                </div>
                
                {loadingPromotions ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Đang tải...</p>
                  </div>
                ) : promotions.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Chưa có chương trình ưu đãi nào
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {promotions
                      .filter(promotion => filterType === 'all' || promotion.type === filterType)
                      .filter(promotion => {
                        // Lọc theo dòng xe đã chọn
                        if (selectedDongXeFilter === 'all') return true;
                        return filterPromotionsByDongXe([promotion], selectedDongXeFilter).length > 0;
                      })
                      .map((promotion) => (
                      <div
                        key={promotion.id}
                        className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3">
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
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{promotion.name}</span>
                                <span 
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    promotion.type === 'display' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : promotion.type === 'percentage' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-purple-100 text-purple-800'
                                  }`}
                                >
                                  {promotion.type === 'display' ? 'Chỉ hiển thị' : 
                                   promotion.type === 'percentage' ? 'Giảm %' : 'Giảm tiền'}
                                </span>
                              </div>
                            </div>
                            
                            {promotion.type === 'percentage' && (
                              <div className="text-sm text-gray-600 mt-1">
                                Giảm {promotion.value}% {promotion.maxDiscount > 0 ? `(tối đa ${formatCurrency(promotion.maxDiscount)} VNĐ)` : ''}
                              </div>
                            )}
                            
                            {promotion.type === 'fixed' && (
                              <div className="text-sm text-gray-600 mt-1">
                                Giảm {formatCurrency(promotion.value)} VNĐ
                              </div>
                            )}
                            
                            {/* Hiển thị dòng xe áp dụng */}
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="font-medium">Dòng xe:</span>{' '}
                              {promotion.dongXe && Array.isArray(promotion.dongXe) && promotion.dongXe.length > 0
                                ? promotion.dongXe.map(code => {
                                    const carMap = {
                                      'vf_3': 'VF 3', 'vf_5': 'VF 5', 'vf_6': 'VF 6', 'vf_7': 'VF 7', 
                                      'vf_8': 'VF 8', 'vf_9': 'VF 9', 'minio': 'Minio', 'herio': 'Herio', 
                                      'nerio': 'Nerio', 'limo': 'Limo', 'ec': 'EC', 'ec_nang_cao': 'EC Nâng Cao'
                                    };
                                    return carMap[code] || code;
                                  }).join(', ')
                                : 'Tất cả dòng xe'
                              }
                            </div>
                            
                            {promotion.minPurchase > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Áp dụng cho đơn hàng từ {formatCurrency(promotion.minPurchase)} VNĐ
                              </div>
                            )}
                            
                            {promotion.createdAt && (
                              <div className="text-xs text-gray-400 mt-1">
                                Tạo lúc: {new Date(promotion.createdAt).toLocaleString('vi-VN')}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditPromotion(promotion)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              aria-label="Sửa"
                              title="Sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeletePromotionConfirm(promotion.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              aria-label="Xóa"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-b-lg flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 sticky bottom-0 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Đã chọn: {selectedPromotionIds.size} ưu đãi
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    // Add selected promotions to contract form
                    const selectedPromotions = promotions.filter(p => selectedPromotionIds.has(p.id));
                    console.log('Selected promotions:', selectedPromotions);
                    // Here you would typically update the contract form state with the selected promotions
                    // For now, we'll just show a success message
                    toast.success(`Đã thêm ${selectedPromotions.length} ưu đãi vào hợp đồng`);
                    closeAddPromotionModal();
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
                  onClick={closeAddPromotionModal}
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

      {/* Delete Promotion Confirmation Modal */}
      {deletingPromotionId && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="modal-box bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg">
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Xác nhận xóa</span>
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-gray-700 mb-4">
                Bạn có chắc chắn muốn xóa chương trình ưu đãi này không?
              </p>
              {promotions.find(p => p.id === deletingPromotionId) && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {promotions.find(p => p.id === deletingPromotionId).name}
                  </p>
                </div>
              )}
              <p className="text-red-600 font-medium text-sm mt-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Hành động này không thể hoàn tác!</span>
              </p>
            </div>
            <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-lg flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={closeDeletePromotionConfirm}
                className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <X className="w-4 h-4" />
                <span>Hủy</span>
              </button>
              <button
                onClick={handleDeletePromotion}
                className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Confirmation Modal */}
      {isExportModalOpen && (
            <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="modal-box bg-white rounded-lg shadow-xl max-w-md w-full max-h-[calc(100vh-2rem)] overflow-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-400 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg sticky top-0 z-10">
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Xác nhận xuất hợp đồng</span>
                  </h3>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  <p className="text-gray-700 mb-4">
                    Bạn có chắc chắn muốn xuất <span className="font-semibold text-primary-600">{selectedContracts.size}</span> hợp đồng đã chọn không?
                  </p>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 max-h-60 overflow-y-auto">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Danh sách hợp đồng sẽ được xuất:
                    </p>
                    {contracts
                      .filter((contract) => {
                        const key = contract.firebaseKey || contract.id;
                        return key && selectedContracts.has(key);
                      })
                      .map((contract, idx) => (
                        <div key={contract.firebaseKey || contract.id} className="text-sm border-b border-gray-200 pb-2 last:border-0">
                          <p className="text-gray-900">
                            <span className="font-semibold">{idx + 1}.</span>{" "}
                            {contract.customerName || contract["Tên KH"] || "-"} - {contract.phone || "-"}
                          </p>
                        </div>
                      ))}
                  </div>

                  <p className="text-primary-600 font-medium text-sm mt-4 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Hợp đồng sẽ được lưu vào danh sách hợp đồng đã xuất với ngày xuất là hôm nay.</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-b-lg flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 sticky bottom-0">
                  <button
                    onClick={closeExportModal}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                    aria-label="Hủy"
                  >
                    <X className="w-4 h-4" />
                    <span>Hủy</span>
                  </button>
                  <button
                    onClick={handleExportContracts}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                    aria-label="Xuất hợp đồng"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất hợp đồng</span>
                  </button>
                </div>
              </div>
            </div>
      )}
    </div>
  );
}
