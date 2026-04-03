import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ref, get, update } from "firebase/database";
import { database } from "../firebase/config";
import { X, Edit, ArrowLeft, Image, Printer } from "lucide-react";
import { toast } from "react-toastify";
import { carPriceData as staticCarPriceData, uniqueNgoaiThatColors, uniqueNoiThatColors } from '../data/calculatorData';
import { useCarPriceData } from '../contexts/CarPriceDataContext';
import { uploadImageToCloudinary } from '../config/cloudinary';
import { getAllBranches } from '../data/branchData';
import CurrencyInput from '../components/shared/CurrencyInput';
import { generateVSO, isFullVSOFormat } from '../utils/vsoGenerator';

export default function EditHopDongDaXuatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { carPriceData: carPriceDataFromContext } = useCarPriceData();
  const carPriceData = Array.isArray(carPriceDataFromContext) && carPriceDataFromContext.length > 0 ? carPriceDataFromContext : staticCarPriceData;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State for employees list
  const [employees, setEmployees] = useState([]);

  // List of issue places (nơi cấp)
  const issuePlaces = [
    "Bộ Công An",
    "Cục trưởng cục cảnh sát quản lý hành chính về trật tự xã hội"
  ];

  // State for image modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [depositImage, setDepositImage] = useState("");
  const [counterpartImage, setCounterpartImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingImageType, setUploadingImageType] = useState(null); // 'deposit' or 'counterpart'
  const hasOpenedImageModalRef = useRef(false); // Track if we've already opened the modal

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
    id: "",
    stt: "",
    ngayXhd: "",
    tvbh: "",
    vso: "",
    tenKh: "",
    soDienThoai: "",
    email: "",
    diaChi: "",
    cccd: "",
    ngayCap: "",
    noiCap: "",
    dongXe: "",
    phienBan: "",
    ngoaiThat: "",
    noiThat: "",
    giaNiemYet: "",
    giaGiam: "",
    giaHopDong: "",
    giaXuatHoaDon: "",
    soTienCoc: "",
    tienDoiUng: "",
    thanhToan: "",
    soTienVay: "",
    soKhung: "",
    soMay: "",
    tinhTrang: "",
    nganHang: "",
    quaTang: "",
    quaTangKhac: "",
    soTienPhaiThu: "",
    // Company customer fields
    khachHangLa: "",
    msdn: "",
    daiDien: "",
    chucVu: "",
    giayUyQuyen: "",
    giayUyQuyenNgay: "",
    showroom: "",
    namSanXuat: "",
  });

  // Load contract data
  useEffect(() => {
    const loadContract = async () => {
      try {
        const contractsRef = ref(database, "exportedContracts");
        const snapshot = await get(contractsRef);
        const data = snapshot.exists() ? snapshot.val() : {};

        // Find contract by firebaseKey (id from params)
        const contractData = data[id];
        if (!contractData) {
          toast.error("Không tìm thấy hợp đồng!");
          navigate("/hop-dong-da-xuat");
          return;
        }

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

        // Map contract data
        const mapped = {
          id: contractData.id || "",
          stt: contractData.stt || "",
          ngayXhd: contractData.ngayXhd || contractData["ngày xhd"] || contractData.exportDate || "",
          tvbh: contractData.tvbh || contractData.TVBH || "",
          vso: contractData.vso || contractData.VSO || "",
          tenKh: contractData.tenKh || contractData["Tên Kh"] || contractData.customerName || "",
          soDienThoai: contractData.soDienThoai || contractData["Số Điện Thoại"] || contractData.phone || "",
          email: contractData.email || contractData.Email || "",
          diaChi: contractData.diaChi || contractData["Địa Chỉ"] || contractData.address || "",
          cccd: contractData.cccd || contractData.CCCD || "",
          ngayCap: contractData.ngayCap || contractData["Ngày Cấp"] || contractData.issueDate || "",
          noiCap: contractData.noiCap || contractData["Nơi Cấp"] || contractData.issuePlace || "",
          dongXe: contractData.dongXe || contractData["Dòng xe"] || contractData.model || "",
          phienBan: contractData.phienBan || contractData["Phiên Bản"] || contractData.variant || "",
          ngoaiThat: mapExteriorColor(contractData.ngoaiThat || contractData["Ngoại Thất"] || contractData.exterior || ""),
          noiThat: mapInteriorColor(contractData.noiThat || contractData["Nội Thất"] || contractData.interior || ""),
          giaNiemYet: contractData.giaNiemYet || contractData["Giá Niêm Yết"] || contractData.listPrice || "",
          giaGiam: contractData.giaGiam || contractData["Giá Giảm"] || contractData.discountPrice || "",
          giaHopDong: contractData.giaHopDong || contractData["Giá Hợp Đồng"] || contractData.contractPrice || "",
          giaXuatHoaDon: contractData.giaXuatHoaDon || contractData["Giá Xuất Hóa Đơn"] || contractData.giaHopDong || contractData["Giá Hợp Đồng"] || contractData.contractPrice || "",
          soTienCoc: contractData.soTienCoc || contractData["Số tiền cọc"] || contractData.deposit || contractData.tienDatCoc || contractData["Tiền đặt cọc"] || "",
          tienDoiUng: contractData.tienDoiUng || contractData["Tiền đối ứng"] || contractData.convertSupportDiscount || "",
          thanhToan: contractData.thanhToan || contractData.payment || "",
          soTienVay: contractData.soTienVay || contractData.tienVay || contractData.loanAmount || contractData.tienVayNganHang || "",
          soKhung: contractData.soKhung || contractData["Số Khung"] || contractData.chassisNumber || "",
          soMay: contractData.soMay || contractData["Số Máy"] || contractData.engineNumber || "",
          tinhTrang: contractData.tinhTrang || contractData["Tình Trạng"] || contractData.status || "",
          nganHang: contractData.nganHang || contractData["ngân hàng"] || contractData.bank || "",
          quaTang: contractData.quaTang || contractData["Quà tặng"] || contractData["quà tặng"] || "",
          quaTangKhac: contractData.quaTangKhac || contractData["Quà tặng khác"] || contractData["quà tặng khác"] || "",
          soTienPhaiThu: contractData.soTienPhaiThu || contractData["Số tiền phải thu"] || contractData.giamGia || contractData["Giảm giá"] || "",
          // Company customer fields
          khachHangLa: contractData.khachHangLa || "",
          msdn: contractData.msdn || "",
          daiDien: contractData.daiDien || "",
          chucVu: contractData.chucVu || "",
          giayUyQuyen: contractData.giayUyQuyen || "",
          giayUyQuyenNgay: contractData.giayUyQuyenNgay || "",
          showroom: contractData.showroom || contractData.Showroom || contractData["Showroom"] || "",
          namSanXuat: contractData.namSanXuat || contractData["Năm sản xuất"] || contractData.year || "",
        };

        setContract(mapped);

        // Load images if they exist
        setDepositImage(contractData.depositImage || contractData["Ảnh chụp hình đặt cọc"] || "");
        setCounterpartImage(contractData.counterpartImage || contractData["Ảnh chụp đối ứng"] || "");
        setLoading(false);
      } catch (err) {
        console.error("Error loading contract:", err);
        toast.error("Lỗi khi tải dữ liệu hợp đồng");
        setLoading(false);
        navigate("/hop-dong-da-xuat");
      }
    };

    if (id) {
      loadContract();
    }
  }, [id, navigate]);

  // Reset ref when id changes (new contract loaded)
  useEffect(() => {
    hasOpenedImageModalRef.current = false;
  }, [id]);

  // Auto-open image modal if navigated from list page with flag (only once)
  useEffect(() => {
    if (location.state?.openImageModal && !loading && !hasOpenedImageModalRef.current) {
      hasOpenedImageModalRef.current = true;
      setIsImageModalOpen(true);
      // Clear the state to prevent reopening on re-render
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, loading, navigate, location.pathname]);

  // Get unique car models from carPriceData (Firebase khi có — đồng bộ với Quản trị bảng giá)
  const carModels = useMemo(() => {
    const uniqueModels = new Set();
    carPriceData.forEach((car) => {
      if (car.model) uniqueModels.add(car.model);
    });

    // Custom sort order: VF series first, then other models
    const modelOrder = ['VF 3', 'VF 5', 'VF 6', 'VF 7', 'VF 8', 'VF 9', 'Minio', 'Herio', 'Nerio', 'Limo', 'EC', 'EC Nâng Cao'];

    return Array.from(uniqueModels).sort((a, b) => {
      const indexA = modelOrder.indexOf(a);
      const indexB = modelOrder.indexOf(b);

      // If both are in the order list, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only A is in the list, it comes first
      if (indexA !== -1) return -1;
      // If only B is in the list, it comes first
      if (indexB !== -1) return 1;
      // If neither is in the list, sort alphabetically
      return a.localeCompare(b);
    });
  }, [carPriceData]);

  // Get available trims (variants) for selected model
  const availableTrims = useMemo(() => {
    if (!contract.dongXe) return [];
    const trims = new Set();
    carPriceData.forEach((car) => {
      if (car.model === contract.dongXe && car.trim) {
        trims.add(car.trim);
      }
    });
    return Array.from(trims).sort();
  }, [contract.dongXe, carPriceData]);

  // Get available exterior colors for selected model and trim
  const availableExteriorColors = useMemo(() => {
    if (!contract.dongXe || !contract.phienBan) return [];
    const colorCodes = new Set();
    carPriceData.forEach((car) => {
      if (car.model === contract.dongXe && car.trim === contract.phienBan && car.exterior_color) {
        colorCodes.add(car.exterior_color);
      }
    });
    return uniqueNgoaiThatColors.filter((color) => colorCodes.has(color.code));
  }, [contract.dongXe, contract.phienBan, carPriceData]);

  // Get available interior colors for selected model and trim
  const availableInteriorColors = useMemo(() => {
    if (!contract.dongXe || !contract.phienBan) return [];
    const colorCodes = new Set();
    carPriceData.forEach((car) => {
      if (car.model === contract.dongXe && car.trim === contract.phienBan && car.interior_color) {
        colorCodes.add(car.interior_color);
      }
    });
    return uniqueNoiThatColors.filter((color) => colorCodes.has(color.code));
  }, [contract.dongXe, contract.phienBan, carPriceData]);

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
    if (!value) return '';
    // Remove all non-digit characters
    const numericValue = String(value).replace(/\D/g, '');
    if (!numericValue) return '';
    // Format with thousand separators
    return new Intl.NumberFormat('vi-VN').format(parseInt(numericValue));
  };

  // Parse currency from formatted string (remove thousand separators)
  const parseCurrency = (value) => {
    if (!value) return '';
    // Remove all non-digit characters
    return String(value).replace(/\D/g, '');
  };

  // Handle form input change
  const handleChange = async (field, value) => {
    // Auto-generate VSO when showroom changes (only if current VSO is not full format)
    if (field === 'showroom' && value) {
      const selectedBranch = getAllBranches().find(b => b.name === value);
      if (selectedBranch) {
        // Only generate new VSO if current one is not in full format
        const currentVSO = contract.VSO || '';
        if (!isFullVSOFormat(currentVSO)) {
          try {
            const newVSO = await generateVSO(selectedBranch.maDms);
            setContract((prev) => ({
              ...prev,
              showroom: value,
              VSO: newVSO,
            }));
            return;
          } catch (error) {
            console.error('Error generating VSO:', error);
          }
        }
        // If VSO already has full format, just update showroom
        setContract((prev) => ({
          ...prev,
          showroom: value,
        }));
        return;
      }
    }

    setContract((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      // Reset dependent fields when model changes
      if (field === 'dongXe') {
        updated.phienBan = '';
        updated.ngoaiThat = '';
        updated.noiThat = '';
      }

      // Reset dependent fields when variant changes
      if (field === 'phienBan') {
        updated.ngoaiThat = '';
        updated.noiThat = '';
      }

      // Reset dependent fields when exterior changes
      if (field === 'ngoaiThat') {
        updated.noiThat = '';
      }

      // Tự động điền Giá Niêm Yết từ bảng giá (Firebase) khi chọn đủ dòng xe + phiên bản + màu
      if (['dongXe', 'phienBan', 'ngoaiThat', 'noiThat'].includes(field) && updated.dongXe && updated.phienBan) {
        const match = carPriceData.find(
          (c) =>
            c.model === updated.dongXe &&
            c.trim === updated.phienBan &&
            (c.exterior_color === updated.ngoaiThat || !updated.ngoaiThat) &&
            (c.interior_color === updated.noiThat || !updated.noiThat)
        );
        if (match && match.price_vnd != null) {
          updated.giaNiemYet = String(match.price_vnd);
        }
      }

      return updated;
    });
  };

  // Handle currency input change (format on display, store raw number)
  const handleCurrencyChange = (field, value) => {
    // Parse the input to get raw number
    const rawValue = parseCurrency(value);
    // Update state with raw number
    handleChange(field, rawValue);
  };

  // Handle image file upload to Cloudinary
  const handleImageUpload = async (e, imageType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
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
      if (imageType === 'deposit') {
        setDepositImage(imageUrl);
      } else if (imageType === 'counterpart') {
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
      e.target.value = '';
    }
  };

  // Open image modal
  const openImageModal = () => {
    setIsImageModalOpen(true);
  };

  // Close image modal
  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  // Save images
  const handleSaveImages = async () => {
    try {
      const contractRef = ref(database, `exportedContracts/${id}`);
      await update(contractRef, {
        "Ảnh chụp hình đặt cọc": depositImage || "",
        "Ảnh chụp đối ứng": counterpartImage || "",
        depositImage: depositImage || "",
        counterpartImage: counterpartImage || "",
      });
      toast.success("Lưu ảnh thành công!");
      closeImageModal();
    } catch (err) {
      console.error("Error saving images:", err);
      toast.error("Lỗi khi lưu ảnh");
    }
  };

  // Handle print PhuLucHopDong
  const handlePrintPhuLuc = () => {
    const printData = {
      id: contract.id,
      firebaseKey: id,
      stt: contract.stt,
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
      soTienVay: contract.soTienVay || "",
      deposit: contract.soTienCoc,
      soTienCoc: contract.soTienCoc || "",
      tienDatCoc: contract.soTienCoc || "",
      "Số tiền cọc": contract.soTienCoc || "",
      "Tiền đặt cọc": contract.soTienCoc || "",
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
      quaTang: contract.quaTang || "",
      "Quà tặng": contract.quaTang || "",
      quaTangKhac: contract.quaTangKhac || "",
      "Quà tặng khác": contract.quaTangKhac || "",
      giamGia: contract.giamGia || "",
      "Giảm giá": contract.giamGia || "",
      soTienPhaiThu: contract.soTienPhaiThu || contract.giamGia || "",
      "Số tiền phải thu": contract.soTienPhaiThu || contract.giamGia || "",
      showroom: contract.showroom || "",
      Showroom: contract.showroom || "",
      depositImage: depositImage || "",
      "Ảnh chụp hình đặt cọc": depositImage || "",
      counterpartImage: counterpartImage || "",
      "Ảnh chụp đối ứng": counterpartImage || "",
      namSanXuat: contract.namSanXuat || "",
    };
    navigate("/phu-luc-hop-dong", { state: printData });
  };

  // Save contract
  const handleSave = async () => {
    try {
      setSaving(true);

      const contractRef = ref(database, `exportedContracts/${id}`);
      const safeValue = (val) => (val !== undefined && val !== null ? val : "");
      // Firebase rules validate numeric fields as number >= 0; empty string causes PERMISSION_DENIED
      const safeNum = (val) => {
        if (val === undefined || val === null || val === "") return 0;
        const n = Number(val);
        return Number.isFinite(n) && n >= 0 ? n : 0;
      };
      const safeThanhToan = (val) => {
        const v = (val || "").trim();
        return v === "trả góp" || v === "trả thẳng" ? v : "trả thẳng";
      };

      await update(contractRef, {
        id: safeValue(contract.id),
        stt: safeValue(contract.stt),
        ngayXhd: safeValue(contract.ngayXhd),
        tvbh: safeValue(contract.tvbh),
        vso: safeValue(contract.vso),
        "Tên Kh": safeValue(contract.tenKh),
        "Số Điện Thoại": safeValue(contract.soDienThoai),
        Email: safeValue(contract.email),
        "Địa Chỉ": safeValue(contract.diaChi),
        CCCD: safeValue(contract.cccd),
        "Ngày Cấp": safeValue(contract.ngayCap),
        "Nơi Cấp": safeValue(contract.noiCap),
        "Dòng xe": safeValue(contract.dongXe),
        "Phiên Bản": safeValue(contract.phienBan),
        "Ngoại Thất": safeValue(contract.ngoaiThat),
        "Nội Thất": safeValue(contract.noiThat),
        "Giá Niêm Yết": safeNum(contract.giaNiemYet),
        "Giá Giảm": safeNum(contract.giaGiam),
        "Giá Hợp Đồng": safeNum(contract.giaHopDong),
        giaXuatHoaDon: safeNum(contract.giaXuatHoaDon),
        "Giá Xuất Hóa Đơn": safeNum(contract.giaXuatHoaDon),
        "Số tiền cọc": safeNum(contract.soTienCoc),
        "Tiền đặt cọc": safeNum(contract.soTienCoc),
        soTienCoc: safeNum(contract.soTienCoc),
        tienDatCoc: safeNum(contract.soTienCoc),
        "Tiền đối ứng": safeNum(contract.tienDoiUng),
        tienDoiUng: safeNum(contract.tienDoiUng),
        thanhToan: safeThanhToan(contract.thanhToan),
        soTienVay: safeNum(contract.soTienVay),
        tienVayNganHang: safeNum(contract.soTienVay),
        "Số Khung": safeValue(contract.soKhung),
        "Số Máy": safeValue(contract.soMay),
        "Tình Trạng": safeValue(contract.tinhTrang),
        "ngân hàng": safeValue(contract.nganHang),
        "quà tặng theo xe": safeValue(contract.quaTang),
        "Quà tặng": safeValue(contract.quaTang),
        "Quà tặng khác": safeValue(contract.quaTangKhac),
        "quà tặng khác": safeValue(contract.quaTangKhac),
        "Số tiền vay": safeNum(contract.soTienVay),
        "Số tiền phải thu": safeNum(contract.soTienPhaiThu),
        quaTang: safeValue(contract.quaTang),
        quaTangKhac: safeValue(contract.quaTangKhac),
        soTienPhaiThu: safeNum(contract.soTienPhaiThu),
        // Company customer fields
        khachHangLa: safeValue(contract.khachHangLa),
        msdn: safeValue(contract.msdn),
        daiDien: safeValue(contract.daiDien),
        chucVu: safeValue(contract.chucVu),
        giayUyQuyen: safeValue(contract.giayUyQuyen),
        giayUyQuyenNgay: safeValue(contract.giayUyQuyenNgay),
        showroom: safeValue(contract.showroom),
        namSanXuat: safeValue(contract.namSanXuat),
        "Ảnh chụp hình đặt cọc": safeValue(depositImage),
        "Ảnh chụp đối ứng": safeValue(counterpartImage),
        depositImage: safeValue(depositImage),
        counterpartImage: safeValue(counterpartImage),
      });

      toast.success("Cập nhật hợp đồng thành công!");
      navigate("/hop-dong-da-xuat");
    } catch (err) {
      console.error("Error updating contract:", err);
      toast.error("Lỗi khi cập nhật hợp đồng");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-secondary-600">Đang tải dữ liệu hợp đồng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 bg-gradient-to-br from-slate-100 to-slate-200 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-400 px-4 sm:px-6 py-4 sm:py-5 rounded-t-2xl shadow-lg">
          <div className="flex items-center justify-between relative">
            <button
              onClick={() => navigate("/hop-dong-da-xuat")}
              className="text-white hover:text-gray-200 transition-colors flex items-center gap-2 px-2 sm:px-4 py-2 rounded-lg hover:bg-white/10 z-10"
              aria-label="Quay lại"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Quay lại</span>
            </button>
            <h2 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white absolute left-1/2 transform -translate-x-1/2 text-center px-2 truncate max-w-[calc(100%-8rem)] sm:max-w-none">
              Chỉnh sửa hợp đồng đã xuất
            </h2>
            <div className="w-16 sm:w-24 md:w-32"></div>
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
                {/* Export Date */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Ngày XHD
                  </label>
                  <input
                    type="date"
                    value={(contract.ngayXhd || "").slice(0, 10)}
                    onChange={(e) => handleChange("ngayXhd", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                  />
                </div>

                {/* TVBH */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    TVBH
                  </label>
                  <select
                    value={contract.tvbh || ""}
                    onChange={(e) => handleChange("tvbh", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white"
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

                {/* VSO */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    VSO
                  </label>
                  <input
                    type="text"
                    value={contract.vso || ""}
                    onChange={(e) => handleChange("vso", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                    placeholder="VSO"
                  />
                </div>

                {/* Showroom */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Showroom
                  </label>
                  <select
                    value={contract.showroom || ""}
                    onChange={(e) => handleChange("showroom", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white"
                  >
                    <option value="">Chọn Showroom</option>
                    {getAllBranches().map((branch) => (
                      <option key={branch.id} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                    {/* Show current value if it doesn't match any option (for editing existing contracts) */}
                    {contract.showroom && !getAllBranches().find(b => b.name === contract.showroom) && (
                      <option value={contract.showroom}>
                        {contract.showroom} (giá trị hiện tại)
                      </option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Thông tin khách hàng */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-3 sm:mb-4">
                Thông tin khách hàng
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {/* Customer Type */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Khách hàng là <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={contract.khachHangLa || ""}
                    onChange={(e) => handleChange("khachHangLa", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white"
                  >
                    <option value="">Chọn loại khách hàng</option>
                    <option value="Cá nhân">Cá nhân</option>
                    <option value="Công ty">Công ty</option>
                  </select>
                </div>

                {/* Customer Name */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Tên khách hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={contract.tenKh || ""}
                    onChange={(e) => handleChange("tenKh", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                    placeholder="Tên khách hàng"
                  />
                </div>

                {/* Company fields - shown only when customer type is "Công ty" */}
                {contract.khachHangLa === "Công ty" && (
                  <>
                    {/* Mã số doanh nghiệp */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Mã số doanh nghiệp <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={contract.msdn || ""}
                        onChange={(e) => handleChange("msdn", e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                        placeholder="Mã số doanh nghiệp"
                      />
                    </div>

                    {/* Người đại diện */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Người đại diện <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={contract.daiDien || ""}
                        onChange={(e) => handleChange("daiDien", e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                        placeholder="Người đại diện"
                      />
                    </div>

                    {/* Chức vụ */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Chức vụ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={contract.chucVu || ""}
                        onChange={(e) => handleChange("chucVu", e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                        placeholder="Chức vụ"
                      />
                    </div>

                    {/* Giấy ủy quyền */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Giấy ủy quyền <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={contract.giayUyQuyen || ""}
                        onChange={(e) => handleChange("giayUyQuyen", e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                        placeholder="Số giấy ủy quyền"
                      />
                    </div>

                    {/* Ngày giấy ủy quyền */}
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        Ngày giấy ủy quyền <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={contract.giayUyQuyenNgay || ""}
                        onChange={(e) => handleChange("giayUyQuyenNgay", e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                      />
                    </div>
                  </>
                )}

                {/* Phone */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={contract.soDienThoai || ""}
                    onChange={(e) => handleChange("soDienThoai", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                    placeholder="Số điện thoại"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contract.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                    placeholder="Email"
                  />
                </div>

                {/* Address */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Địa chỉ lấy theo VNeid
                  </label>
                  <input
                    type="text"
                    value={contract.diaChi || ""}
                    onChange={(e) => handleChange("diaChi", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                    placeholder="Địa chỉ lấy theo VNeid"
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
                    onChange={(e) => handleChange("cccd", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
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
                    value={(contract.ngayCap || "").slice(0, 10)}
                    onChange={(e) => handleChange("ngayCap", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                  />
                </div>

                {/* Issue Place */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Nơi cấp
                  </label>
                  <select
                    value={contract.noiCap || ""}
                    onChange={(e) => handleChange("noiCap", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white"
                  >
                    <option value="">Chọn nơi cấp</option>
                    {issuePlaces.map((place) => (
                      <option key={place} value={place}>
                        {place}
                      </option>
                    ))}
                    {/* Show current value if it doesn't match any option (for editing existing contracts) */}
                    {contract.noiCap && !issuePlaces.includes(contract.noiCap) && (
                      <option value={contract.noiCap}>
                        {contract.noiCap} (giá trị hiện tại)
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
                    value={contract.dongXe || ""}
                    onChange={(e) => handleChange("dongXe", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white"
                  >
                    <option value="">Chọn dòng xe</option>
                    {carModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                    {/* Show current value if it doesn't match any option (for editing existing contracts) */}
                    {contract.dongXe && !carModels.includes(contract.dongXe) && (
                      <option value={contract.dongXe}>
                        {contract.dongXe} (giá trị hiện tại)
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
                    value={contract.phienBan || ""}
                    onChange={(e) => handleChange("phienBan", e.target.value)}
                    disabled={!contract.dongXe}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Chọn phiên bản</option>
                    {availableTrims.map((trim) => (
                      <option key={trim} value={trim}>
                        {trim}
                      </option>
                    ))}
                    {/* Show current value if it doesn't match any option (for editing existing contracts) */}
                    {contract.phienBan && !availableTrims.includes(contract.phienBan) && (
                      <option value={contract.phienBan}>
                        {contract.phienBan} (giá trị hiện tại)
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
                    value={contract.ngoaiThat || ""}
                    onChange={(e) => handleChange("ngoaiThat", e.target.value)}
                    disabled={!contract.dongXe || !contract.phienBan}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Chọn màu ngoại thất</option>
                    {availableExteriorColors.map((color) => (
                      <option key={color.code} value={color.code}>
                        {color.name}
                      </option>
                    ))}
                    {/* Show current value if it doesn't match any option (for editing existing contracts) */}
                    {contract.ngoaiThat && !availableExteriorColors.find(c => c.code === contract.ngoaiThat) && (
                      <option value={contract.ngoaiThat}>
                        {mapColorCodeToName(contract.ngoaiThat, true)} (giá trị hiện tại)
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
                    value={contract.noiThat || ""}
                    onChange={(e) => handleChange("noiThat", e.target.value)}
                    disabled={!contract.dongXe || !contract.phienBan}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Chọn màu nội thất</option>
                    {availableInteriorColors.map((color) => (
                      <option key={color.code} value={color.code}>
                        {color.name}
                      </option>
                    ))}
                    {/* Show current value if it doesn't match any option (for editing existing contracts) */}
                    {contract.noiThat && !availableInteriorColors.find(c => c.code === contract.noiThat) && (
                      <option value={contract.noiThat}>
                        {mapColorCodeToName(contract.noiThat, false)} (giá trị hiện tại)
                      </option>
                    )}
                  </select>
                </div>

                {/* Chassis Number */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Số Khung
                  </label>
                  <input
                    type="text"
                    value={contract.soKhung || ""}
                    onChange={(e) => handleChange("soKhung", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                    placeholder="Số khung"
                  />
                </div>

                {/* Engine Number */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Số Máy
                  </label>
                  <input
                    type="text"
                    value={contract.soMay || ""}
                    onChange={(e) => handleChange("soMay", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                    placeholder="Số máy"
                  />
                </div>

                {/* Production Year (Năm sản xuất) */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Năm sản xuất
                  </label>
                  <input
                    type="text"
                    value={contract.namSanXuat || ""}
                    onChange={(e) => handleChange("namSanXuat", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                    placeholder="Ví dụ: 2025"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Thông tin thanh toán */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-3 sm:mb-4">
                Thông tin thanh toán
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {/* List Price */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Giá Niêm Yết
                  </label>
                  <CurrencyInput
                    value={contract.giaNiemYet}
                    onChange={(val) => handleChange("giaNiemYet", val)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                    placeholder="Nhập giá niêm yết"
                  />
                </div>

                {/* Discount Price */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Giá Giảm
                  </label>
                  <CurrencyInput
                    value={contract.giaGiam}
                    onChange={(val) => handleChange("giaGiam", val)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                    placeholder="Nhập giá giảm"
                  />
                </div>

                {/* Contract Price */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Giá Hợp Đồng
                  </label>
                  <CurrencyInput
                    value={contract.giaHopDong}
                    onChange={(val) => handleChange("giaHopDong", val)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                    placeholder="Nhập giá hợp đồng"
                  />
                </div>

                {/* Invoice Price - Giá Xuất Hóa Đơn */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Giá Xuất Hóa Đơn
                    <span className="text-xs text-gray-500 font-normal ml-1">(Giá gửi ngân hàng)</span>
                  </label>
                  <CurrencyInput
                    value={contract.giaXuatHoaDon}
                    onChange={(val) => handleChange("giaXuatHoaDon", val)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                    placeholder="Nhập giá xuất hóa đơn"
                  />
                </div>

                {/* Deposit Amount */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Số tiền cọc
                  </label>
                  <CurrencyInput
                    value={contract.soTienCoc}
                    onChange={(val) => handleChange("soTienCoc", val)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                    placeholder="Nhập số tiền cọc"
                  />
                </div>

                {/* Tiền đối ứng = Giá hợp đồng - Số tiền vay */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Tiền đối ứng
                    <span className="text-xs text-gray-500 font-normal ml-1">(Giá HĐ - Số tiền vay)</span>
                  </label>
                  <CurrencyInput
                    value={contract.tienDoiUng}
                    onChange={(val) => handleChange("tienDoiUng", val)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                    placeholder="Số tiền khách tự trả"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Tình Trạng
                  </label>
                  <select
                    value={contract.tinhTrang || ""}
                    onChange={(e) => handleChange("tinhTrang", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white"
                  >
                    <option value="">Chọn tình trạng</option>
                    <option value="Mới">Mới</option>
                    <option value="Đang làm ngân hàng">Đang làm ngân hàng</option>
                    <option value="Đã làm ngân hàng">Đã làm ngân hàng</option>
                    <option value="Chờ COC">Chờ COC</option>
                    <option value="Đã giải ngân">Đã giải ngân</option>
                    <option value="Đã giao xe">Đã giao xe</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Thanh toán
                  </label>
                  <select
                    value={contract.thanhToan || ""}
                    onChange={(e) => handleChange("thanhToan", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm bg-white"
                  >
                    <option value="">Chọn hình thức thanh toán</option>
                    <option value="trả thẳng">Trả thẳng</option>
                    <option value="trả góp">Trả góp</option>
                  </select>
                </div>

                {/* Loan Amount - Only show when payment is "trả góp" */}
                {contract.thanhToan === "trả góp" && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Số tiền vay
                    </label>
                    <CurrencyInput
                      value={contract.soTienVay}
                      onChange={(val) => handleChange("soTienVay", val)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                      placeholder="Nhập số tiền vay"
                    />
                  </div>
                )}

                {/* Bank */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Ngân hàng
                  </label>
                  <input
                    type="text"
                    value={contract.nganHang || ""}
                    onChange={(e) => handleChange("nganHang", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                    placeholder="Ngân hàng"
                  />
                </div>

                {/* Quà tặng theo xe */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Quà tặng theo xe
                  </label>
                  <input
                    type="text"
                    value={contract.quaTang || ""}
                    onChange={(e) => handleChange("quaTang", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
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
                    onChange={(e) => handleChange("quaTangKhac", e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
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
                    onChange={(val) => handleChange("soTienPhaiThu", val)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-xs sm:text-sm"
                    placeholder="Nhập số tiền phải thu"
                  />
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
              onClick={() => navigate("/hop-dong-da-xuat")}
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-sm sm:text-base"
              aria-label="Hủy"
            >
              <X className="w-4 h-4" />
              <span>Hủy</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const formatDateString = (val) => {
                  if (!val) return "";
                  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) return val;
                  const d = new Date(val);
                  if (isNaN(d)) return val;
                  const pad = (n) => String(n).padStart(2, "0");
                  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
                };
                navigate("/phu-luc-hop-dong", {
                  state: {
                    vso: contract.vso || "",
                    contractNumber: contract.vso || "",
                    firebaseKey: id,
                    showroom: contract.showroom || "",
                    createdAt: contract.ngayXhd,
                    ngayXhd: formatDateString(contract.ngayXhd) || formatDateString(new Date()),
                    customerName: contract.tenKh || "",
                    tenKh: contract.tenKh || "",
                    address: contract.diaChi || "",
                    diaChi: contract.diaChi || "",
                    cccd: contract.cccd || "",
                    issueDate: contract.ngayCap,
                    ngayCap: contract.ngayCap || "",
                    issuePlace: contract.noiCap || "",
                    noiCap: contract.noiCap || "",
                    phone: contract.soDienThoai || "",
                    soDienThoai: contract.soDienThoai || "",
                    email: contract.email || "",
                    quaTang: contract.quaTang || "",
                    soTienPhaiThu: contract.soTienPhaiThu || "",
                    giamGia: contract.giamGia || "",
                  },
                });
              }}
              className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-sm sm:text-base"
              aria-label="In phụ lục hợp đồng"
            >
              <span>Phụ lục hợp đồng</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-secondary-600 text-white font-medium rounded-lg hover:bg-secondary-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base"
              aria-label="Lưu thay đổi"
            >
              <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="modal-box bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[calc(100vh-2rem)] overflow-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-400 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white truncate">
                  Quản lý ảnh
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
                    <label className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg transition-colors text-xs sm:text-sm text-center ${uploadingImage && uploadingImageType === 'deposit'
                      ? 'bg-gray-200 cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:bg-gray-50'
                      }`}>
                      <span className="text-gray-700">
                        {uploadingImage && uploadingImageType === 'deposit'
                          ? 'Đang upload...'
                          : 'Chọn file ảnh'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'deposit')}
                        className="hidden"
                        disabled={uploadingImage && uploadingImageType === 'deposit'}
                      />
                    </label>
                    {depositImage && !(uploadingImage && uploadingImageType === 'deposit') && (
                      <button
                        onClick={() => setDepositImage("")}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm"
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
                          e.target.style.display = 'none';
                          toast.error("Không thể tải ảnh. Vui lòng kiểm tra lại URL hoặc file.");
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
                    <label className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg transition-colors text-xs sm:text-sm text-center ${uploadingImage && uploadingImageType === 'counterpart'
                      ? 'bg-gray-200 cursor-not-allowed opacity-50'
                      : 'cursor-pointer hover:bg-gray-50'
                      }`}>
                      <span className="text-gray-700">
                        {uploadingImage && uploadingImageType === 'counterpart'
                          ? 'Đang upload...'
                          : 'Chọn file ảnh'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'counterpart')}
                        className="hidden"
                        disabled={uploadingImage && uploadingImageType === 'counterpart'}
                      />
                    </label>
                    {counterpartImage && !(uploadingImage && uploadingImageType === 'counterpart') && (
                      <button
                        onClick={() => setCounterpartImage("")}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs sm:text-sm"
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
                          e.target.style.display = 'none';
                          toast.error("Không thể tải ảnh. Vui lòng kiểm tra lại URL hoặc file.");
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-4 border-t border-gray-200 rounded-b-lg">
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
  );
}

