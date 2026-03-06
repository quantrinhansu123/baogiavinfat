import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Check, Globe, Edit, ArrowLeft } from 'lucide-react';
import { ref, get, update, remove, push, set } from 'firebase/database';
import { database } from '../firebase/config';
import FilterPanel from '../components/FilterPanel';
import zaloIcon from '../assets/zalo.svg';
import facebookIcon from '../assets/facebook.svg';
import tiktokIcon from '../assets/tiktok.svg';
import fanpageIcon from '../assets/fanpage.svg';
import bcrypt from 'bcryptjs';
import { toast } from 'react-toastify';

export default function NhanSuPage() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('user');
  const [userEmail, setUserEmail] = useState('');
  const [userDepartment, setUserDepartment] = useState('');

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    products: [],
    shifts: [],
    markets: [],
    departments: [],
    searchText: '',
  });

  const [availableFilters, setAvailableFilters] = useState({
    products: [],
    markets: [],
    departments: [],
  });

  const [quickSelectValue, setQuickSelectValue] = useState('');

  // User management states
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    "Họ Và Tên": "",
    username: "",
    password: "",
    phone: "",
    email: "",
    birthdate: "",
    startDate: new Date().toISOString().split("T")[0],
    "Vị trí": "",
    "Bộ phận": "",
    status: "active",
    role: "user",
    zalo: "",
    tiktok: "",
    facebook: "",
    fanpage: "",
    web: "",
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load user info from localStorage
  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'user';
    const email = localStorage.getItem('userEmail') || '';
    setUserRole(role);
    setUserEmail(email);
  }, []);

  // Load employees data from Firebase `employees` node
  useEffect(() => {
    const loadEmployeesData = async () => {
      try {
        setLoading(true);
        
        // Load employees from the `employees` node in Firebase
        const employeesRef = ref(database, 'employees');
        const snapshot = await get(employeesRef);
        
        if (!snapshot.exists()) {
          console.log('No employees data found in Firebase');
          setUsers([]);
          setFilteredUsers([]);
          setLoading(false);
          return;
        }

        const data = snapshot.val();
        console.log('Loaded employees data:', data);

        // Map employees node shape into the UI-friendly object shape
        const usersArray = Object.entries(data).map(([firebaseKey, values]) => {
          // Use id from data if exists, otherwise use firebaseKey
          const employeeId = values['id'] || values.id || firebaseKey;
          
          // normalize DB shape to the exact keys (matching the sample data structure)
          const db = {
            id: employeeId,
            TVBH: values['TVBH'] || values.TVBH || '',
            user: values['user'] || values.username || '',
            pass: values['pass'] || values.password || '',
            soDienThoai: values['soDienThoai'] || values.phone || values.phoneNumber || '',
            mail: values['mail'] || values['Mail'] || values.email || '',
            sinhNhat: values['sinhNhat'] || values['Sinh Nhật'] || values.birthday || values.birthdate || '',
            ngayVaoLam: values['ngayVaoLam'] || values['Ngày vào làm'] || values.createdAt || values.startDate || '',
            chucVu: values['chucVu'] || values['Chức Vị'] || values.position || values['Vị trí'] || '',
            phongBan: values['phongBan'] || values['Phòng Ban'] || values.department || values['Bộ phận'] || '',
            tinhTrang: values['tinhTrang'] || values['tình trạng'] || values.status || '',
            quyen: values['quyen'] || values['Quyền'] || values.role || '',
            zalo: values['Zalo'] || values.zalo || '',
            tiktok: values['tiktok'] || values.TikTok || '',
            facebook: values['facebook'] || values.Facebook || '',
            fanpage: values['fanpage'] || '',
            web: values['web'] || '',
          };

          return {
            firebaseKey,
            id: employeeId,
            // Keep original values
            ...values,
            // Add normalized DB fields
            ...db,
            // Add UI-friendly aliases
            username: db.user,
            password: db.pass,
            phone: db.soDienThoai,
            email: db.mail,
            'Họ Và Tên': db.TVBH,
            'Sinh Nhật': db.sinhNhat,
            birthdate: db.sinhNhat, // Add birthdate alias for modal compatibility
            'Ngày vào làm': db.ngayVaoLam,
            'Vị trí': db.chucVu,
            'Bộ phận': db.phongBan,
            status: db.tinhTrang,
            role: db.quyen,
            zalo: db.zalo,
            tiktok: db.tiktok,
            facebook: db.facebook,
            fanpage: db.fanpage,
            web: db.web,
          };
        });

        console.log('Mapped users array:', usersArray);
        setUsers(usersArray);

        // If user is leader, find their department from employees data
        let leaderDept = '';
        if (userRole === 'leader' && userEmail) {
          const currentLeader = usersArray.find(
            (u) => (u.email || u.mail || u.Mail) === userEmail
          );
          if (currentLeader) {
            leaderDept = currentLeader['Bộ phận'] || currentLeader.phongBan || currentLeader.department || '';
            setUserDepartment(leaderDept);
          }
        }

        // Extract departments from employees data for filter panel
        const departments = [
          ...new Set(usersArray.map((u) => u['Bộ phận'] || u.phongBan || u.department).filter(Boolean)),
        ].sort();
        setAvailableFilters((prev) => ({ ...prev, departments }));

        // Initial filtering based on role/department for leader
        let filtered = usersArray;
        if (userRole === 'leader' && leaderDept) {
          filtered = usersArray.filter((user) => {
            const userDept = user['Bộ phận'] || user.phongBan || user.department || '';
            return userDept === leaderDept;
          });
        }

        setFilteredUsers(filtered);
      } catch (err) {
        console.error('Error loading employees from Firebase (employees):', err);
        toast.error('Lỗi khi tải dữ liệu nhân sự: ' + err.message);
        setUsers([]);
        setFilteredUsers([]);
      } finally {
        setLoading(false);
      }
    };

    // Only load if user is admin or leader
    if (userRole === 'admin' || userRole === 'leader') {
      loadEmployeesData();
    } else {
      setUsers([]);
      setFilteredUsers([]);
      setLoading(false);
    }
  }, [userRole, userEmail]);

  // Apply search filter
  useEffect(() => {
    let filtered = [...users];

    // Filter by department for leader
    if (userRole === "leader" && userDepartment) {
      filtered = filtered.filter((user) => {
        const userDept = user['Bộ phận'] || user.phongBan || user.department || '';
        return userDept === userDepartment;
      });
    }

    if (filters.departments && filters.departments.length > 0) {
      filtered = filtered.filter((user) =>
        filters.departments.includes(user['Bộ phận'] || user.department)
      );
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter((user) => {
        return Object.values(user).some((val) => {
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

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, userRole, userDepartment, filters.searchText, filters.departments]);

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

    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (value) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'this-month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      default:
        startDate = '';
        endDate = '';
    }

    setFilters((prev) => ({
      ...prev,
      startDate: startDate ? startDate.toISOString().split('T')[0] : '',
      endDate: endDate ? endDate.toISOString().split('T')[0] : '',
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      products: [],
      shifts: [],
      markets: [],
      departments: [],
      searchText: '',
    });
    setQuickSelectValue('');
  };

  const hasActiveFilters = () => {
    return (
      filters.searchText ||
      filters.startDate ||
      filters.endDate ||
      filters.products.length > 0 ||
      filters.shifts.length > 0 ||
      (filters.markets && filters.markets.length > 0) ||
      (filters.departments && filters.departments.length > 0)
    );
  };

  // Open edit modal
  const openEditModal = (user) => {
    // Store original password hash separately
    const originalPasswordHash = user.password || user.pass || '';
    setEditingUser({ 
      ...user,
      birthdate: user.birthdate || user['Sinh Nhật'] || '', // Ensure birthdate is set for modal
      password: '', // Clear password field to avoid re-hashing existing hash
      originalPasswordHash: originalPasswordHash, // Store original hash to restore if password not changed
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Open add modal
  const openAddModal = () => {
    setNewUser({
      "Họ Và Tên": "",
      username: "",
      password: "",
      phone: "",
      email: "",
      birthdate: "",
      startDate: new Date().toISOString().split("T")[0],
      "Vị trí": "",
      "Bộ phận": "",
      status: "active",
      role: "user",
      zalo: "",
      tiktok: "",
      facebook: "",
      fanpage: "",
      web: "",
    });
    setIsAddModalOpen(true);
  };

  // Close add modal
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewUser({
      "Họ Và Tên": "",
      email: "",
      password: "",
      "Bộ phận": "",
      "Vị trí": "",
      role: "user",
    });
  };

  // Add new user
  // Helper: calculate max birthdate (18 years ago from today)
  const getMaxBirthdate = () => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return maxDate.toISOString().split('T')[0];
  };

  // Helper: validate Vietnamese phone number (10 digits)
  const isValidPhone = (phone) => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // Helper: validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Helper: validate birthdate (>= 18 years old, not in future)
  const isValidBirthdate = (birthdate) => {
    if (!birthdate) return true; // Optional field
    const today = new Date();
    const birth = new Date(birthdate);

    // Check if date is in the future
    if (birth > today) return false;

    // Check if age >= 18
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();

    if (age < 18) return false;
    if (age === 18 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0))) return false;

    return true;
  };

  const handleAddUser = async () => {
    if (!newUser["Họ Và Tên"] || !newUser.username || !newUser.password || !newUser.email) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc: TVBH, user, pass, Mail");
      return;
    }

    if (newUser.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    // Validate phone number (10 digits)
    if (newUser.phone && !isValidPhone(newUser.phone)) {
      toast.error("Số điện thoại phải có đúng 10 chữ số!");
      return;
    }

    // Validate email format
    if (!isValidEmail(newUser.email)) {
      toast.error("Email không hợp lệ! Vui lòng nhập đúng định dạng (ví dụ: example@gmail.com)");
      return;
    }

    // Validate birthdate (>= 18 years old)
    if (newUser.birthdate && !isValidBirthdate(newUser.birthdate)) {
      toast.error("Ngày sinh không hợp lệ! Nhân viên phải từ 18 tuổi trở lên và ngày sinh không thể là ngày tương lai.");
      return;
    }

    try {
      const usersSnapshot = await get(ref(database, 'employees'));
      if (usersSnapshot.exists()) {
        const existingUsers = Object.values(usersSnapshot.val());
        const emailExists = existingUsers.some((user) => (user.mail || user.Mail || user.email) === newUser.email);
        if (emailExists) {
          toast.error('Email này đã được sử dụng!');
          return;
        }
      }

      const usersListRef = ref(database, 'employees');
      const newUserRef = push(usersListRef);
      const userId = newUserRef.key;

      // Ensure password is plain text before hashing
      const plainPassword = newUser.password;
      if (!plainPassword || plainPassword.trim() === '') {
        toast.error("Mật khẩu không được để trống!");
        return;
      }
      
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (plainPassword.startsWith('$2a$') || plainPassword.startsWith('$2b$') || plainPassword.startsWith('$2y$')) {
        toast.error("Lỗi: Mật khẩu đã được hash. Vui lòng nhập mật khẩu gốc.");
        return;
      }

      const hashedPassword = bcrypt.hashSync(plainPassword, 10);

      const usersRef = ref(database, `employees/${userId}`);
      const userData = {
        id: userId,
        TVBH: newUser['Họ Và Tên'] || '',
        user: newUser.username || (newUser.email || '').split('@')[0],
        pass: hashedPassword,
        soDienThoai: newUser.phone || '',
        mail: newUser.email || '',
        sinhNhat: newUser.birthdate || '',
        ngayVaoLam: newUser.startDate || new Date().toISOString(),
        chucVu: newUser['Vị trí'] || '',
        phongBan: newUser['Bộ phận'] || '',
        tinhTrang: newUser.status || 'active',
        quyen: newUser.role || 'user',
        zalo: newUser.zalo || '',
        tiktok: newUser.tiktok || '',
        facebook: newUser.facebook || '',
        fanpage: newUser.fanpage || '',
        web: newUser.web || '',
        createdAt: new Date().toISOString(),
        createdBy: localStorage.getItem('username') || 'admin',
      };

      await set(usersRef, userData);

      // Reload all employees data with the same mapping logic as initial load
      const usersSnapshotAfter = await get(ref(database, 'employees'));
      if (usersSnapshotAfter.exists()) {
        const data = usersSnapshotAfter.val();
        
        // Use the same mapping logic as in the initial load (lines 103-157)
        const usersArray = Object.entries(data).map(([firebaseKey, values]) => {
          // Use id from data if exists, otherwise use firebaseKey
          const employeeId = values['id'] || values.id || firebaseKey;
          
          // normalize DB shape to the exact keys (matching the sample data structure)
          const db = {
            id: employeeId,
            TVBH: values['TVBH'] || values.TVBH || '',
            user: values['user'] || values.username || '',
            pass: values['pass'] || values.password || '',
            soDienThoai: values['soDienThoai'] || values.phone || values.phoneNumber || '',
            mail: values['mail'] || values['Mail'] || values.email || '',
            sinhNhat: values['sinhNhat'] || values['Sinh Nhật'] || values.birthday || values.birthdate || '',
            ngayVaoLam: values['ngayVaoLam'] || values['Ngày vào làm'] || values.createdAt || values.startDate || '',
            chucVu: values['chucVu'] || values['Chức Vị'] || values.position || values['Vị trí'] || '',
            phongBan: values['phongBan'] || values['Phòng Ban'] || values.department || values['Bộ phận'] || '',
            tinhTrang: values['tinhTrang'] || values['tình trạng'] || values.status || '',
            quyen: values['quyen'] || values['Quyền'] || values.role || '',
            zalo: values['Zalo'] || values.zalo || '',
            tiktok: values['tiktok'] || values.TikTok || '',
            facebook: values['facebook'] || values.Facebook || '',
            fanpage: values['fanpage'] || '',
            web: values['web'] || '',
          };

          return {
            firebaseKey,
            id: employeeId,
            // Keep original values
            ...values,
            // Add normalized DB fields
            ...db,
            // Add UI-friendly aliases
            username: db.user,
            password: db.pass,
            phone: db.soDienThoai,
            email: db.mail,
            'Họ Và Tên': db.TVBH,
            'Sinh Nhật': db.sinhNhat,
            birthdate: db.sinhNhat, // Add birthdate alias for modal compatibility
            'Ngày vào làm': db.ngayVaoLam,
            'Vị trí': db.chucVu,
            'Bộ phận': db.phongBan,
            status: db.tinhTrang,
            role: db.quyen,
            zalo: db.zalo,
            tiktok: db.tiktok,
            facebook: db.facebook,
            fanpage: db.fanpage,
            web: db.web,
          };
        });
        
        setUsers(usersArray);

        // Apply filters
        let filtered = usersArray;
        // Filter by department for leader
        if (userRole === 'leader' && userDepartment) {
          filtered = usersArray.filter((user) => {
            const userDept = user['Bộ phận'] || user.phongBan || user.department || '';
            return userDept === userDepartment;
          });
        }
        if (filters.departments && filters.departments.length > 0) {
          filtered = filtered.filter((user) =>
            filters.departments.includes(user['Bộ phận'] || user.department)
          );
        }
        if (filters.searchText) {
          const searchLower = filters.searchText.toLowerCase();
          filtered = filtered.filter((user) => {
            return Object.values(user).some((val) => {
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
        setFilteredUsers(filtered);
      }

      closeAddModal();
      toast.success("Thêm nhân sự thành công!");
    } catch (err) {
      console.error("Error adding user:", err);
      toast.error("Đã xảy ra lỗi khi thêm nhân sự: " + err.message);
    }
  };

  // Open delete confirmation modal
  const openDeleteConfirm = (user) => {
    setDeletingUser(user);
  };

  // Close delete confirmation modal
  const closeDeleteConfirm = () => {
    setDeletingUser(null);
  };

  // Delete user from Firebase
  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      const userRef = ref(database, `employees/${deletingUser.firebaseKey}`);
      await remove(userRef);

      setUsers((prev) => prev.filter((user) => user.firebaseKey !== deletingUser.firebaseKey));
      setFilteredUsers((prev) => prev.filter((user) => user.firebaseKey !== deletingUser.firebaseKey));

      closeDeleteConfirm();
      toast.success("Xóa nhân sự thành công!");
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error("Lỗi khi xóa nhân sự");
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 bg-gradient-to-br from-slate-100 to-slate-200 min-h-screen">
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-500 mx-auto mb-3 sm:mb-4"></div>
            <p className="text-sm sm:text-base text-secondary-600">Đang tải dữ liệu nhân sự...</p>
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
              <h2 className="text-xl sm:text-2xl font-bold text-primary-700 truncate">Quản lý Nhân sự</h2>
            </div>
            {userRole === "admin" && (
              <button
                onClick={openAddModal}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-secondary-600 text-white rounded-lg border-2 border-transparent hover:bg-white hover:border-secondary-600 hover:text-secondary-600 transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
              >
                <span className="text-lg sm:text-xl">+</span>
                <span>Thêm mới</span>
              </button>
            )}
          </div>

      {/* Filter Panel - Horizontal */}
      <div className="mb-6">
        <FilterPanel
          activeTab={'users'}
          filters={filters}
          handleFilterChange={handleFilterChange}
          quickSelectValue={quickSelectValue}
          handleQuickDateSelect={handleQuickDateSelect}
          availableFilters={availableFilters}
          userRole={userRole}
          hasActiveFilters={hasActiveFilters}
          clearAllFilters={clearAllFilters}
          showMarkets={false}
        />
      </div>

      {/* Statistics */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-sm sm:text-base text-secondary-600">
              Tổng số:{" "}
              <span className="font-semibold text-primary-600">
                {filteredUsers.length}
              </span>{" "}
              nhân sự
              {filteredUsers.length > itemsPerPage && (
                <span className="hidden sm:inline ml-2">
                  | Trang {currentPage}/{totalPages}
                  <span className="ml-2 text-sm">
                    (Hiển thị {startIndex + 1}-
                    {Math.min(endIndex, filteredUsers.length)})
                  </span>
                </span>
              )}
            </p>
            {filteredUsers.length > itemsPerPage && (
              <p className="text-xs sm:hidden text-secondary-500">
                Trang {currentPage}/{totalPages} ({startIndex + 1}-{Math.min(endIndex, filteredUsers.length)})
              </p>
            )}
          </div>

      {/* User Management Table */}
      {filteredUsers.length === 0 ? (
            <div className="text-center py-8 bg-secondary-50 rounded-lg">
              <p className="text-secondary-600">Không có dữ liệu nhân sự</p>
            </div>
          ) : (
            <div className="overflow-x-auto shadow-md rounded-lg -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-secondary-100">
                  <thead className="bg-primary-400">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-black uppercase tracking-wider border border-gray-300 whitespace-nowrap">
                        stt
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-black uppercase tracking-wider border border-gray-300 whitespace-nowrap">
                        TVBH
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-black uppercase tracking-wider border border-gray-300 whitespace-nowrap">
                        Số Điện Thoại
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-black uppercase tracking-wider border border-gray-300 whitespace-nowrap">
                        Mail
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-black uppercase tracking-wider border border-gray-300 whitespace-nowrap">
                        Sinh Nhật
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-black uppercase tracking-wider border border-gray-300 whitespace-nowrap">
                        Ngày vào làm
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-black uppercase tracking-wider border border-gray-300 whitespace-nowrap">
                        Chức Vụ
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-black uppercase tracking-wider border border-gray-300 whitespace-nowrap">
                        Phòng Ban
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-black uppercase tracking-wider border border-gray-300 whitespace-nowrap">
                        Tình trạng
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-black uppercase tracking-wider border border-gray-300 whitespace-nowrap">
                        Quyền
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-black uppercase tracking-wider border border-gray-300 whitespace-nowrap">
                        Mạng xã hội
                      </th>
                      <th className="px-2 sm:px-3 py-2 text-center text-[10px] sm:text-xs font-bold text-black uppercase tracking-wider border border-gray-300 whitespace-nowrap">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                <tbody className="bg-neutral-white divide-y divide-secondary-100">
                  {currentUsers.map((user, index) => (
                    <tr
                      key={user.firebaseKey || user.id}
                      className="hover:bg-secondary-50"
                    >
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm font-semibold text-black border border-secondary-400">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        <div className="max-w-[120px] sm:max-w-none truncate" title={user["Họ Và Tên"] || user.name || "-"}>
                          {user["Họ Và Tên"] || user.name || "-"}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        {user.phone ||
                          user["Số Điện Thoại"] ||
                          user.phoneNumber ||
                          "-"}
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        <div className="max-w-[150px] sm:max-w-none truncate" title={user.email || "-"}>
                          {user.email || "-"}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        {user["Sinh Nhật"] || user.birthdate || "-"}
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        {user["Ngày vào làm"] || user.createdAt || "-"}
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        <div className="max-w-[100px] sm:max-w-none truncate" title={user["Vị trí"] || user.position || "-"}>
                          {user["Vị trí"] || user.position || "-"}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        <div className="max-w-[100px] sm:max-w-none truncate" title={user["Bộ phận"] || user.department || "-"}>
                          {user["Bộ phận"] || user.department || "-"}
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        {user.status || "-"}
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400">
                        {user.role || "-"}
                      </td>
                      <td className="px-2 sm:px-3 py-2 align-top text-xs sm:text-sm text-black border border-secondary-400">
                        <div className="flex flex-col gap-1 sm:gap-2">
                          {user.zalo ? (
                            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-black">
                              <img src={zaloIcon} alt="Zalo" className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span className="truncate max-w-[100px]">{user.zalo}</span>
                            </div>
                          ) : null}

                          {user.tiktok ? (
                            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-black">
                              <img src={tiktokIcon} alt="TikTok" className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span className="truncate max-w-[100px]">{user.tiktok}</span>
                            </div>
                          ) : null}

                          {user.facebook ? (
                            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-black">
                              <img src={facebookIcon} alt="Facebook" className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span className="truncate max-w-[100px]">{user.facebook}</span>
                            </div>
                          ) : null}

                          {user.fanpage ? (
                            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-black">
                              <img src={fanpageIcon} alt="Fanpage" className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span className="truncate max-w-[100px]">{user.fanpage}</span>
                            </div>
                          ) : null}

                          {user.web ? (
                            <a
                              href={user.web.startsWith("http") ? user.web : `https://${user.web}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-black underline"
                            >
                              <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="truncate max-w-[100px]">{user.web}</span>
                            </a>
                          ) : null}

                          {!user.zalo && !user.tiktok && !user.facebook && !user.fanpage && !user.web && (
                            <span className="text-xs sm:text-sm text-black">-</span>
                          )}
                        </div>
                      </td>

                      {/* Action column */}
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-black border border-secondary-400 text-center">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          {/* Only admin can edit */}
                          {userRole === 'admin' && (
                            <button
                              onClick={() => openEditModal(user)}
                              className="inline-flex items-center px-1.5 sm:px-2 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}

                          {/* Only admin can delete */}
                          {userRole === 'admin' && (
                            <button
                              onClick={() => openDeleteConfirm(user)}
                              className="inline-flex items-center px-1.5 sm:px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
      )}

      {/* Pagination */}
      {filteredUsers.length > itemsPerPage && (
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
                      {Math.min(endIndex, filteredUsers.length)}
                    </span>{" "}
                    trong tổng số{" "}
                    <span className="font-medium">{filteredUsers.length}</span> nhân
                    sự
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

      {/* Edit Modal */}
      {isModalOpen && editingUser && (
            <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="modal-box bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[calc(100vh-2rem)] overflow-auto">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-400 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg sticky top-0 z-10">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Chỉnh sửa thông tin nhân sự
                  </h3>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {/* TVBH */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">TVBH <span className="text-accent-red">*</span></label>
                      <input
                        type="text"
                        value={editingUser["Họ Và Tên"] || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, "Họ Và Tên": e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="TVBH tên"
                      />
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">User <span className="text-accent-red">*</span></label>
                      <input
                        type="text"
                        value={editingUser.username || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Tên đăng nhập"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Pass <span className="text-accent-red">(để trống nếu không đổi)</span></label>
                      <input
                        type="password"
                        value={editingUser.password || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Mật khẩu mới (tùy chọn)"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Số Điện Thoại</label>
                      <input
                        type="tel"
                        value={editingUser.phone || ""}
                        maxLength={10}
                        pattern="[0-9]{10}"
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setEditingUser({ ...editingUser, phone: value });
                        }}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Số điện thoại (10 số)"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Mail <span className="text-accent-red">*</span></label>
                      <input
                        type="email"
                        value={editingUser.email || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Email"
                      />
                    </div>

                    {/* Birthdate */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Sinh Nhật</label>
                      <input
                        type="date"
                        value={editingUser.birthdate || ""}
                        max={getMaxBirthdate()}
                        onChange={(e) => setEditingUser({ ...editingUser, birthdate: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Ngày vào làm</label>
                      <input
                        type="date"
                        value={editingUser["Ngày vào làm"] || editingUser.startDate || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, "Ngày vào làm": e.target.value, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Position */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Chức Vụ</label>
                      <input
                        type="text"
                        value={editingUser["Vị trí"] || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, "Vị trí": e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Chức vụ"
                      />
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Phòng Ban</label>
                      <input
                        type="text"
                        value={editingUser["Bộ phận"] || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, "Bộ phận": e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Phòng ban"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Tình trạng</label>
                      <select
                        value={editingUser.status || "active"}
                        onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Quyền</label>
                      <select
                        value={editingUser.role || "user"}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="user">User</option>
                        <option value="leader">Leader</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {/* Zalo */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Zalo</label>
                      <input
                        type="text"
                        value={editingUser.zalo || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, zalo: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Zalo"
                      />
                    </div>

                    {/* Tiktok */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">TikTok</label>
                      <input
                        type="text"
                        value={editingUser.tiktok || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, tiktok: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="TikTok"
                      />
                    </div>

                    {/* Facebook */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Facebook</label>
                      <input
                        type="text"
                        value={editingUser.facebook || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, facebook: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Facebook"
                      />
                    </div>

                    {/* Fanpage */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Fanpage</label>
                      <input
                        type="text"
                        value={editingUser.fanpage || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, fanpage: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Fanpage"
                      />
                    </div>

                    {/* Web */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Web</label>
                      <input
                        type="url"
                        value={editingUser.web || ""}
                        onChange={(e) => setEditingUser({ ...editingUser, web: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Website"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-secondary-600 mt-4"><span className="text-accent-red">*</span> Các trường bắt buộc: TVBH, user, Mail (pass để trống nếu không đổi)</p>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-lg flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 sticky bottom-0">
                  <button
                    onClick={closeModal}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <X className="w-4 h-4" />
                    <span>Hủy</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (!editingUser["Họ Và Tên"] || !editingUser.username || !editingUser.email) {
                        toast.error("Vui lòng điền đầy đủ thông tin bắt buộc: TVBH, user, Mail");
                        return;
                      }

                      try {
                        const updatedForDB = {
                          user: editingUser.username || (editingUser.email || '').split('@')[0],
                          TVBH: editingUser['Họ Và Tên'] || '',
                          mail: editingUser.email || '',
                          soDienThoai: editingUser.phone || '',
                          sinhNhat: editingUser.birthdate || '',
                          ngayVaoLam: editingUser['Ngày vào làm'] || editingUser.startDate || '',
                          chucVu: editingUser['Vị trí'] || '',
                          phongBan: editingUser['Bộ phận'] || '',
                          tinhTrang: editingUser.status || '',
                          quyen: editingUser.role || 'user',
                          zalo: editingUser.zalo || '',
                          tiktok: editingUser.tiktok || '',
                          facebook: editingUser.facebook || '',
                          fanpage: editingUser.fanpage || '',
                          web: editingUser.web || '',
                        };

                        // Handle password update
                        if (editingUser.password && editingUser.password.trim().length > 0) {
                          // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
                          const isAlreadyHashed = editingUser.password.startsWith('$2a$') || 
                                                   editingUser.password.startsWith('$2b$') || 
                                                   editingUser.password.startsWith('$2y$');
                          
                          if (!isAlreadyHashed) {
                            // It's a new password, validate and hash it
                            if (editingUser.password.length < 6) {
                              toast.error('Mật khẩu phải có ít nhất 6 ký tự!');
                              return;
                            }
                            const hashed = bcrypt.hashSync(editingUser.password, 10);
                            updatedForDB.pass = hashed;
                          } else {
                            // If already hashed, don't update password (keep existing hash)
                            // Don't set pass field, so it won't be updated
                          }
                        } else {
                          // If password is empty, use original password hash to keep it unchanged
                          if (editingUser.originalPasswordHash) {
                            updatedForDB.pass = editingUser.originalPasswordHash;
                          }
                          // If no original hash, don't update password field in DB
                        }

                        await update(ref(database, `employees/${editingUser.firebaseKey}`), updatedForDB);

                        const updatedForUI = {
                          ...updatedForDB,
                          'Họ Và Tên': updatedForDB.TVBH,
                          'Bộ phận': updatedForDB.phongBan,
                          'Vị trí': updatedForDB.chucVu,
                          username: updatedForDB.user,
                          email: updatedForDB.mail,
                          phone: updatedForDB.soDienThoai,
                          'Sinh Nhật': updatedForDB.sinhNhat,
                          birthdate: updatedForDB.sinhNhat,
                          'Ngày vào làm': updatedForDB.ngayVaoLam,
                          startDate: updatedForDB.ngayVaoLam,
                          status: updatedForDB.tinhTrang,
                          role: updatedForDB.quyen,
                          zalo: updatedForDB.zalo,
                          tiktok: updatedForDB.tiktok,
                          facebook: updatedForDB.facebook,
                          fanpage: updatedForDB.fanpage,
                          web: updatedForDB.web,
                        };

                        setUsers((prev) =>
                          prev.map((u) =>
                            u.firebaseKey === editingUser.firebaseKey
                              ? { ...u, ...updatedForUI }
                              : u
                          )
                        );
                        setFilteredUsers((prev) =>
                          prev.map((u) =>
                            u.firebaseKey === editingUser.firebaseKey
                              ? { ...u, ...updatedForUI }
                              : u
                          )
                        );

                        setIsModalOpen(false);
                        setEditingUser(null);
                        toast.success('Cập nhật thông tin nhân sự thành công!');
                      } catch (err) {
                        console.error('Error updating employee:', err);
                        toast.error('Lỗi khi cập nhật thông tin nhân sự: ' + err.message);
                      }
                    }}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-secondary-600 text-white font-medium rounded-lg hover:bg-secondary-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu thay đổi</span>
                  </button>
                </div>
              </div>
            </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
            <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="modal-box bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[calc(100vh-2rem)] overflow-auto">
                <div className="bg-gradient-to-r from-primary-600 to-primary-400 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg sticky top-0 z-10">
                  <h3 className="text-lg sm:text-xl font-bold text-white">Thêm nhân sự mới</h3>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {/* TVBH */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">TVBH <span className="text-accent-red">*</span></label>
                      <input
                        type="text"
                        value={newUser["Họ Và Tên"]}
                        onChange={(e) => setNewUser({ ...newUser, "Họ Và Tên": e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="TVBH tên"
                      />
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">User <span className="text-accent-red">*</span></label>
                      <input
                        type="text"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Tên đăng nhập"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Pass <span className="text-accent-red">*</span></label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Mật khẩu"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Số Điện Thoại</label>
                      <input
                        type="tel"
                        value={newUser.phone}
                        maxLength={10}
                        pattern="[0-9]{10}"
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setNewUser({ ...newUser, phone: value });
                        }}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Số điện thoại (10 số)"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Mail <span className="text-accent-red">*</span></label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Email"
                      />
                    </div>

                    {/* Birthdate */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Sinh Nhật</label>
                      <input
                        type="date"
                        value={newUser.birthdate}
                        max={getMaxBirthdate()}
                        onChange={(e) => setNewUser({ ...newUser, birthdate: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Ngày vào làm</label>
                      <input
                        type="date"
                        value={newUser.startDate}
                        onChange={(e) => setNewUser({ ...newUser, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Position */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Chức Vụ</label>
                      <input
                        type="text"
                        value={newUser["Vị trí"]}
                        onChange={(e) => setNewUser({ ...newUser, "Vị trí": e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Chức vụ"
                      />
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Phòng Ban</label>
                      <input
                        type="text"
                        value={newUser["Bộ phận"]}
                        onChange={(e) => setNewUser({ ...newUser, "Bộ phận": e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Phòng ban"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Tình trạng</label>
                      <select
                        value={newUser.status}
                        onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Quyền</label>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="user">User</option>
                        <option value="leader">Leader</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {/* Zalo */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Zalo</label>
                      <input
                        type="text"
                        value={newUser.zalo}
                        onChange={(e) => setNewUser({ ...newUser, zalo: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Zalo"
                      />
                    </div>

                    {/* Tiktok */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">TikTok</label>
                      <input
                        type="text"
                        value={newUser.tiktok}
                        onChange={(e) => setNewUser({ ...newUser, tiktok: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="TikTok"
                      />
                    </div>

                    {/* Facebook */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Facebook</label>
                      <input
                        type="text"
                        value={newUser.facebook}
                        onChange={(e) => setNewUser({ ...newUser, facebook: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Facebook"
                      />
                    </div>

                    {/* Fanpage */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Fanpage</label>
                      <input
                        type="text"
                        value={newUser.fanpage}
                        onChange={(e) => setNewUser({ ...newUser, fanpage: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Fanpage"
                      />
                    </div>

                    {/* Web */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-900 mb-2">Web</label>
                      <input
                        type="url"
                        value={newUser.web}
                        onChange={(e) => setNewUser({ ...newUser, web: e.target.value })}
                        className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Website"
                      />
                    </div>
                  </div>

                  <p className="text-sm text-secondary-600 mt-4"><span className="text-accent-red">*</span> Các trường bắt buộc: TVBH, user, pass, Mail</p>
                </div>

                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-lg flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 sticky bottom-0">
                  <button
                    onClick={closeAddModal}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <X className="w-4 h-4" />
                    <span>Hủy</span>
                  </button>
                  <button
                    onClick={handleAddUser}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-secondary-600 text-white font-medium rounded-lg hover:bg-secondary-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Check className="w-4 h-4" />
                    <span>Thêm nhân sự</span>
                  </button>
                </div>
              </div>
            </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
            <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="modal-box bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="bg-gradient-to-r from-red-600 to-pink-600 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    ⚠️ Xác nhận xóa nhân sự
                  </h3>
                </div>

                <div className="p-4 sm:p-6">
                  <p className="text-gray-700 mb-4">
                    Bạn có chắc chắn muốn xóa nhân sự này không?
                  </p>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">
                        Họ và Tên:
                      </span>{" "}
                      <span className="text-gray-900">
                        {deletingUser["Họ Và Tên"]}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">Email:</span>{" "}
                      <span className="text-gray-900">{deletingUser.email}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">Bộ phận:</span>{" "}
                      <span className="text-gray-900">
                        {deletingUser["Bộ phận"] || "-"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold text-gray-700">Vị trí:</span>{" "}
                      <span className="text-gray-900">
                        {deletingUser["Vị trí"] || "-"}
                      </span>
                    </p>
                  </div>

                  <p className="text-red-600 font-medium text-sm mt-4">
                    ⚠️ Hành động này không thể hoàn tác!
                  </p>
                </div>

                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-lg flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                  <button
                    onClick={closeDeleteConfirm}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <X className="w-4 h-4" />
                    <span>Hủy</span>
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa nhân sự</span>
                  </button>
                </div>
              </div>
            </div>
      )}
    </div>
  );
}
