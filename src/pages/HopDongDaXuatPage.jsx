import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import FilterPanel from "../components/FilterPanel";
import { ref, get, remove, update } from "firebase/database";
import { database } from "../firebase/config";
import { ArrowLeft, X, Trash2, Edit, AlertTriangle, Image } from "lucide-react";
import { toast } from "react-toastify";
import {
  uniqueNgoaiThatColors,
  uniqueNoiThatColors,
} from "../data/calculatorData";
import { uploadImageToCloudinary } from "../config/cloudinary";

export default function HopDongDaXuatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasOpenedImageModalRef = useRef(false); // Track if we've already opened the modal
  const [userTeam, setUserTeam] = useState("");
  const [userRole, setUserRole] = useState("user");
  const [userEmail, setUserEmail] = useState("");
  const [username, setUsername] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [actualEmployeeName, setActualEmployeeName] = useState(""); // Actual name from employees collection
  const [employeesMap, setEmployeesMap] = useState({}); // Map TVBH -> department
  const [teamEmployeeNames, setTeamEmployeeNames] = useState([]); // List of employee names in team (for leader)
  const [employeesLoaded, setEmployeesLoaded] = useState(false); // Flag to know when employees data is loaded

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    products: [], // will hold unique "Dòng xe" values
    markets: [], // repurposed to hold status values
    trangThai: [], // status filter for hopdongdaxuat
    showroom: [], // showroom filter for hopdongdaxuat
    searchText: "",
  });

  const [availableFilters, setAvailableFilters] = useState({
    products: [], // unique models (dongXe)
    markets: [], // status values
  });

  const [quickSelectValue, setQuickSelectValue] = useState("");

  // States from HopDongDaXuat component
  const [allContracts, setAllContracts] = useState([]); // Store all contracts before filtering
  const [contracts, setContracts] = useState([]); // Filtered contracts based on permissions
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingContract, setDeletingContract] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printContract, setPrintContract] = useState(null);
  const [bankLoanFile, setBankLoanFile] = useState(null); // File cho vay của NH cho Đề xuất bán hàng
  const [uploadingBankLoanFile, setUploadingBankLoanFile] = useState(false);
  const [currentContractKey, setCurrentContractKey] = useState(null); // Track which contract's file we're editing

  // Image modal states
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageContract, setCurrentImageContract] = useState(null);
  const [depositImage, setDepositImage] = useState("");
  const [counterpartImage, setCounterpartImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingImageType, setUploadingImageType] = useState(null); // 'deposit' or 'counterpart'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Restore print modal from sessionStorage when returning from a form page
  useEffect(() => {
    const savedPrintState = sessionStorage.getItem('printModalState');
    if (savedPrintState) {
      try {
        const { printContract: savedContract, contractKey, bankLoanFile: savedBankLoanFile } = JSON.parse(savedPrintState);
        if (savedContract) {
          setPrintContract(savedContract);
          setCurrentContractKey(contractKey);
          setBankLoanFile(savedBankLoanFile || null);
          setIsPrintModalOpen(true);
        }
      } catch (e) {
        console.error('Error restoring print modal state:', e);
        sessionStorage.removeItem('printModalState');
      }
    }
  }, []);

  // Helper function to save print modal state to sessionStorage
  const savePrintModalState = (contract, contractKey, file) => {
    sessionStorage.setItem('printModalState', JSON.stringify({
      printContract: contract,
      contractKey: contractKey,
      bankLoanFile: file
    }));
  };

  // Helper function to clear print modal state from sessionStorage
  const clearPrintModalState = () => {
    sessionStorage.removeItem('printModalState');
  };

  useEffect(() => {
    const team = localStorage.getItem("userTeam") || "";
    const role = localStorage.getItem("userRole") || "user";
    const email = localStorage.getItem("userEmail") || "";
    const usernameValue = localStorage.getItem("username") || "";
    const userDepartmentValue = localStorage.getItem("userDepartment") || "";

    setUserTeam(team);
    setUserRole(role);
    setUserEmail(email);
    setUsername(usernameValue);
    setUserDepartment(userDepartmentValue);

    // populate filters by scanning exported contracts in Firebase
    const fetchFiltersFromDB = async () => {
      try {
        // Try exportedContracts first
        let contractsRef = ref(database, "exportedContracts");
        let snapshot = await get(contractsRef);
        let data = snapshot.exists() ? snapshot.val() : {};

        // If no exportedContracts, try to filter from contracts with status "xuất"
        if (!snapshot.exists() || Object.keys(data).length === 0) {
          contractsRef = ref(database, "contracts");
          snapshot = await get(contractsRef);
          const allContracts = snapshot.exists() ? snapshot.val() : {};

          data = {};
          Object.entries(allContracts || {}).forEach(([key, contract]) => {
            const status = contract.trangThai || contract.status || "";
            if (
              status.toLowerCase() === "xuất" ||
              status.toLowerCase() === "đã xuất"
            ) {
              data[key] = contract;
            }
          });
        }

        const contracts = Object.values(data || {});

        const models = [
          ...new Set(
            contracts
              .map((c) => c.dongXe || c["Dòng xe"] || c.model)
              .filter(Boolean)
          ),
        ].sort();
        const statuses = [
          ...new Set(
            contracts
              .map(
                (c) => c.tinhTrang || c["Tình Trạng"] || c.status || c.trangThai
              )
              .filter(Boolean)
          ),
        ].sort();

        setAvailableFilters((prev) => ({
          ...prev,
          products: models,
          markets: statuses,
        }));
      } catch (err) {
        console.error(
          "Error loading filter options from Firebase exported contracts",
          err
        );
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
            const employeeEmail = (
              employee &&
              (employee.mail || employee.Mail || employee.email || "")
            )
              .toString()
              .toLowerCase();
            return employeeEmail === userEmail.toLowerCase();
          });

          if (userEntry) {
            const [userId, employeeData] = userEntry;
            // Get actual name from employee - try multiple fields
            foundEmployeeName =
              employeeData.TVBH ||
              employeeData.user ||
              employeeData.username ||
              employeeData.name ||
              "";
            setActualEmployeeName(foundEmployeeName);
          }
        }

        // Build employees mapping and team names
        Object.entries(data).forEach(([key, employee]) => {
          const employeeName =
            employee.TVBH ||
            employee.user ||
            employee.username ||
            employee.name ||
            "";
          const employeeDept =
            employee.phongBan ||
            employee["Phòng Ban"] ||
            employee.department ||
            employee["Bộ phận"] ||
            "";
          const employeeEmail = (
            employee.mail ||
            employee.Mail ||
            employee.email ||
            ""
          )
            .toString()
            .toLowerCase();

          if (employeeName) {
            employeesMapping[employeeName] = employeeDept;

            // For leader: collect all employees in same department
            if (
              userRole === "leader" &&
              userDepartment &&
              employeeDept === userDepartment
            ) {
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

  // Helper function to map color code to name
  const getColorName = (colorCode, isExterior = true) => {
    if (!colorCode) return colorCode || "-";
    const colorList = isExterior ? uniqueNgoaiThatColors : uniqueNoiThatColors;
    const found = colorList.find(
      (color) =>
        color.code === colorCode ||
        color.name.toLowerCase() === colorCode.toLowerCase()
    );
    return found ? found.name : colorCode; // Return name if found, otherwise return original value
  };

  // Load all exported contracts from Firebase (without permission filter)
  useEffect(() => {
    const mapContract = (c) => ({
      id: c.id || "",
      stt: c.stt || "",
      ngayXhd: c["ngày xhd"] || "",
      tvbh: c.tvbh || "",
      showroom: c.showroom || c.Showroom || c["Showroom"] || "",
      vso: c.vso || c.VSO || "",
      tenKh: c["Tên Kh"] || "",
      soDienThoai: c["Số Điện Thoại"] || "",
      email: c.Email || "",
      diaChi: c["Địa Chỉ"] || "",
      cccd: c.CCCD || "",
      ngayCap: c["Ngày Cấp"] || "",
      noiCap: c["Nơi Cấp"] || "",
      dongXe: c["Dòng xe"] || "",
      phienBan: c["Phiên Bản"] || "",
      ngoaiThat: c["Ngoại Thất"] || "",
      noiThat: c["Nội Thất"] || "",
      giaNiemYet: c["Giá Niêm Yết"] || "",
      giaGiam: c["Giá Giảm"] || "",
      giaHopDong: c["Giá Hợp Đồng"] || "",
      giaXuatHoaDon: c.giaXuatHoaDon || c["Giá Xuất Hóa Đơn"] || c["Giá Hợp Đồng"] || "",
      soKhung: c["Số Khung"] || "",
      soMay: c["Số Máy"] || "",
      tinhTrang: c["Tình Trạng"] || "",
      nganHang: c["ngân hàng"] || c.nganHang || c.bank || "",
      // Tiền đặt cọc
      tienDatCoc:
        c["Tiền đặt cọc"] ||
        c.tienDatCoc ||
        c["Số tiền cọc"] ||
        c.soTienCoc ||
        c.deposit ||
        c.giaGiam ||
        "",
      // Tiền đối ứng
      tienDoiUng:
        c["Tiền đối ứng"] ||
        c.tienDoiUng ||
        c.counterpartPayment ||
        c.payment ||
        "",
      // Tiền vay ngân hàng
      tienVayNganHang:
        c["Tiền vay ngân hàng"] ||
        c.tienVayNganHang ||
        c.loanAmount ||
        c["Tiền vay"] ||
        c.tienVay ||
        c.soTienVay ||
        "",
      // Thanh toán
      thanhToan: c.thanhToan || c.payment || "",
      depositImage: c.depositImage || c["Ảnh chụp hình đặt cọc"] || "",
      counterpartImage: c.counterpartImage || c["Ảnh chụp đối ứng"] || "",
      "Ảnh chụp hình đặt cọc":
        c.depositImage || c["Ảnh chụp hình đặt cọc"] || "",
      "Ảnh chụp đối ứng": c.counterpartImage || c["Ảnh chụp đối ứng"] || "",
      bankLoanFile: c.bankLoanFile || c["File cho vay ngân hàng"] || "",
      "File cho vay ngân hàng":
        c.bankLoanFile || c["File cho vay ngân hàng"] || "",
      quaTang: c.quaTang || c["Quà tặng"] || c["quà tặng"] || "",
      quaTangKhac: c.quaTangKhac || c["Quà tặng khác"] || c["quà tặng khác"] || "",
      giamGia: c.giamGia || c["Giảm giá"] || c["giảm giá"] || "",
      "Quà tặng": c.quaTang || c["Quà tặng"] || c["quà tặng"] || "",
      "Quà tặng khác": c.quaTangKhac || c["Quà tặng khác"] || c["quà tặng khác"] || "",
      "Giảm giá": c.giamGia || c["Giảm giá"] || c["giảm giá"] || "",
    });

    const loadFromFirebase = async () => {
      try {
        // Only load from exportedContracts path
        const contractsRef = ref(database, "exportedContracts");
        const snapshot = await get(contractsRef);
        const data = snapshot.exists() ? snapshot.val() : {};

        const mapped = Object.entries(data || {}).map(([key, c], idx) => {
          const base = mapContract(c || {});
          return { ...base, firebaseKey: key };
        });

        setAllContracts(mapped);
      } catch (err) {
        console.error("Error loading exported contracts from Firebase:", err);
        toast.error("Lỗi khi tải dữ liệu hợp đồng đã xuất từ Firebase");
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
          const contractTVBH = contract.tvbh || "";
          return (
            contractTVBH === actualEmployeeName ||
            contractTVBH.toLowerCase() === actualEmployeeName.toLowerCase()
          );
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
            const contractTVBH = contract.tvbh || "";
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
  }, [
    allContracts,
    userRole,
    actualEmployeeName,
    userDepartment,
    teamEmployeeNames,
    employeesLoaded,
  ]);

  // Apply search and filters (permission filter already applied in loadFromFirebase)
  useEffect(() => {
    // Contracts are already filtered by permission in loadFromFirebase
    // Now apply user-selected filters (date, product, status, search)
    let filtered = [...contracts];

    // Apply product/model filter (Dòng xe)
    if (filters.products && filters.products.length > 0) {
      filtered = filtered.filter((contract) =>
        filters.products.includes(contract.dongXe)
      );
    }

    // Apply status filter (markets - legacy)
    if (filters.markets && filters.markets.length > 0) {
      filtered = filtered.filter((contract) =>
        filters.markets.includes(contract.tinhTrang)
      );
    }

    // Apply trangThai filter (new status filter)
    if (filters.trangThai && filters.trangThai.length > 0) {
      filtered = filtered.filter((contract) =>
        filters.trangThai.includes(contract.tinhTrang)
      );
    }

    // Apply showroom filter
    if (filters.showroom && filters.showroom.length > 0) {
      filtered = filtered.filter((contract) => {
        const contractShowroom = contract.showroom || "";
        return filters.showroom.some(selectedShowroom => 
          contractShowroom.includes(selectedShowroom) || 
          selectedShowroom.includes(contractShowroom)
        );
      });
    }

    // Apply search filter: search across all fields
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

    // Apply date range filter (ngayXhd - export date)
    try {
      const start = filters.startDate ? new Date(filters.startDate) : null;
      const end = filters.endDate ? new Date(filters.endDate) : null;
      if (end && filters.endDate && filters.endDate.length === 10) {
        end.setHours(23, 59, 59, 999);
      }

      if (start || end) {
        filtered = filtered.filter((contract) => {
          const raw = contract.ngayXhd;
          if (!raw) return false;
          const d = new Date(raw);
          if (isNaN(d)) return false;
          if (start && d < start) return false;
          if (end && d > end) return false;
          return true;
        });
      }
    } catch (e) {
      console.warn("Error parsing date filters:", e);
    }

    setFilteredContracts(filtered);
    setCurrentPage(1); // Reset to page 1 when search changes
  }, [
    contracts,
    filters.searchText,
    filters.products,
    filters.markets,
    filters.trangThai,
    filters.showroom,
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
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
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

    if (value === "today") {
      startDate = new Date(today);
      endDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (value === "yesterday") {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      startDate = new Date(d);
      endDate = new Date(d);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (value === "this-week") {
      const range = getWeekRange(today);
      startDate = range.start;
      endDate = range.end;
    } else if (value === "last-week") {
      const range = getWeekRange(today);
      const lastWeekStart = new Date(range.start);
      lastWeekStart.setDate(range.start.getDate() - 7);
      const lastWeekEnd = new Date(range.end);
      lastWeekEnd.setDate(range.end.getDate() - 7);
      startDate = lastWeekStart;
      endDate = lastWeekEnd;
    } else if (value === "next-week") {
      const range = getWeekRange(today);
      const nextWeekStart = new Date(range.start);
      nextWeekStart.setDate(range.start.getDate() + 7);
      const nextWeekEnd = new Date(range.end);
      nextWeekEnd.setDate(range.end.getDate() + 7);
      startDate = nextWeekStart;
      endDate = nextWeekEnd;
    } else if (value.startsWith("month-")) {
      // month-N (1-12) -> use current year
      const parts = value.split("-");
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
    } else if (value.startsWith("q")) {
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
    } else if (value === "this-month") {
      const year = today.getFullYear();
      const month = today.getMonth();
      startDate = new Date(year, month, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(year, month + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    setFilters((prev) => ({
      ...prev,
      startDate: startDate ? formatLocalDate(startDate) : "",
      endDate: endDate ? formatLocalDate(endDate) : "",
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      products: [],
      markets: [],
      trangThai: [],
      showroom: [],
      searchText: "",
    });
    setQuickSelectValue("");
  };

  const hasActiveFilters = () => {
    return (
      filters.searchText ||
      filters.startDate ||
      filters.endDate ||
      (filters.products && filters.products.length > 0) ||
      (filters.markets && filters.markets.length > 0) ||
      (filters.trangThai && filters.trangThai.length > 0) ||
      (filters.showroom && filters.showroom.length > 0)
    );
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContracts = filteredContracts.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value) return "-";
    const num =
      typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
    if (isNaN(num)) return value;
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  // Calculate bank loan amount (tiền vay ngân hàng)
  const calculateBankLoan = (contract) => {
    // Priority: soTienVay > tienVayNganHang > calculated value
    const parseValue = (val) => {
      if (!val) return 0;
      if (typeof val === "string") {
        return parseFloat(val.replace(/[^\d]/g, "")) || 0;
      }
      return typeof val === "number" ? val : 0;
    };

    // First check if we have explicit loan amount
    if (contract.soTienVay) {
      return parseValue(contract.soTienVay);
    }
    
    if (contract.tienVayNganHang) {
      return parseValue(contract.tienVayNganHang);
    }

    // If payment method is "trả thẳng", no loan
    if (contract.thanhToan === "trả thẳng") {
      return 0;
    }

    // For "trả góp" without explicit loan amount, calculate: giaHopDong - tienDatCoc
    if (contract.thanhToan === "trả góp") {
      const giaHopDong = parseValue(contract.giaHopDong);
      const tienDatCoc = parseValue(contract.tienDatCoc);
      const loanAmount = giaHopDong - tienDatCoc;
      return loanAmount > 0 ? loanAmount : 0;
    }

    return 0;
  };

  // Calculate counterpart payment (tiền đối ứng) = Giá hợp đồng - Số tiền vay
  // Đây là số tiền khách hàng tự bỏ ra (không phải từ ngân hàng)
  const calculateCounterpartPayment = (contract) => {
    const parseValue = (val) => {
      if (!val) return 0;
      if (typeof val === "string") {
        return parseFloat(val.replace(/[^\d]/g, "")) || 0;
      }
      return typeof val === "number" ? val : 0;
    };

    // 1. Nếu đã có tienDoiUng được lưu trong hợp đồng, sử dụng nó
    if (contract.tienDoiUng && parseValue(contract.tienDoiUng) > 0) {
      return parseValue(contract.tienDoiUng);
    }

    // 2. Tính toán: Tiền đối ứng = Giá hợp đồng - Số tiền vay
    const giaHopDong = parseValue(contract.giaHopDong);
    const soTienVay = parseValue(contract.soTienVay || contract.tienVayNganHang);

    // Nếu có giá hợp đồng và số tiền vay
    if (giaHopDong > 0 && soTienVay > 0) {
      const tienDoiUng = giaHopDong - soTienVay;
      return tienDoiUng > 0 ? tienDoiUng : 0;
    }

    // 3. Nếu thanh toán "trả thẳng" (không vay) thì tiền đối ứng = giá hợp đồng
    if (contract.thanhToan === "trả thẳng" || contract.thanhToan === "tra thang") {
      return giaHopDong;
    }

    // 4. Không có đủ dữ liệu để tính
    return 0;
  };

  // Calculate days from export date to today
  const calculateDaysFromExport = (exportDate, tinhTrang) => {
    // Nếu tình trạng là "đã giải ngân" thì không hiển thị số ngày
    if (tinhTrang && tinhTrang.toLowerCase() === "đã giải ngân") {
      return "-";
    }
    
    if (!exportDate) return "-";
    try {
      const exportDateObj = new Date(exportDate);
      if (isNaN(exportDateObj.getTime())) return "-";

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      exportDateObj.setHours(0, 0, 0, 0);

      const diffTime = today - exportDateObj;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    } catch (e) {
      return "-";
    }
  };

  // Helper function to check if a value is missing
  const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return (
        trimmed === "" ||
        trimmed === "-" ||
        trimmed === "null" ||
        trimmed === "undefined"
      );
    }
    if (typeof value === "number") {
      return isNaN(value);
    }
    return false;
  };

  // Get list of missing required fields
  const getMissingFields = (contract) => {
    if (!contract) return ["Hợp đồng không tồn tại"];

    const requiredFields = [
      { key: "tenKh", label: "Tên khách hàng" },
      { key: "soDienThoai", label: "Số điện thoại" },
      { key: "diaChi", label: "Địa chỉ" },
      { key: "cccd", label: "CCCD" },
      { key: "dongXe", label: "Dòng xe" },
      { key: "giaHopDong", label: "Giá hợp đồng" },
    ];

    return requiredFields
      .filter((field) => isEmpty(contract[field.key]))
      .map((field) => field.label);
  };

  // Check if contract has missing required fields
  const hasMissingData = (contract) => {
    return getMissingFields(contract).length > 0;
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
      let keyToRemove = deletingContract.firebaseKey;
      if (!keyToRemove) {
        const found = contracts.find((c) => c.id === deletingContract.id);
        if (found && found.firebaseKey) keyToRemove = found.firebaseKey;
      }

      if (keyToRemove) {
        // Remove from exportedContracts
        const exportedContractRef = ref(database, `exportedContracts/${keyToRemove}`);
        await remove(exportedContractRef);

        // Update status in contracts to "hủy"
        const contractRef = ref(database, `contracts/${keyToRemove}`);
        await update(contractRef, {
          trangThai: "hủy",
        });

        // Update local state
        setContracts((prev) =>
          prev.filter((contract) => contract.firebaseKey !== keyToRemove)
        );
        setFilteredContracts((prev) =>
          prev.filter((contract) => contract.firebaseKey !== keyToRemove)
        );
      }

      closeDeleteConfirm();
      toast.success("Xóa hợp đồng thành công! Trạng thái hợp đồng đã được chuyển sang 'hủy'.");
    } catch (err) {
      console.error("Error deleting contract:", err);
      toast.error("Lỗi khi xóa hợp đồng");
    }
  };

  // Open image modal
  const openImageModal = (contract) => {
    setCurrentImageContract(contract);
    // Load existing images from contract data (use contract directly as it already has the image data)
    setDepositImage(
      contract.depositImage || contract["Ảnh chụp hình đặt cọc"] || ""
    );
    setCounterpartImage(
      contract.counterpartImage || contract["Ảnh chụp đối ứng"] || ""
    );
    setIsImageModalOpen(true);
  };

  // Reset ref when contracts change (new contracts loaded)
  useEffect(() => {
    hasOpenedImageModalRef.current = false;
  }, [contracts.length]);

  // Auto-open image modal when navigated from export with flag
  useEffect(() => {
    if (
      location.state?.openImageModal &&
      !loading &&
      !hasOpenedImageModalRef.current &&
      contracts.length > 0
    ) {
      const contractKey = location.state.contractKey;

      // Find the contract by firebaseKey, or use first contract if not found
      const contractToOpen = contractKey
        ? contracts.find((c) => c.firebaseKey === contractKey)
        : contracts[0];

      if (contractToOpen) {
        hasOpenedImageModalRef.current = true;
        // Small delay to ensure UI is ready
        setTimeout(() => {
          openImageModal(contractToOpen);
          // Clear the state to prevent reopening on re-render
          navigate(location.pathname, { replace: true, state: {} });
        }, 500);
      }
    }
  }, [location.state, loading, contracts, navigate, location.pathname]);

  // Close image modal
  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setCurrentImageContract(null);
    setDepositImage("");
    setCounterpartImage("");
    setUploadingImage(false);
    setUploadingImageType(null);
  };

  // Handle image file upload to Cloudinary
  const handleImageUpload = async (e, imageType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    // Check file size (max 10MB for Cloudinary)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 10MB");
      return;
    }

    try {
      setUploadingImage(true);
      setUploadingImageType(imageType);

      // Upload to Cloudinary
      const imageUrl = await uploadImageToCloudinary(file);

      // Update the corresponding image state
      if (imageType === "deposit") {
        setDepositImage(imageUrl);
      } else if (imageType === "counterpart") {
        setCounterpartImage(imageUrl);
      }

      toast.success("Upload ảnh thành công!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Lỗi khi upload ảnh. Vui lòng thử lại.");
    } finally {
      setUploadingImage(false);
      setUploadingImageType(null);
      // Reset file input
      e.target.value = "";
    }
  };

  // Save images
  const handleSaveImages = async () => {
    if (!currentImageContract) return;

    try {
      const contractKey =
        currentImageContract.firebaseKey || currentImageContract.id;
      if (!contractKey) {
        toast.error("Không tìm thấy hợp đồng!");
        return;
      }

      const contractRef = ref(database, `exportedContracts/${contractKey}`);
      await update(contractRef, {
        "Ảnh chụp hình đặt cọc": depositImage || "",
        "Ảnh chụp đối ứng": counterpartImage || "",
        depositImage: depositImage || "",
        counterpartImage: counterpartImage || "",
      });

      // Update local state
      setContracts((prev) =>
        prev.map((contract) => {
          const key = contract.firebaseKey || contract.id;
          if (key === contractKey) {
            return {
              ...contract,
              depositImage: depositImage || "",
              counterpartImage: counterpartImage || "",
              "Ảnh chụp hình đặt cọc": depositImage || "",
              "Ảnh chụp đối ứng": counterpartImage || "",
            };
          }
          return contract;
        })
      );
      setFilteredContracts((prev) =>
        prev.map((contract) => {
          const key = contract.firebaseKey || contract.id;
          if (key === contractKey) {
            return {
              ...contract,
              depositImage: depositImage || "",
              counterpartImage: counterpartImage || "",
              "Ảnh chụp hình đặt cọc": depositImage || "",
              "Ảnh chụp đối ứng": counterpartImage || "",
            };
          }
          return contract;
        })
      );

      toast.success("Lưu ảnh thành công!");
      closeImageModal();
    } catch (err) {
      console.error("Error saving images:", err);
      toast.error("Lỗi khi lưu ảnh");
    }
  };

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 bg-gradient-to-br from-slate-100 to-slate-200 min-h-screen">
      {/* Header with Back Button and Title */}
      <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <button
          onClick={() => navigate("/menu")}
          className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2 px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-100"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Quay lại</span>
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-primary-700 truncate">
          Hợp đồng đã xuất
        </h2>
      </div>

      {/* Filter Panel - Horizontal */}
      <div className="mb-6">
        <FilterPanel
          activeTab={"hopdongdaxuat"}
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

      {loading ? (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-500 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-sm sm:text-base text-secondary-600">
              Đang tải dữ liệu hợp đồng đã xuất...
            </p>
          </div>
        </div>
      ) : (
        <div>
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
                Trang {currentPage}/{totalPages} ({startIndex + 1}-
                {Math.min(endIndex, filteredContracts.length)})
              </p>
            )}
          </div>

          {/* Contracts Table */}
          {filteredContracts.length === 0 ? (
            <div className="text-center py-8 bg-secondary-50 rounded-lg">
              <p className="text-secondary-600">
                Không có dữ liệu hợp đồng đã xuất
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto shadow-md rounded-lg -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-secondary-100">
                  <thead className="bg-primary-400">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        STT
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Ngày XHD
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
                        Số Điện Thoại
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Email
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Địa Chỉ lấy theo VNeid
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        CCCD
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
                        Số Khung
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Số Máy
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Tình Trạng
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Giá Niêm Yết
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Giá Giảm
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Giá Hợp Đồng
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Thanh toán
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Ngân hàng
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Tiền đặt cọc
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Tiền đối ứng
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Tiền vay ngân hàng
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 whitespace-nowrap">
                        Số Ngày
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-secondary-900 uppercase tracking-wider border border-secondary-400 sticky right-0 z-30 bg-primary-400 whitespace-nowrap">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-neutral-white divide-y divide-secondary-100">
                    {currentContracts.map((contract, index) => {
                      const isMissingData = hasMissingData(contract);
                      const missingFields = getMissingFields(contract);
                      
                      // Debug log for first contract
                      if (index === 0) {
                        console.log("Sample contract data:", contract);
                        console.log("Tiền đặt cọc:", contract.tienDatCoc);
                        console.log("Số tiền vay:", contract.soTienVay, contract.tienVayNganHang);
                        console.log("Thanh toán:", contract.thanhToan);
                        console.log("Giá hợp đồng:", contract.giaHopDong);
                      }
                      
                      return (
                        <tr
                          key={contract.firebaseKey || contract.id}
                          className={`hover:bg-secondary-50 ${isMissingData
                            ? "bg-yellow-50 border-l-4 border-yellow-400"
                            : ""
                            }`}
                        >
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-semibold text-black border border-secondary-400">
                            {startIndex + index + 1}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            {contract.ngayXhd || "-"}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            <div
                              className="max-w-[80px] sm:max-w-none truncate"
                              title={contract.tvbh || "-"}
                            >
                              {contract.tvbh || "-"}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            <div
                              className="max-w-[120px] sm:max-w-none truncate"
                              title={contract.showroom || "-"}
                            >
                              {contract.showroom || "-"}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            {contract.vso || "-"}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            <div
                              className="max-w-[100px] sm:max-w-none truncate"
                              title={contract.tenKh || "-"}
                            >
                              {contract.tenKh || "-"}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            {contract.soDienThoai || "-"}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            <div
                              className="max-w-[120px] sm:max-w-none truncate"
                              title={contract.email || "-"}
                            >
                              {contract.email || "-"}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            <div
                              className="max-w-[120px] sm:max-w-none truncate"
                              title={contract.diaChi || "-"}
                            >
                              {contract.diaChi || "-"}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            {contract.cccd || "-"}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            {contract.ngayCap || "-"}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            <div
                              className="max-w-[100px] sm:max-w-none truncate"
                              title={contract.noiCap || "-"}
                            >
                              {contract.noiCap || "-"}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            {contract.dongXe || "-"}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            <div
                              className="max-w-[100px] sm:max-w-none truncate"
                              title={contract.phienBan || "-"}
                            >
                              {contract.phienBan || "-"}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            <div
                              className="max-w-[100px] sm:max-w-none truncate"
                              title={getColorName(
                                contract.ngoaiThat ||
                                contract["Ngoại Thất"] ||
                                contract.exterior,
                                true
                              )}
                            >
                              {getColorName(
                                contract.ngoaiThat ||
                                contract["Ngoại Thất"] ||
                                contract.exterior,
                                true
                              )}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            <div
                              className="max-w-[100px] sm:max-w-none truncate"
                              title={getColorName(
                                contract.noiThat ||
                                contract["Nội Thất"] ||
                                contract.interior,
                                false
                              )}
                            >
                              {getColorName(
                                contract.noiThat ||
                                contract["Nội Thất"] ||
                                contract.interior,
                                false
                              )}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            {contract.soKhung || "-"}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            {contract.soMay || "-"}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            {contract.tinhTrang || "-"}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            {formatCurrency(contract.giaNiemYet)}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            {formatCurrency(contract.giaGiam)}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            {formatCurrency(contract.giaHopDong)}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            {contract.thanhToan || "-"}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            <div
                              className="max-w-[100px] sm:max-w-none truncate"
                              title={contract.nganHang || "-"}
                            >
                              {contract.nganHang || "-"}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            {formatCurrency(contract.tienDatCoc)}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            {formatCurrency(calculateCounterpartPayment(contract))}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                            {formatCurrency(calculateBankLoan(contract))}
                          </td>
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400 text-center font-semibold">
                            {calculateDaysFromExport(contract.ngayXhd, contract.tinhTrang)}
                            {calculateDaysFromExport(contract.ngayXhd, contract.tinhTrang) !==
                              "-" && " ngày"}
                          </td>
                          {/* Actions column - sticky to right */}
                          <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400 sticky right-0 z-20 bg-primary-200">
                            <div className="flex items-center justify-end gap-1 sm:gap-2">
                              <button
                                onClick={() => openImageModal(contract)}
                                className="px-1.5 sm:px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                                aria-label={`Quản lý ảnh ${contract.tenKh || contract.id
                                  }`}
                                title="Quản lý ảnh"
                              >
                                <Image className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Ảnh</span>
                              </button>
                              <button
                                onClick={() =>
                                  navigate(
                                    `/hop-dong-da-xuat/edit/${contract.firebaseKey || contract.id
                                    }`
                                  )
                                }
                                className="px-1.5 sm:px-3 py-1 bg-secondary-600 text-white rounded-md hover:bg-secondary-700 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                                aria-label={`Sửa hợp đồng ${contract.tenKh || contract.id
                                  }`}
                              >
                                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Sửa</span>
                              </button>
                              <button
                                onClick={() => openDeleteConfirm(contract)}
                                className="px-1.5 sm:px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                                aria-label={`Xóa hợp đồng ${contract.tenKh || contract.id
                                  }`}
                              >
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Xóa</span>
                              </button>
                              {/* Print / Giấy xác nhận button */}
                              <button
                                onClick={() => {
                                  if (isMissingData) {
                                    toast.warning(
                                      `Thiếu thông tin: ${missingFields.join(", ")}. Vui lòng bổ sung trước khi in!`
                                    );
                                    return;
                                  }
                                  const printData = {
                                    id: contract.id,
                                    firebaseKey: contract.firebaseKey,
                                    stt: startIndex + index + 1,
                                    createdAt: contract.ngayXhd,
                                    ngayXhd: contract.ngayXhd,
                                    TVBH: contract.tvbh,
                                    vso: contract.vso,
                                    contractNumber: contract.vso,
                                    VSO: contract.vso,
                                    customerName: contract.tenKh,
                                    tenKh: contract.tenKh,
                                    "Tên Kh": contract.tenKh,
                                    phone: contract.soDienThoai,
                                    soDienThoai: contract.soDienThoai,
                                    "Số Điện Thoại": contract.soDienThoai,
                                    email: contract.email,
                                    Email: contract.email,
                                    address: contract.diaChi,
                                    diaChi: contract.diaChi,
                                    "Địa Chỉ": contract.diaChi,
                                    cccd: contract.cccd,
                                    CCCD: contract.cccd,
                                    issueDate: contract.ngayCap,
                                    ngayCap: contract.ngayCap,
                                    "Ngày Cấp": contract.ngayCap,
                                    issuePlace: contract.noiCap,
                                    noiCap: contract.noiCap,
                                    "Nơi Cấp": contract.noiCap,
                                    model: contract.dongXe,
                                    dongXe: contract.dongXe,
                                    "Dòng xe": contract.dongXe,
                                    variant: contract.phienBan,
                                    phienBan: contract.phienBan,
                                    "Phiên Bản": contract.phienBan,
                                    exterior: contract.ngoaiThat,
                                    ngoaiThat: contract.ngoaiThat,
                                    "Ngoại Thất": contract.ngoaiThat,
                                    interior: contract.noiThat,
                                    noiThat: contract.noiThat,
                                    "Nội Thất": contract.noiThat,
                                    contractPrice: contract.giaHopDong,
                                    giaHopDong: contract.giaHopDong,
                                    "Giá Hợp Đồng": contract.giaHopDong,
                                    giaXuatHoaDon: contract.giaXuatHoaDon || contract.giaHopDong,
                                    "Giá Xuất Hóa Đơn": contract.giaXuatHoaDon || contract.giaHopDong,
                                    soTienVay: contract.soTienVay || contract.tienVayNganHang || "",
                                    deposit: contract.tienDatCoc,
                                    soTienCoc: contract.soTienCoc || contract.tienDatCoc || "",
                                    tienDatCoc: contract.soTienCoc || contract.tienDatCoc || "",
                                    "Số tiền cọc": contract.soTienCoc || contract.tienDatCoc || "",
                                    "Tiền đặt cọc": contract.soTienCoc || contract.tienDatCoc || "",
                                    payment: contract.thanhToan || "",
                                    thanhToan: contract.thanhToan || "",
                                    bank: contract.nganHang || "",
                                    nganHang: contract.nganHang || "",
                                    "ngân hàng": contract.nganHang || "",
                                    status: contract.tinhTrang,
                                    tinhTrang: contract.tinhTrang,
                                    "Tình Trạng": contract.tinhTrang,
                                    soKhung: contract.soKhung,
                                    "Số Khung": contract.soKhung,
                                    chassisNumber: contract.soKhung,
                                    soMay: contract.soMay,
                                    "Số Máy": contract.soMay,
                                    engineNumber: contract.soMay,
                                    representativeName: contract.tvbh,
                                    quaTang: contract.quaTang || contract["Quà tặng"] || "",
                                    "Quà tặng": contract.quaTang || contract["Quà tặng"] || "",
                                    quaTangKhac: contract.quaTangKhac || contract["Quà tặng khác"] || "",
                                    "Quà tặng khác": contract.quaTangKhac || contract["Quà tặng khác"] || "",
                                    giamGia: contract.giamGia || contract["Giảm giá"] || "",
                                    "Giảm giá": contract.giamGia || contract["Giảm giá"] || "",
                                    soTienPhaiThu: contract.soTienPhaiThu || contract["Số tiền phải thu"] || contract.giamGia || contract["Giảm giá"] || "",
                                    "Số tiền phải thu": contract.soTienPhaiThu || contract["Số tiền phải thu"] || contract.giamGia || contract["Giảm giá"] || "",
                                    showroom: contract.showroom || contract.Showroom || contract["Showroom"] || "",
                                    Showroom: contract.showroom || contract.Showroom || contract["Showroom"] || "",
                                  };
                                  setPrintContract(printData);
                                  // Load bankLoanFile from contract if exists
                                  const contractKey =
                                    contract.firebaseKey || contract.id;
                                  setCurrentContractKey(contractKey);
                                  setBankLoanFile(
                                    contract.bankLoanFile ||
                                    contract["File cho vay ngân hàng"] ||
                                    null
                                  );
                                  setIsPrintModalOpen(true);
                                }}
                                disabled={isMissingData}
                                className={`px-1.5 sm:px-3 py-1 rounded-md transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${isMissingData
                                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                                  : "bg-green-600 text-white hover:bg-green-700"
                                  }`}
                                title={
                                  isMissingData
                                    ? `Thiếu: ${missingFields.join(", ")}`
                                    : `Chọn mẫu in ${contract.tenKh || contract.id}`
                                }
                                aria-label={
                                  isMissingData
                                    ? `Không thể in - thiếu: ${missingFields.join(", ")}`
                                    : `Chọn mẫu in ${contract.tenKh || contract.id}`
                                }
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
          {totalPages > 1 && (
            <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 sm:px-4 py-2 bg-secondary-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-secondary-700 transition-colors text-sm sm:text-base"
              >
                Trước
              </button>
              <span className="px-3 sm:px-4 py-2 text-sm sm:text-base text-secondary-700">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 sm:px-4 py-2 bg-secondary-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-secondary-700 transition-colors text-sm sm:text-base"
              >
                Sau
              </button>
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
                      <span className="font-semibold text-gray-700">
                        Tên KH:
                      </span>{" "}
                      <span className="text-gray-900">
                        {deletingContract.tenKh || "-"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">
                        Số điện thoại:
                      </span>{" "}
                      <span className="text-gray-900">
                        {deletingContract.soDienThoai || "-"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">
                        Dòng xe:
                      </span>{" "}
                      <span className="text-gray-900">
                        {deletingContract.dongXe || "-"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">VSO:</span>{" "}
                      <span className="text-gray-900">
                        {deletingContract.vso || "-"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">
                        Ngày XHD:
                      </span>{" "}
                      <span className="text-gray-900">
                        {deletingContract.ngayXhd || "-"}
                      </span>
                    </p>
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

          {/* Print Selection Modal */}
          {isPrintModalOpen &&
            printContract &&
            (() => {
              // Handle bank loan file upload
              const handleBankLoanFileUpload = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (
                  !file.type.startsWith("image/") &&
                  !file.type.includes("pdf")
                ) {
                  toast.error("Vui lòng chọn file ảnh hoặc PDF");
                  return;
                }

                if (file.size > 10 * 1024 * 1024) {
                  toast.error("Kích thước file không được vượt quá 10MB");
                  return;
                }

                try {
                  setUploadingBankLoanFile(true);
                  // Upload to Cloudinary
                  const fileUrl = await uploadImageToCloudinary(file);
                  setBankLoanFile(fileUrl);

                  // Save to Firebase if contract key exists
                  if (currentContractKey || printContract?.firebaseKey) {
                    const contractKey =
                      currentContractKey || printContract.firebaseKey;
                    const contractRef = ref(
                      database,
                      `exportedContracts/${contractKey}`
                    );
                    await update(contractRef, {
                      bankLoanFile: fileUrl,
                      "File cho vay ngân hàng": fileUrl,
                    });

                    // Update local state
                    setContracts((prev) =>
                      prev.map((contract) => {
                        const key = contract.firebaseKey || contract.id;
                        if (key === contractKey) {
                          return {
                            ...contract,
                            bankLoanFile: fileUrl,
                            "File cho vay ngân hàng": fileUrl,
                          };
                        }
                        return contract;
                      })
                    );
                    setFilteredContracts((prev) =>
                      prev.map((contract) => {
                        const key = contract.firebaseKey || contract.id;
                        if (key === contractKey) {
                          return {
                            ...contract,
                            bankLoanFile: fileUrl,
                            "File cho vay ngân hàng": fileUrl,
                          };
                        }
                        return contract;
                      })
                    );
                  }

                  toast.success("Upload file thành công!");
                } catch (error) {
                  console.error("Error uploading file:", error);
                  toast.error(
                    error.message || "Lỗi khi upload file. Vui lòng thử lại."
                  );
                } finally {
                  setUploadingBankLoanFile(false);
                  e.target.value = "";
                }
              };

              // Handle print navigation with file
              const handlePrintNavigate = (route, includeFile = false) => {
                const printData = {
                  ...printContract,
                  ...(includeFile && bankLoanFile ? { bankLoanFile } : {}),
                };
                // Save state to sessionStorage so modal can be reopened when user returns
                savePrintModalState(printContract, currentContractKey, bankLoanFile);
                setIsPrintModalOpen(false);
                navigate(route, { state: printData });
                // Don't clear printContract here - keep for when user returns
              };

              // Handle print file directly
              const handlePrintFile = () => {
                if (!bankLoanFile) {
                  toast.warning("Vui lòng upload file trước khi in!");
                  return;
                }
                window.open(bankLoanFile, "_blank");
              };

              return (
                <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
                  <div className="modal-box bg-white rounded-lg shadow-xl max-w-4xl w-full my-4 sm:my-8 max-h-[calc(100vh-2rem)] overflow-auto">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b bg-gradient-to-r from-primary-600 to-primary-400 sticky top-0 z-10">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-bold text-white">
                          Chọn mẫu in
                        </h3>
                        <button
                          onClick={() => {
                            setIsPrintModalOpen(false);
                            setPrintContract(null);
                            setCurrentContractKey(null);
                            clearPrintModalState(); // Clear sessionStorage when manually closing
                          }}
                          className="text-white hover:text-gray-200 transition-colors"
                          aria-label="Đóng"
                        >
                          <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-white/90 mt-1">
                        Hợp đồng:{" "}
                        <span className="font-semibold">
                          {printContract.customerName || printContract.id}
                        </span>
                      </p>
                    </div>

                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[calc(70vh-100px)] overflow-y-auto">
                      {/* Group 1: XUẤT HÓA ĐƠN */}
                      <div className="space-y-3">
                        <h4 className="text-sm sm:text-base font-bold text-primary-700 border-b-2 border-primary-300 pb-2">
                          1. XUẤT HÓA ĐƠN
                        </h4>

                        {/* Đề xuất bán hàng */}
                        <div className="space-y-2">
                          <button
                            onClick={() =>
                              handlePrintNavigate("/de-xuat-gia-ban", true)
                            }
                            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center text-sm sm:text-base"
                          >
                            Đề xuất bán hàng
                          </button>

                          {/* File upload section for Đề xuất bán hàng */}
                          <div className="bg-gray-50 p-2 sm:p-3 rounded-md border border-gray-200">
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                              Upload file cho vay của Ngân hàng:
                            </label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <label
                                className={`flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-md transition-colors text-xs sm:text-sm text-center ${uploadingBankLoanFile
                                  ? "bg-gray-200 cursor-not-allowed opacity-50"
                                  : "cursor-pointer hover:bg-gray-50"
                                  }`}
                              >
                                <span className="text-gray-700">
                                  {uploadingBankLoanFile
                                    ? "Đang upload..."
                                    : bankLoanFile
                                      ? "Đã upload file"
                                      : "Chọn file (Ảnh)"}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={handleBankLoanFileUpload}
                                  className="hidden"
                                  disabled={uploadingBankLoanFile}
                                />
                              </label>
                              {bankLoanFile && (
                                <>
                                  <button
                                    onClick={handlePrintFile}
                                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs sm:text-sm"
                                  >
                                    In file
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const confirmDelete = window.confirm(
                                        "Bạn có chắc chắn muốn xóa file này?"
                                      );
                                      if (!confirmDelete) return;

                                      try {
                                        // Remove from Firebase if contract key exists
                                        if (
                                          currentContractKey ||
                                          printContract?.firebaseKey
                                        ) {
                                          const contractKey =
                                            currentContractKey ||
                                            printContract.firebaseKey;
                                          const contractRef = ref(
                                            database,
                                            `exportedContracts/${contractKey}`
                                          );
                                          await update(contractRef, {
                                            bankLoanFile: "",
                                            "File cho vay ngân hàng": "",
                                          });

                                          // Update local state
                                          setContracts((prev) =>
                                            prev.map((contract) => {
                                              const key =
                                                contract.firebaseKey ||
                                                contract.id;
                                              if (key === contractKey) {
                                                return {
                                                  ...contract,
                                                  bankLoanFile: "",
                                                  "File cho vay ngân hàng": "",
                                                };
                                              }
                                              return contract;
                                            })
                                          );
                                          setFilteredContracts((prev) =>
                                            prev.map((contract) => {
                                              const key =
                                                contract.firebaseKey ||
                                                contract.id;
                                              if (key === contractKey) {
                                                return {
                                                  ...contract,
                                                  bankLoanFile: "",
                                                  "File cho vay ngân hàng": "",
                                                };
                                              }
                                              return contract;
                                            })
                                          );
                                        }

                                        setBankLoanFile(null);
                                        toast.success("Xóa file thành công!");
                                      } catch (error) {
                                        console.error(
                                          "Error deleting file:",
                                          error
                                        );
                                        toast.error(
                                          "Lỗi khi xóa file. Vui lòng thử lại."
                                        );
                                      }
                                    }}
                                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-xs sm:text-sm"
                                  >
                                    Xóa
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handlePrintNavigate("/de-nghi-xuat-hoa-don")
                          }
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
                        >
                          Đề nghị xuất hóa đơn
                        </button>

                        <button
                          onClick={() =>
                            handlePrintNavigate("/phu-luc-hop-dong")
                          }
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
                        >
                          Phụ lục hợp đồng
                        </button>

                        <button
                          onClick={() => handlePrintNavigate("/pdi-kh")}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
                        >
                          Phiếu yêu cầu sửa chữa
                        </button>

                        <button
                          onClick={() => handlePrintNavigate("/phieu-de-nghi-lap-phu-kien")}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
                        >
                          Phiếu đề nghị lắp phụ kiện
                        </button>

                        <button
                          onClick={() => handlePrintNavigate("/phieu-rut-coc")}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
                        >
                          Phiếu rút cọc
                        </button>

                        <button
                          onClick={() => handlePrintNavigate("/phieu-xac-nhan-thong-tin-tang-qua")}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base"
                        >
                          Phiếu xác nhận thông tin nhận quà VinFast
                        </button>
                      </div>

                      {/* Group 2: BỘ GIẢI NGÂN CỦA NGÂN HÀNG */}
                      <div className="space-y-3">
                        <h4 className="text-sm sm:text-base font-bold text-primary-700 border-b-2 border-primary-300 pb-2">
                          2. BỘ GIẢI NGÂN CỦA NGÂN HÀNG
                        </h4>

                        <button
                          onClick={() =>
                            handlePrintNavigate("/giay-de-nghi-thanh-toan")
                          }
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base"
                        >
                          Đề nghị thanh toán
                        </button>

                        <button
                          onClick={() =>
                            handlePrintNavigate("/giay-xac-nhan-sksm")
                          }
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base"
                        >
                          Xác nhận Số khung số máy
                        </button>

                        <button
                          onClick={() =>
                            handlePrintNavigate("/giay-xac-nhan-thong-tin")
                          }
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base"
                        >
                          Xác nhận kiểu loại
                        </button>

                        <button
                          onClick={() =>
                            handlePrintNavigate("/giay-xac-nhan-tang-bao-hiem")
                          }
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base"
                        >
                          Xác nhận bảo hiểm
                        </button>

                        <button
                          onClick={() => handlePrintNavigate("/giay-xac-nhan")}
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm sm:text-base"
                        >
                          Xác nhận thanh toán
                        </button>

                        {/* Các biểu mẫu bổ sung - hiển thị tất cả */}
                        <div className="space-y-2 mt-3 pl-2 sm:pl-4 border-l-4 border-yellow-400 bg-yellow-50 p-2 sm:p-3 rounded">
                          <p className="text-xs sm:text-sm font-semibold text-yellow-800 mb-2">
                            Thỏa thuận lãi vay 0 đồng:
                          </p>
                          <button
                            onClick={() =>
                              handlePrintNavigate("/giay-thoa-thuan-tra-cham")
                            }
                            className="w-full px-3 sm:px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-xs sm:text-sm"
                          >
                            Thỏa thuận thanh toán chậm
                          </button>
                          <button
                            onClick={() =>
                              handlePrintNavigate("/giay-thoa-thuan-tra-thay")
                            }
                            className="w-full px-3 sm:px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-xs sm:text-sm"
                          >
                            Thỏa thuận hỗ trợ trả thay
                          </button>
                          <button
                            onClick={() =>
                              handlePrintNavigate("/xac-nhan-cong-no")
                            }
                            className="w-full px-3 sm:px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-xs sm:text-sm"
                          >
                            Xác nhận công nợ
                          </button>
                        </div>

                        {/* Thỏa thuận hỗ trợ lãi vay 80% */}
                        <div className="space-y-2 mt-3 pl-2 sm:pl-4 border-l-4 border-green-400 bg-green-50 p-2 sm:p-3 rounded">
                          <p className="text-xs sm:text-sm font-semibold text-green-800 mb-2">
                            Thỏa thuận hỗ trợ lãi vay 80%:
                          </p>
                          <button
                            onClick={() =>
                              handlePrintNavigate("/bidv-thoa-thuan-ho-tro-lai-vay")
                            }
                            className="w-full px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs sm:text-sm"
                          >
                            BIDV - Thỏa thuận hỗ trợ lãi vay
                          </button>
                          <button
                            onClick={() =>
                              handlePrintNavigate("/giay-thoa-thuan-ho-tro-vay-lai")
                            }
                            className="w-full px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs sm:text-sm"
                          >
                            TCB - Thỏa thuận hỗ trợ lãi vay 80%
                          </button>
                          <button
                            onClick={() =>
                              handlePrintNavigate("/bieu-mau-tpbank")
                            }
                            className="w-full px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs sm:text-sm"
                          >
                            TPBank - Thỏa thuận hỗ trợ lãi vay
                          </button>
                          <button
                            onClick={() =>
                              handlePrintNavigate("/giay-thoa-thuan-htls-vpbank")
                            }
                            className="w-full px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs sm:text-sm"
                          >
                            VPBank - Thỏa thuận hỗ trợ lãi suất
                          </button>
                          <button
                            onClick={() =>
                              handlePrintNavigate("/thoa-thuan-ho-tro-lai-vay-shinhan-cdx")
                            }
                            className="w-full px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs sm:text-sm"
                          >
                            Shinhan - Thỏa thuận hỗ trợ lãi vay
                          </button>
                        </div>

                        {/* Biểu mẫu theo ngân hàng - hiển thị tất cả */}
                        <div className="space-y-2 mt-3 pl-2 sm:pl-4 border-l-4 border-blue-400 bg-blue-50 p-2 sm:p-3 rounded">
                          <p className="text-xs sm:text-sm font-semibold text-blue-800 mb-2">
                            Thỏa thuận hỗ trợ lãi vay 90%:
                          </p>
                          <button
                            onClick={() =>
                              handlePrintNavigate(
                                "/giay-thoa-thuan-htls-vpbank"
                              )
                            }
                            className="w-full px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                          >
                            Thỏa thuận hỗ trợ lãi suất ngân hàng VPBank
                          </button>
                          <button
                            onClick={() =>
                              handlePrintNavigate("/bieu-mau-tpbank")
                            }
                            className="w-full px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                          >
                            Thỏa thuận hỗ trợ lãi suất vay CĐX TPB
                          </button>

                          <button
                            onClick={() =>
                              handlePrintNavigate(
                                "/thoa-thuan-ho-tro-lai-suat-vay-cdx-vinfast-va-lfvn"
                              )
                            }
                            className="w-full px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                          >
                            Thoả thuận hỗ trợ lãi suất vay CĐX Vinfast và LFVN
                          </button>
                        </div>
                      </div>

                      {/* Legacy options (keep for backward compatibility) */}
                      {/* <div className="space-y-3 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-600">Các mẫu in khác:</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handlePrintNavigate("/giay-xac-nhan")}
                              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                            >
                              Giấy xác nhận
                            </button>
                            <button
                              onClick={() => handlePrintNavigate("/giay-xac-nhan-thong-tin")}
                              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                            >
                              Giấy xác nhận thông tin
                            </button>
                          </div>
                        </div> */}
                    </div>

                    <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t flex justify-end sticky bottom-0">
                      <button
                        onClick={() => {
                          setIsPrintModalOpen(false);
                          setPrintContract(null);
                          setCurrentContractKey(null);
                          clearPrintModalState(); // Clear sessionStorage when manually closing
                        }}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-sm sm:text-base"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Image Management Modal */}
          {isImageModalOpen && currentImageContract && (
            <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="modal-box bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[calc(100vh-2rem)] overflow-auto">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-400 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg sticky top-0 z-10">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base sm:text-xl font-bold text-white truncate">
                      Quản lý ảnh -{" "}
                      {currentImageContract.tenKh ||
                        currentImageContract.customerName ||
                        currentImageContract.id}
                    </h3>
                    <button
                      onClick={closeImageModal}
                      className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
                      aria-label="Đóng"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Deposit Image */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">
                      Ảnh chụp hình đặt cọc
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={depositImage}
                        onChange={(e) => setDepositImage(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                        placeholder="Nhập URL ảnh hoặc upload file"
                      />
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <label
                          className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg transition-colors text-xs sm:text-sm text-center ${uploadingImage && uploadingImageType === "deposit"
                            ? "bg-gray-200 cursor-not-allowed opacity-50"
                            : "cursor-pointer hover:bg-gray-50"
                            }`}
                        >
                          <span className="text-gray-700">
                            {uploadingImage && uploadingImageType === "deposit"
                              ? "Đang upload..."
                              : "Chọn file ảnh"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, "deposit")}
                            className="hidden"
                            disabled={
                              uploadingImage && uploadingImageType === "deposit"
                            }
                          />
                        </label>
                        {depositImage &&
                          !(
                            uploadingImage && uploadingImageType === "deposit"
                          ) && (
                            <button
                              onClick={() => setDepositImage("")}
                              className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm"
                            >
                              Xóa
                            </button>
                          )}
                      </div>
                      {depositImage && (
                        <div className="mt-2">
                          <img
                            src={depositImage}
                            alt="Ảnh chụp hình đặt cọc"
                            className="max-w-full h-auto max-h-48 sm:max-h-64 rounded-lg border border-gray-300"
                            onError={(e) => {
                              e.target.style.display = "none";
                              toast.error(
                                "Không thể tải ảnh. Vui lòng kiểm tra lại URL hoặc file."
                              );
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Counterpart Image */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">
                      Ảnh chụp đối ứng
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={counterpartImage}
                        onChange={(e) => setCounterpartImage(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                        placeholder="Nhập URL ảnh hoặc upload file"
                      />
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <label
                          className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg transition-colors text-xs sm:text-sm text-center ${uploadingImage &&
                            uploadingImageType === "counterpart"
                            ? "bg-gray-200 cursor-not-allowed opacity-50"
                            : "cursor-pointer hover:bg-gray-50"
                            }`}
                        >
                          <span className="text-gray-700">
                            {uploadingImage &&
                              uploadingImageType === "counterpart"
                              ? "Đang upload..."
                              : "Chọn file ảnh"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageUpload(e, "counterpart")
                            }
                            className="hidden"
                            disabled={
                              uploadingImage &&
                              uploadingImageType === "counterpart"
                            }
                          />
                        </label>
                        {counterpartImage &&
                          !(
                            uploadingImage &&
                            uploadingImageType === "counterpart"
                          ) && (
                            <button
                              onClick={() => setCounterpartImage("")}
                              className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm"
                            >
                              Xóa
                            </button>
                          )}
                      </div>
                      {counterpartImage && (
                        <div className="mt-2">
                          <img
                            src={counterpartImage}
                            alt="Ảnh chụp đối ứng"
                            className="max-w-full h-auto max-h-48 sm:max-h-64 rounded-lg border border-gray-300"
                            onError={(e) => {
                              e.target.style.display = "none";
                              toast.error(
                                "Không thể tải ảnh. Vui lòng kiểm tra lại URL hoặc file."
                              );
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:gap-4 border-t border-gray-200 rounded-b-lg sticky bottom-0">
                  <button
                    onClick={closeImageModal}
                    className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-sm sm:text-base"
                    aria-label="Hủy"
                  >
                    <X className="w-4 h-4" />
                    <span>Hủy</span>
                  </button>
                  <button
                    onClick={handleSaveImages}
                    className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-secondary-600 text-white font-medium rounded-lg hover:bg-secondary-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-sm sm:text-base"
                    aria-label="Lưu ảnh"
                  >
                    <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Lưu ảnh</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )
      }
    </div >
  );
}
