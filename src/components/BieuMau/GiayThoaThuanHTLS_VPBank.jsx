import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import { getBranchByShowroomName, getDefaultBranch } from "../../data/branchData";
import { vndToWords } from "../../utils/vndToWords";
import { formatCurrency, formatDate } from "../../utils/formatting";
import vinfastLogo from "../../assets/vinfast.svg";
import CurrencyInput from "../shared/CurrencyInput";

const GiayThoaThuanHTLS_VPBank = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);

  // Editable fields
  const [ngayKy, setNgayKy] = useState("");
  const [thangKy, setThangKy] = useState("");
  const [namKy, setNamKy] = useState("");

  // Bên Bán
  const [congTy, setCongTy] = useState("");
  const [diaChiTruSo, setDiaChiTruSo] = useState("");
  const [maSoDN, setMaSoDN] = useState("");
  const [taiKhoan, setTaiKhoan] = useState("");
  const [nganHangTK, setNganHangTK] = useState("");
  const [daiDien, setDaiDien] = useState("");
  const [chucVu, setChucVu] = useState("");
  const [giayUyQuyen, setGiayUyQuyen] = useState("");
  const [ngayUyQuyen, setNgayUyQuyen] = useState("");

  // Khách Hàng
  const [ongBaKH, setOngBaKH] = useState("");
  const [diaChiKH, setDiaChiKH] = useState("");
  const [dienThoaiKH, setDienThoaiKH] = useState("");
  const [maSoThueKH, setMaSoThueKH] = useState("");
  const [canCuocKH, setCanCuocKH] = useState("");
  const [ngayCapKH, setNgayCapKH] = useState("");
  const [ngayCapKHRaw, setNgayCapKHRaw] = useState("");
  const [noiCapKH, setNoiCapKH] = useState("");

  // Vợ/Chồng
  const [coVoChong, setCoVoChong] = useState(true);
  const [ongBaVC, setOngBaVC] = useState("");
  const [diaChiVC, setDiaChiVC] = useState("");
  const [dienThoaiVC, setDienThoaiVC] = useState("");
  const [maSoThueVC, setMaSoThueVC] = useState("");
  const [canCuocVC, setCanCuocVC] = useState("");
  const [ngayCapVC, setNgayCapVC] = useState("");
  const [ngayCapVCRaw, setNgayCapVCRaw] = useState("");
  const [noiCapVC, setNoiCapVC] = useState("");

  // Thông tin xe
  const [soHopDong, setSoHopDong] = useState("");
  const [vso, setVso] = useState("");
  const [model, setModel] = useState("LIMO GREEN");
  const [soKhung, setSoKhung] = useState("");
  const [soMay, setSoMay] = useState("");
  const [giaTriXe, setGiaTriXe] = useState("");

  // Thông tin vay
  const [soTienVay, setSoTienVay] = useState(0);
  const [soTienVayBangChu, setSoTienVayBangChu] = useState("");
  const [laiSuatNH, setLaiSuatNH] = useState("8.9");
  const [thoiHanVay, setThoiHanVay] = useState("");
  const [laiSuatKH, setLaiSuatKH] = useState("6.9");
  const [laiSuatSau24T, setLaiSuatSau24T] = useState("3");
  const [tyLeVay, setTyLeVay] = useState("");

  // Ngày bắt đầu và kết thúc chương trình (mặc định 30/07/2025 và 31/12/2025)
  const [ngayBatDauChuongTrinh, setNgayBatDauChuongTrinh] =
    useState("30/07/2025");
  const [ngayBatDauChuongTrinhRaw, setNgayBatDauChuongTrinhRaw] =
    useState("2025-07-30");
  const [ngayKetThucChuongTrinh, setNgayKetThucChuongTrinh] =
    useState("31/12/2025");
  const [ngayKetThucChuongTrinhRaw, setNgayKetThucChuongTrinhRaw] =
    useState("2025-12-31");


  const pad = (num) => String(num).padStart(2, "0");

  // Helper function to format date as dd/mm/yyyy
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  // Helper function to convert dd/mm/yyyy to yyyy-mm-dd
  const convertToDateInputFormat = (dateStr) => {
    if (!dateStr) return "";
    // If already in yyyy-mm-dd format, return as is
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    // If in dd/mm/yyyy format, convert to yyyy-mm-dd
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        const year = parts[2];
        return `${year}-${month}-${day}`;
      }
    }
    // Try to parse as date
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      }
    } catch (e) {
      // If parsing fails, return empty
    }
    return "";
  };

  useEffect(() => {
    const loadData = async () => {
      let showroomName = location.state?.showroom || "";
      let showroomLoadedFromContracts = false;

      // Nếu có firebaseKey, thử lấy showroom từ exportedContracts trước, sau đó mới từ contracts
      if (location.state?.firebaseKey) {
        try {
          const contractId = location.state.firebaseKey;
          
          // Thử load từ exportedContracts trước (dữ liệu mới nhất)
          const exportedContractsRef = ref(database, `exportedContracts/${contractId}`);
          const exportedSnapshot = await get(exportedContractsRef);
          
          if (exportedSnapshot.exists()) {
            const contractData = exportedSnapshot.val();
            console.log("Loaded from exportedContracts:", contractData);
            if (contractData.showroom) {
              showroomName = contractData.showroom;
              showroomLoadedFromContracts = true;
              console.log("Showroom loaded from exportedContracts:", showroomName);

              // Cập nhật branch info ngay khi load được showroom từ exportedContracts
              const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
              setBranch(branchInfo);

              if (branchInfo) {
                setCongTy(branchInfo.name.toUpperCase());
                setDiaChiTruSo(branchInfo.address);
                setMaSoDN(branchInfo.taxCode || "");
                setTaiKhoan(branchInfo.bankAccount || "");
                setNganHangTK(branchInfo.bankName || "VP Bank");
                setDaiDien(branchInfo.representativeName || "Nguyễn Thành Trai");
                setChucVu(branchInfo.position || "Tổng Giám Đốc");
              }
            }
          } else {
            // Nếu không có trong exportedContracts, thử load từ contracts
            const contractsRef = ref(database, `contracts/${contractId}`);
            const snapshot = await get(contractsRef);
            if (snapshot.exists()) {
              const contractData = snapshot.val();
              console.log("Loaded from contracts:", contractData);
              if (contractData.showroom) {
                showroomName = contractData.showroom;
                showroomLoadedFromContracts = true;
                console.log("Showroom loaded from contracts:", showroomName);

                // Cập nhật branch info ngay khi load được showroom từ contracts
                const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
                setBranch(branchInfo);

                if (branchInfo) {
                  setCongTy(branchInfo.name.toUpperCase());
                  setDiaChiTruSo(branchInfo.address);
                  setMaSoDN(branchInfo.taxCode || "");
                  setTaiKhoan(branchInfo.bankAccount || "");
                  setNganHangTK(branchInfo.bankName || "VP Bank");
                  setDaiDien(branchInfo.representativeName || "Nguyễn Thành Trai");
                  setChucVu(branchInfo.position || "Tổng Giám Đốc");
                }
              }
            } else {
              console.log("Contract not found in both exportedContracts and contracts paths");
            }
          }
        } catch (error) {
          console.error("Error loading showroom from database:", error);
        }
      }

      // Set branch info nếu chưa load được từ contracts và có showroom
      if (!showroomLoadedFromContracts && showroomName) {
        const branchInfo = getBranchByShowroomName(showroomName);
        if (branchInfo) {
          setBranch(branchInfo);
          setCongTy(branchInfo.name.toUpperCase());
          setDiaChiTruSo(branchInfo.address);
          setMaSoDN(branchInfo.taxCode || "");
          setTaiKhoan(branchInfo.bankAccount || "");
          setNganHangTK(branchInfo.bankName || "VP Bank");
          setDaiDien(branchInfo.representativeName || "Nguyễn Thành Trai");
          setChucVu(branchInfo.position || "Tổng Giám Đốc");
        }
      }

      if (location.state?.firebaseKey) {
        try {
          const contractRef = ref(
            database,
            `exportedContracts/${location.state.firebaseKey}`
          );
          const snapshot = await get(contractRef);
          if (snapshot.exists()) {
            const contractData = snapshot.val();
            console.log("Loaded from exportedContracts:", contractData);
            // Chỉ override showroom nếu chưa có từ contracts
            if (contractData.showroom && !showroomLoadedFromContracts) {
              showroomName = contractData.showroom;
              console.log(
                "Showroom loaded from exportedContracts:",
                showroomName
              );

              // Cập nhật thông tin công ty và địa chỉ dựa trên showroom
              const branchInfo = getBranchByShowroomName(showroomName);
              if (branchInfo) {
                setCongTy(
                  `${branchInfo.name.toUpperCase()}`
                );
                setDiaChiTruSo(branchInfo.address);
              }
            }

            // Lấy Model từ database
            if (
              contractData.dongXe ||
              contractData.model ||
              contractData["Dòng xe"]
            ) {
              setModel(
                contractData.dongXe ||
                contractData.model ||
                contractData["Dòng xe"] ||
                ""
              );
            }

            // Lấy Số Khung từ database
            if (
              contractData.soKhung ||
              contractData["Số Khung"] ||
              contractData.chassisNumber
            ) {
              setSoKhung(
                contractData.soKhung ||
                contractData["Số Khung"] ||
                contractData.chassisNumber ||
                ""
              );
            }

            // Lấy Số Máy từ database
            if (
              contractData.soMay ||
              contractData["Số Máy"] ||
              contractData.engineNumber
            ) {
              setSoMay(
                contractData.soMay ||
                contractData["Số Máy"] ||
                contractData.engineNumber ||
                ""
              );
            }

            // Lấy Giá trị xe từ database
            if (
              contractData.giaHD ||
              contractData.contractPrice ||
              contractData["Giá HD"] ||
              contractData["Giá Hợp Đồng"]
            ) {
              const price =
                contractData.giaHD ||
                contractData.contractPrice ||
                contractData["Giá HD"] ||
                contractData["Giá Hợp Đồng"] ||
                "";
              if (price) {
                setGiaTriXe(formatCurrency(price.toString()));
              }
            }

            // Lấy VSO từ database
            if (contractData.vso || contractData.VSO) {
              setVso(contractData.vso || contractData.VSO || "");
            }

            // Lấy thông tin khách hàng từ database
            // Tên khách hàng
            if (contractData.customerName || contractData["Tên KH"] || contractData["Tên Kh"]) {
              setOngBaKH(
                contractData.customerName || contractData["Tên KH"] || contractData["Tên Kh"] || ""
              );
            }

            // Địa chỉ khách hàng
            if (
              contractData.address ||
              contractData["Địa chỉ"] ||
              contractData["Địa Chỉ"]
            ) {
              setDiaChiKH(
                contractData.address ||
                contractData["Địa chỉ"] ||
                contractData["Địa Chỉ"] ||
                ""
              );
            }

            // Điện thoại khách hàng
            if (
              contractData.phone ||
              contractData["Số Điện Thoại"] ||
              contractData["Số điện thoại"]
            ) {
              setDienThoaiKH(
                contractData.phone ||
                contractData["Số Điện Thoại"] ||
                contractData["Số điện thoại"] ||
                ""
              );
            }

            // Mã số thuế (nếu có)
            if (
              contractData.maSoThue ||
              contractData["Mã số thuế"] ||
              contractData["Mã Số Thuế"]
            ) {
              setMaSoThueKH(
                contractData.maSoThue ||
                contractData["Mã số thuế"] ||
                contractData["Mã Số Thuế"] ||
                ""
              );
            }

            // Căn cước/CCCD
            if (
              contractData.cccd ||
              contractData.CCCD ||
              contractData["Căn cước"] ||
              contractData.customerCCCD
            ) {
              setCanCuocKH(
                contractData.cccd ||
                contractData.CCCD ||
                contractData["Căn cước"] ||
                contractData.customerCCCD ||
                ""
              );
            }

            // Ngày cấp - format dd/mm/yyyy
            if (
              contractData.ngayCap ||
              contractData.issueDate ||
              contractData["Ngày Cấp"] ||
              contractData["Ngày cấp"]
            ) {
              const ngayCap =
                contractData.ngayCap ||
                contractData.issueDate ||
                contractData["Ngày Cấp"] ||
                contractData["Ngày cấp"] ||
                "";
              const formattedDate = formatDate(ngayCap);
              setNgayCapKH(formattedDate);
              setNgayCapKHRaw(convertToDateInputFormat(ngayCap));
            }

            // Nơi cấp
            if (
              contractData.noiCap ||
              contractData.issuePlace ||
              contractData["Nơi Cấp"] ||
              contractData["Nơi cấp"]
            ) {
              setNoiCapKH(
                contractData.noiCap ||
                contractData.issuePlace ||
                contractData["Nơi Cấp"] ||
                contractData["Nơi cấp"] ||
                ""
              );
            }

            // Số tiền vay (nếu có)
            const loanAmount =
              contractData.soTienVay ||
              contractData["Số Tiền Vay"] ||
              contractData.loanAmount ||
              "";
            if (loanAmount) {
              const loanValue =
                typeof loanAmount === "string"
                  ? loanAmount.replace(/\D/g, "")
                  : String(loanAmount);
              setSoTienVay(loanValue);
              // Tự động chuyển sang chữ nếu chưa có
              if (
                !contractData.soTienVayBangChu &&
                !contractData["Số Tiền Vay Bằng Chữ"]
              ) {
                setSoTienVayBangChu(vndToWords(loanValue));
              } else {
                setSoTienVayBangChu(
                  contractData.soTienVayBangChu ||
                  contractData["Số Tiền Vay Bằng Chữ"] ||
                  ""
                );
              }
            }
          }
        } catch (error) {
          console.error("Error loading contract data:", error);
        }
      }

      // Cập nhật thông tin công ty nếu showroom đã được load từ database
      if (showroomName && showroomLoadedFromContracts) {
        const branchInfo = getBranchByShowroomName(showroomName);
        if (branchInfo) {
          setCongTy(
            `${branchInfo.name.toUpperCase()}`
          );
          setDiaChiTruSo(branchInfo.address);
        }
      }

      // Set default date
      const today = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      setNgayKy(pad(today.getDate()));
      setThangKy(pad(today.getMonth() + 1));
      setNamKy(today.getFullYear().toString());

      if (location.state) {
        const stateData = location.state;
        setData(stateData);

        // Nếu có showroom từ location.state và chưa load từ contracts, cập nhật thông tin công ty
        if (stateData.showroom && !showroomLoadedFromContracts) {
          const branchInfo = getBranchByShowroomName(stateData.showroom);
          if (branchInfo) {
            setCongTy(
              `${branchInfo.name.toUpperCase()}`
            );
            setDiaChiTruSo(branchInfo.address);
          }
        }

        // Auto-fill từ location.state (chỉ khi không có firebaseKey hoặc muốn override)
        // Nếu có firebaseKey, data đã được load từ database, chỉ override khi cần
        if (stateData.customerName) setOngBaKH(stateData.customerName);
        if (stateData.customerAddress) setDiaChiKH(stateData.customerAddress);
        if (stateData.customerPhone) setDienThoaiKH(stateData.customerPhone);
        if (stateData.customerCCCD) setCanCuocKH(stateData.customerCCCD);
        if (stateData.contractNumber) setSoHopDong(stateData.contractNumber);
        if (stateData.vso || stateData.VSO)
          setVso(stateData.vso || stateData.VSO || "");
        if (stateData.hieuxe) setModel(stateData.hieuxe);
        if (stateData.soKhung) setSoKhung(stateData.soKhung);
        if (stateData.soMay) setSoMay(stateData.soMay);
        if (stateData.totalPrice)
          setGiaTriXe(formatCurrency(stateData.totalPrice.toString()));

        // Số tiền vay (nếu có)
        const loanAmount =
          stateData.soTienVay ||
          stateData["Số Tiền Vay"] ||
          stateData.loanAmount ||
          "";
        if (loanAmount) {
          const loanValue =
            typeof loanAmount === "string"
              ? loanAmount.replace(/\D/g, "")
              : String(loanAmount);
          setSoTienVay(loanValue);
          // Tự động chuyển sang chữ nếu chưa có
          if (
            !stateData.soTienVayBangChu &&
            !stateData["Số Tiền Vay Bằng Chữ"]
          ) {
            setSoTienVayBangChu(vndToWords(loanValue));
          } else {
            setSoTienVayBangChu(
              stateData.soTienVayBangChu ||
              stateData["Số Tiền Vay Bằng Chữ"] ||
              ""
            );
          }
        }
      } else {
        setData({
          customerName: "",
          customerAddress: "",
          customerPhone: "",
          customerCCCD: "",
          contractNumber: "",
          hieuxe: "",
          soKhung: "",
          soMay: "",
          totalPrice: "",
        });
      }
      setLoading(false);
    };

    loadData();
  }, [location.state]);

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        style={{ fontFamily: "Times New Roman" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 p-8"
      style={{ fontFamily: "Times New Roman" }}
    >
      <div className="max-w-4xl mx-auto print:max-w-4xl print:mx-auto">
        <div
          ref={printableRef}
          className="flex-1 bg-white p-8 print:pt-0 flex flex-col"
          id="printable-content"
        >
          {/* Title */}
          <div className="text-center mb-6">
            <div className="w-32 mx-auto mb-4">
              <img src={vinfastLogo} alt="VinFast Logo" className="w-full" />
            </div>
            <h1 className="text-xl font-bold uppercase mb-4">
              THỎA THUẬN HỖ TRỢ LÃI VAY
            </h1>
            <p className="text-sm mb-4">
              Thỏa thuận hỗ trợ lãi vay ("<strong>Thỏa Thuận</strong>") này được
              ký ngày{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={ngayKy}
                  onChange={(e) => setNgayKy(e.target.value)}
                  className="border-b border-gray-400 px-1 w-12 text-center focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{ngayKy}</span> tháng{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={thangKy}
                  onChange={(e) => setThangKy(e.target.value)}
                  className="border-b border-gray-400 px-1 w-12 text-center focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{thangKy}</span> năm{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={namKy}
                  onChange={(e) => setNamKy(e.target.value)}
                  className="border-b border-gray-400 px-1 w-16 text-center focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{namKy}</span>, bởi và giữa:
            </p>
          </div>

          {/* Content */}
          <div className="text-sm space-y-4">
            {/* Bên Bán */}
            <div>
              {branch ? (
                <p className="font-bold mb-2">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={congTy}
                      onChange={(e) => setCongTy(e.target.value)}
                      className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline underline">{congTy}</span>
                </p>
              ) : (
                <p className="font-bold mb-2 text-gray-500">
                  [Chưa chọn showroom]
                </p>
              )}
              {branch && (
                <p className="mb-1">
                  Địa chỉ trụ sở chính:{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={diaChiTruSo}
                      onChange={(e) => setDiaChiTruSo(e.target.value)}
                      className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline font-bold">
                    {diaChiTruSo}
                  </span>
                </p>
              )}
              {branch && (
                <>
                  <p className="mb-1">
                    Mã số doanh nghiệp:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={maSoDN}
                        onChange={(e) => setMaSoDN(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">{maSoDN}</span>
                  </p>
                  <p className="mb-1">
                    Tài khoản:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={taiKhoan}
                        onChange={(e) => setTaiKhoan(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">
                      {taiKhoan}
                    </span>{" "}
                    tại Ngân hàng{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={nganHangTK}
                        onChange={(e) => setNganHangTK(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">
                      {nganHangTK}
                    </span>
                  </p>
                  <p className="mb-1">
                    Đại diện:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={daiDien}
                        onChange={(e) => setDaiDien(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{daiDien}</span>
                    {"    "}Chức vụ:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={chucVu}
                        onChange={(e) => setChucVu(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{chucVu}</span>
                  </p>
                  <p className="mb-2">
                    (Theo Giấy uỷ quyền số{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={giayUyQuyen}
                        onChange={(e) => setGiayUyQuyen(e.target.value)}
                        className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">
                      {giayUyQuyen}
                    </span>{" "}
                    ngày{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={ngayUyQuyen}
                        onChange={(e) => setNgayUyQuyen(e.target.value)}
                        className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">
                      {ngayUyQuyen}
                    </span>
                    )
                  </p>
                  <p className="mb-2 font-bold">("Bên bán")</p>
                </>
              )}
              <p className="font-bold mb-2">VÀ</p>
            </div>

            {/* Khách Hàng */}
            <div>
              <p className="mb-2">
                <span>Ông/Bà: </span>
                <span className="print:hidden">
                  <input
                    type="text"
                    value={ongBaKH}
                    onChange={(e) => setOngBaKH(e.target.value)}
                    className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{ongBaKH}</span>
              </p>
              <p className="mb-1">
                Địa chỉ:{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={diaChiKH}
                    onChange={(e) => setDiaChiKH(e.target.value)}
                    className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline font-bold">
                  {diaChiKH}
                </span>
              </p>
              <p className="mb-1">
                Điện thoại:{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={dienThoaiKH}
                    onChange={(e) => setDienThoaiKH(e.target.value)}
                    className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline font-bold">
                  {dienThoaiKH}
                </span>
              </p>
              <p className="mb-1">
                Mã số thuế:{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={maSoThueKH}
                    onChange={(e) => setMaSoThueKH(e.target.value)}
                    className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline font-bold">
                  {maSoThueKH}
                </span>
              </p>
              <p className="mb-3">
                Căn cước/CCCD/Hộ chiếu: Số{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={canCuocKH}
                    onChange={(e) => setCanCuocKH(e.target.value)}
                    className="border-b border-gray-400 px-1 w-40 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline font-bold">
                  {canCuocKH}
                </span>{" "}
                cấp ngày{" "}
                <span className="print:hidden">
                  <input
                    type="date"
                    value={ngayCapKHRaw}
                    onChange={(e) => {
                      setNgayCapKHRaw(e.target.value);
                      if (e.target.value) {
                        setNgayCapKH(formatDateForDisplay(e.target.value));
                      } else {
                        setNgayCapKH("");
                      }
                    }}
                    className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{ngayCapKH}</span> bởi{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={noiCapKH}
                    onChange={(e) => setNoiCapKH(e.target.value)}
                    className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{noiCapKH}</span>
              </p>

              {/* Vợ/Chồng */}
              <div className="print:hidden mb-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={coVoChong}
                    onChange={(e) => setCoVoChong(e.target.checked)}
                    className="mr-2"
                  />
                  Có vợ/chồng
                </label>
              </div>

              {coVoChong && (
                <>
                  <p className="italic mb-2 font-bold">Có vợ/chồng là</p>
                  <p className="mb-2">
                    <span>Ông/Bà: </span>
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={ongBaVC}
                        onChange={(e) => setOngBaVC(e.target.value)}
                        className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{ongBaVC}</span>
                  </p>
                  <p className="mb-1">
                    Địa chỉ:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={diaChiVC}
                        onChange={(e) => setDiaChiVC(e.target.value)}
                        className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">
                      {diaChiVC}
                    </span>
                  </p>
                  <p className="mb-1">
                    Điện thoại:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={dienThoaiVC}
                        onChange={(e) => setDienThoaiVC(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">
                      {dienThoaiVC}
                    </span>
                  </p>
                  <p className="mb-1">
                    Mã số thuế:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={maSoThueVC}
                        onChange={(e) => setMaSoThueVC(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">
                      {maSoThueVC}
                    </span>
                  </p>
                  <p className="mb-3">
                    Căn cước/CCCD/Hộ chiếu: Số{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={canCuocVC}
                        onChange={(e) => setCanCuocVC(e.target.value)}
                        className="border-b border-gray-400 px-1 w-40 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">
                      {canCuocVC}
                    </span>{" "}
                    cấp ngày{" "}
                    <span className="print:hidden">
                      <input
                        type="date"
                        value={ngayCapVCRaw}
                        onChange={(e) => {
                          setNgayCapVCRaw(e.target.value);
                          if (e.target.value) {
                            setNgayCapVC(formatDateForDisplay(e.target.value));
                          } else {
                            setNgayCapVC("");
                          }
                        }}
                        className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{ngayCapVC}</span> bởi{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={noiCapVC}
                        onChange={(e) => setNoiCapVC(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{noiCapVC}</span>
                  </p>
                </>
              )}

              <p className="mb-2 font-bold">("Khách Hàng")</p>
            </div>

            <p className="text-left leading-relaxed">
              <strong>Bên bán</strong> và <strong>Khách Hàng</strong> sau đây
              được gọi riêng là <strong>"Bên"</strong> và gọi chung là{" "}
              <strong>"Các Bên"</strong>
            </p>

            {/* XÉT RẰNG */}
            <div>
              <p className="font-bold mb-4">XÉT RẰNG:</p>

              <div className="space-y-3">
                <p className="text-left leading-relaxed">
                  1. Khách Hàng là Khách hàng cá nhân vay mua xe ô tô điện
                  VinFast theo Chương trình Chuyển đổi Xanh và/hoặc là (ii)
                  vợ/chồng của Khách hàng đã ký Hợp đồng mua bán xe ô tô số{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={vso || soHopDong}
                      onChange={(e) => setVso(e.target.value)}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline underline">
                    {vso || soHopDong}
                  </span>{" "}
                  với Bên bán (sau đây gọi chung là "
                  <strong>Hợp Đồng Mua Bán Xe</strong>") với thông tin về xe như
                  sau:
                </p>
                <div className="ml-6">
                  <p>
                    - Model:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{model}</span>
                  </p>
                  <p>
                    - Số Khung:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={soKhung}
                        onChange={(e) => setSoKhung(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline underline">
                      {soKhung}
                    </span>
                  </p>
                  <p>
                    - Số Máy:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={soMay}
                        onChange={(e) => setSoMay(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline underline">
                      {soMay}
                    </span>
                  </p>
                  <p>
                    - Giá trị xe mua (đã bao gồm ưu đãi/giảm giá):{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={giaTriXe}
                        onChange={(e) =>
                          setGiaTriXe(formatCurrency(e.target.value))
                        }
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline underline">
                      {giaTriXe}
                    </span>
                  </p>
                </div>

                <p className="text-left leading-relaxed">
                  2. Khách Hàng thuộc trường hợp được áp dụng chính sách hỗ trợ
                  một khoản tiền tương đương một phần khoản lãi vay của khoản
                  vay mua xe tại Ngân hàng Thương Mại Cổ Phần Việt Nam Thịnh
                  Vượng (sau đây gọi là "<strong>Ngân Hàng</strong>") theo chính
                  sách hỗ trợ lãi vay của VinFast được đại diện thực hiện bởi
                  Bên bán ("<strong>Chính sách Hỗ trợ lãi vay</strong>") áp dụng
                  cho (các) Khách hàng đặt cọc mua xe/xuất hóa đơn từ ngày{" "}
                  <span className="print:hidden">
                    <input
                      type="date"
                      value={ngayBatDauChuongTrinhRaw}
                      onChange={(e) => {
                        setNgayBatDauChuongTrinhRaw(e.target.value);
                        if (e.target.value) {
                          setNgayBatDauChuongTrinh(
                            formatDateForDisplay(e.target.value)
                          );
                        } else {
                          setNgayBatDauChuongTrinh("");
                        }
                      }}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">
                    {ngayBatDauChuongTrinh}
                  </span>{" "}
                  đến hết ngày{" "}
                  <span className="print:hidden">
                    <input
                      type="date"
                      value={ngayKetThucChuongTrinhRaw}
                      onChange={(e) => {
                        setNgayKetThucChuongTrinhRaw(e.target.value);
                        if (e.target.value) {
                          setNgayKetThucChuongTrinh(
                            formatDateForDisplay(e.target.value)
                          );
                        } else {
                          setNgayKetThucChuongTrinh("");
                        }
                      }}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">
                    {ngayKetThucChuongTrinh}
                  </span>
                  .
                </p>

                <p className="text-left leading-relaxed">
                  3. Khách Hàng và Ngân Hàng đã hoặc sẽ ký kết một hợp đồng cho
                  vay và hợp đồng thế chấp (sau đây gọi chung là "
                  <strong>Hợp Đồng Tín Dụng</strong>"). Theo đó, Ngân Hàng cho
                  Khách Hàng vay một khoản tiền để thanh toán tiền mua xe ô tô
                  VinFast theo Hợp Đồng Mua Bán Xe.
                </p>

                <p className="text-left leading-relaxed">
                  4. Bên bán được VinFast Trading ủy quyền giao kết Thỏa Thuận
                  này với Khách Hàng để triển khai Chính sách Hỗ trợ lãi vay.
                </p>
              </div>
            </div>

            <p className="text-left leading-relaxed mt-4">
              Do vậy, để thực hiện Chính sách Hỗ trợ lãi vay nêu trên, Các Bên
              thống nhất ký kết Thỏa Thuận này với những nội dung như sau:
            </p>

            {/* ĐIỀU 1 */}
            <div className="mt-6">
              <p className="font-bold mb-3">
                Điều 1. Thỏa thuận về việc Hỗ Trợ Lãi Vay
              </p>

              <div className="space-y-3">
                <p className="text-left leading-relaxed">
                  1.1. Các Bên tại đây đồng ý rằng, khoản lãi vay mà VinFast sẽ
                  hỗ trợ trả thay Khách Hàng cho Ngân Hàng thông qua VinFast
                  Trading đối với mỗi Hợp Đồng Tín Dụng (sau đây là "
                  <strong>Khoản Hỗ Trợ Lãi Vay</strong>") được tính như sau:
                </p>
                <p className="text-center my-3">
                  Khoản Hỗ Trợ Lãi Vay tháng T (1) ={" "}
                  <span className="underline">
                    Dự nợ gốc (2) × Lãi suất hỗ trợ (3) × số ngày vay thực tế trong
                    tháng T (1)/365
                  </span>
                </p>
                <p className="ml-6">Trong đó:</p>
                <p className="ml-6 italic">
                  (1) Tháng T: tháng kỳ tính toán, nằm trong thời gian triển
                  khai chương trình hỗ trợ của VinFast
                </p>
                <p className="ml-6 italic">
                  (2) Dự nợ gốc: nguyên tắc tính theo dư nợ giảm dần; là số dư
                  nợ gốc Khách Hàng phải trả tại tháng T (T là tháng giải ngân);
                  tháng đầu tiên bằng số tiền gốc Khách Hàng được giải ngân
                </p>
                <p className="ml-6 italic">
                  (3) Lãi suất hỗ trợ: là mức lãi suất trả thay được VinFast
                  đồng ý trả thay cho Khách Hàng
                </p>

                <p className="mt-4">1.2. Chính sách Hỗ trợ lãi vay:</p>
                <div className="ml-6 space-y-2">
                  <p>
                    a) Số tiền Khách Hàng vay Ngân Hàng để thanh toán:{" "}
                    <span className="print:hidden">
                      <CurrencyInput
                        value={soTienVay}
                        onChange={(val) => {
                          setSoTienVay(val);
                          if (val && val > 0) {
                            setSoTienVayBangChu(vndToWords(val));
                          } else {
                            setSoTienVayBangChu("");
                          }
                        }}
                        className="border-b border-gray-400 font-bold px-1 w-40 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">
                      {formatCurrency(soTienVay) || "______"}
                    </span>{" "}
                    VNĐ (
                    <em>
                      Bằng chữ:{" "}
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={soTienVayBangChu}
                          onChange={(e) => setSoTienVayBangChu(e.target.value)}
                          className="border-b border-gray-400 px-1 w-64 focus:outline-none font-bold italic focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline font-bold">
                        {soTienVayBangChu || "______"}
                      </span>
                    </em>
                    ) tương ứng với tỷ lệ vay Ngân Hàng:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={tyLeVay}
                        onChange={(e) => setTyLeVay(e.target.value)}
                        className="border-b border-gray-400 px-1 w-12 text-center focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{tyLeVay}</span>% giá trị xe
                  </p>
                  <p>
                    b) Ngân Hàng vay: Ngân hàng TMCP Việt Nam Thịnh Vượng ("
                    <strong>Ngân Hàng</strong>")
                  </p>
                  <p>
                    c) Lãi suất Ngân hàng áp dụng:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={laiSuatNH}
                        onChange={(e) => setLaiSuatNH(e.target.value)}
                        className="border-b border-gray-400 px-1 w-16 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{laiSuatNH}</span>
                    %/năm, cố định trong 24 tháng (đã bao gồm mức lãi suất hỗ
                    trợ của Ngân Hàng so với Khách hàng thông thường).
                  </p>
                  <p>
                    d) Lãi suất sau thời gian cố định: Lãi suất cơ sở + Biên độ
                    3%/năm. Chi tiết theo ghi nhận tại Hợp Đồng Tín Dụng.
                  </p>
                  <p>
                    e) Thời hạn vay:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={thoiHanVay}
                        onChange={(e) => setThoiHanVay(e.target.value)}
                        className="border-b border-gray-400 px-1 w-20 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline underline">
                      {thoiHanVay}
                    </span>{" "}
                    tháng;
                  </p>
                  <p className="text-left leading-relaxed">
                    f) VinFast sẽ hỗ trợ trả thay cho Khách Hàng một khoản tiền
                    lãi ("<strong>Khoản Hỗ Trợ Lãi Vay</strong>") trong suốt
                    thời gian vay (tối đa bằng 96 tháng) nhưng không quá 36
                    tháng ("<strong>Thời Hạn Hỗ Trợ Lãi Vay</strong>").
                  </p>
                  <p className="mt-2">
                    Lãi suất thực tế Khách Hàng phải chi trả khi được VinFast hỗ
                    trợ trả thay đúng hạn như sau:
                  </p>
                  <div className="ml-6">
                    <p>
                      - Lãi suất cho vay trong hạn trong 24 tháng đầu tiên:{" "}
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={laiSuatKH}
                          onChange={(e) => setLaiSuatKH(e.target.value)}
                          className="border-b border-gray-400 px-1 w-16 focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{laiSuatKH}</span>
                      %/năm.
                    </p>
                    <p>
                      - Lãi suất cho vay trong hạn trong 12 tháng tiếp theo: Là
                      phần chênh lệch giữa mức lãi suất cho vay trong hạn Khách
                      hàng phải trả theo Hợp Đồng Tín Dụng trừ (-) 2%/năm.
                    </p>
                    <p>
                      - Lãi suất cho vay trong hạn trong thời gian vay còn lại:
                      Lãi suất cơ sở + Biên độ 3%/năm.
                    </p>
                  </div>
                </div>

                <p className="text-left leading-relaxed mt-4">
                  1.3. Để tránh hiểu nhầm Các Bên thống nhất rằng: Trong mọi
                  trường hợp VinFast, VinFast Trading không chịu trách nhiệm đối
                  với bất kỳ mức lãi nào ngoài mức lãi quy định trên đây vì lý
                  do Khách Hàng không tuân thủ các quy định của Ngân Hàng hay vì
                  bất kỳ lý do gì không phải do lỗi của VinFast, VinFast
                  Trading. Khách Hàng chịu trách nhiệm thanh toán với Ngân Hàng
                  toàn bộ các khoản lãi và chi phí phát sinh trên mức hỗ trợ lãi
                  vay của VinFast quy định ở trên bao gồm các khoản phí trả nợ
                  trước hạn; các khoản lãi quá hạn, lãi chậm trả lãi; lãi tăng
                  lên do Khách Hàng vi phạm nghĩa vụ trả nợ hoặc vi phạm nghĩa
                  vụ khác; các khoản tiền hoàn trả ưu đãi do trả nợ trước hạn;
                  tiền bồi thường vi phạm Hợp Đồng Tín Dụng,.... VinFast/VinFast
                  Trading không có trách nhiệm thông báo, làm rõ, nhắc nợ hay
                  thanh toán thay các khoản tiền này cho Khách Hàng.
                </p>

                <p className="text-left leading-relaxed mt-4">
                  1.4. Thời Hạn Hỗ Trợ Lãi Vay sẽ tự động chấm dứt trước hạn
                  trong trường hợp (i) Hợp Đồng Tín Dụng chấm dứt trước khi hết
                  Thời Hạn Hỗ Trợ Lãi Vay vì bất cứ lý do gì hoặc (ii) theo thỏa
                  thuận về việc chấm dứt Thỏa Thuận Hỗ Trợ Lãi Vay giữa Khách
                  Hàng và VinFast/VinFast Trading. Hết Thời Hạn Hỗ Trợ Lãi Vay
                  hoặc khi Thời Hạn Hỗ Trợ Lãi Vay chấm dứt trước hạn, Khách
                  Hàng có nghĩa vụ tiếp tục thực hiện trả nợ lãi cho Ngân Hàng
                  theo đúng quy định tại Hợp Đồng Tín Dụng và quy định của Ngân
                  Hàng.
                </p>

                <p className="text-left leading-relaxed mt-4">
                  1.5. Không phụ thuộc vào các thỏa thuận nêu trên, Các Bên đồng
                  ý rằng, thỏa thuận trả thay lãi vay theo Thỏa Thuận này là
                  thỏa thuận riêng giữa các Bên (bao gồm cả VinFast, VinFast
                  Trading), không ràng buộc, liên quan đến Ngân Hàng. Ngân Hàng
                  chỉ tham gia với vai trò hỗ trợ VinFast, VinFast Trading
                  chuyển số tiền lãi được VinFast/VinFast Trading hỗ trợ trả
                  thay cho Khách hàng để Khách Hàng trả nợ lãi. Do đó, trường
                  hợp VinFast/VinFast Trading không thực hiện/thực hiện không
                  đầy đủ việc hỗ trợ lãi vay đã thỏa thuận với Khách Hàng, Khách
                  Hàng vẫn có nghĩa vụ thanh toán đầy đủ các khoản tiền lãi theo
                  đúng thỏa thuận với Ngân Hàng tại Hợp Đồng Tín Dụng. Trường
                  hợp VinFast/VinFast Trading vi phạm nội dung tại Thỏa Thuận
                  này dẫn đến khoản tiền lãi của Khách Hàng bị chậm thanh toán,
                  Ngân Hàng được quyền xử lý, quản lý và phân loại nợ đối với
                  khoản vay của Khách Hàng phù hợp với quy định có liên quan của
                  pháp luật và thỏa thuận giữa Ngân Hàng và Khách Hàng tại Hợp
                  Đồng Tín Dụng.
                </p>

                <p className="text-left leading-relaxed mt-4">
                  1.6. Khách Hàng đồng ý cho phép Ngân Hàng, VinFast, VinFast
                  Trading, Bên bán được cung cấp các thông tin cá nhân, thông
                  tin liên quan đến xe ô tô, khoản vay được VinFast, VinFast
                  Trading cam kết trả thay lãi vay và các thông tin khác của
                  Khách Hàng tại Ngân Hàng hoặc tại VinFast, VinFast Trading,
                  Bên bán cho bên còn lại theo yêu cầu của bên còn lại với thời
                  gian và số lượng cung cấp không hạn chế. Việc sử dụng thông
                  tin sau khi được Ngân Hàng, VinFast, VinFast Trading, Bên bán
                  cung cấp, thực hiện theo quyết định của Ngân Hàng, VinFast,
                  VinFast Trading, Bên bán.
                </p>
              </div>
            </div>

            {/* ĐIỀU 2 */}
            <div className="mt-6">
              <p className="font-bold mb-3">
                Điều 2. Quyền và nghĩa vụ của các Bên
              </p>

              <div className="space-y-4">
                <div>
                  <p className="font-bold mb-2">
                    2.1. Quyền và nghĩa vụ của VinFast Trading:
                  </p>
                  <div className="ml-6 space-y-2">
                    <p className="text-left leading-relaxed">
                      a) Thực hiện kiểm tra, đối chiếu và xác nhận với Ngân Hàng
                      các Khoản Hỗ Trợ Lãi Vay hỗ trợ cho Khách Hàng theo thỏa
                      thuận giữa Ngân Hàng, VinFast và VinFast Trading tại Thỏa
                      Thuận Hợp Tác;
                    </p>
                    <p className="text-left leading-relaxed">
                      b) Thực hiện việc hỗ trợ Khoản Hỗ Trợ Lãi Vay của Khách
                      Hàng theo Chính sách Hỗ trợ lãi vay theo Thỏa Thuận này;
                    </p>
                    <p className="text-left leading-relaxed">
                      c) Không chịu trách nhiệm đối với các mâu thuẫn, tranh
                      chấp, khiếu kiện hay khiếu nại nào liên quan đến và/hoặc
                      phát sinh giữa Ngân Hàng, Khách Hàng và các tổ chức, cá
                      nhân khác trong quá trình thực hiện Hợp Đồng Tín Dụng và
                      các thỏa thuận liên quan đến Hợp Đồng Tín Dụng mà không
                      phải do lỗi từ VinFast Trading.
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-bold mb-2">
                    2.2. Quyền và nghĩa vụ của Khách Hàng:
                  </p>
                  <div className="ml-6 space-y-2">
                    <p className="text-left leading-relaxed">
                      a) Được VinFast (thông qua VinFast Trading) thực hiện việc
                      hỗ trợ Khoản Hỗ Trợ Lãi Vay và áp dụng Chính sách Hỗ trợ
                      lãi vay theo quy định của Thỏa Thuận này.
                    </p>
                    <p className="text-left leading-relaxed">
                      b) Tự chi trả, thanh toán nợ gốc, phí trả nợ trước hạn và
                      bất kỳ khoản lãi, lãi quá hạn nào phát sinh ngoài phạm vi
                      Khoản Hỗ Trợ Lãi Vay, Thời Hạn Hỗ Trợ Lãi Vay và Chính
                      sách Hỗ trợ lãi vay.
                    </p>
                    <p className="text-left leading-relaxed">
                      c) Trong Thời Hạn Hỗ Trợ Lãi Vay, trường hợp
                      VinFast/VinFast Trading chậm/không thanh toán Khoản Hỗ Trợ
                      Lãi Vay đến hạn cho Ngân Hàng, và việc VinFast/VinFast
                      Trading chậm/không thanh toán Khoản Hỗ Trợ Lãi Vay không
                      phát sinh từ việc Khách Hàng vi phạm các cam kết với
                      VinFast/VinFast Trading, Khách Hàng có nghĩa vụ thanh toán
                      cho Ngân Hàng để đảm bảo việc thanh toán cho Ngân Hàng
                      đúng hạn. Khi đó, VinFast/VinFast Trading sẽ hoàn trả đầy
                      đủ số tiền Khách Hàng đã thanh toán sau khi Khách Hàng
                      cung cấp chứng từ hợp lệ theo yêu cầu của VinFast/VinFast
                      Trading. Việc hoàn trả được thực hiện trong thời hạn 15
                      ngày làm việc kể từ ngày VinFast/VinFast Trading hoàn tất
                      việc xác minh. Khách Hàng cam kết miễn trừ cho VinFast,
                      VinFast Trading mọi trách nhiệm, nghĩa vụ liên quan đến
                      bất kỳ tranh chấp, mâu thuẫn, khiếu kiện, hay khiếu nại
                      nào phát sinh từ, hoặc liên quan đến Hợp Đồng Tín Dụng,
                      Hợp đồng thế chấp ký giữa Khách Hàng và Ngân Hàng, bên
                      liên quan (nếu có).
                    </p>
                    <p className="text-left leading-relaxed">
                      d) Khách Hàng không được VinFast/VinFast Trading hỗ trợ
                      Khoản Hỗ Trợ Lãi Vay kể từ thời điểm Khách Hàng ký Văn bản
                      chuyển nhượng Hợp Đồng Mua Bán và/hoặc xe ô tô là đối
                      tượng của hợp đồng mua bán/chuyển nhượng với bất kỳ bên
                      thứ ba nào khác.
                    </p>
                    <p className="text-left leading-relaxed">
                      e) Trong Thời Hạn Hỗ Trợ Lãi Vay, nếu Khách Hàng tất toán
                      khoản vay trước hạn, ký Văn bản chuyển nhượng Hợp Đồng Mua
                      Bán và/hoặc xe ô tô là đối tượng của hợp đồng mua bán/
                      chuyển nhượng với bất kỳ bên thứ ba nào khác, không thực
                      hiện theo đúng quy định tại Hợp Đồng Tín Dụng đã ký giữa
                      Khách Hàng và Ngân Hàng dẫn đến Ngân Hàng chấm dứt Hợp
                      Đồng Tín Dụng thì VinFast/VinFast Trading chấm dứt hỗ trợ
                      Khoản Hỗ Trợ Lãi Vay theo Chính sách Hỗ trợ lãi vay theo
                      quy định tại Thỏa Thuận này kể từ thời điểm Hợp Đồng Tín
                      Dụng bị chấm dứt. Khách Hàng vẫn phải có trách nhiệm thực
                      hiện nghĩa vụ đối với Ngân Hàng theo quy định của Hợp Đồng
                      Tín Dụng và các thỏa thuận khác giữa Khách Hàng và Ngân
                      Hàng (nếu có).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ĐIỀU 3 */}
            <div className="mt-6">
              <p className="font-bold mb-3">
                Điều 3. Điều khoản hỗ trợ Ngân Hàng
              </p>

              <div className="space-y-3">
                <p className="text-left leading-relaxed">
                  Khách Hàng cam kết không có bất kỳ khiếu nại, khiếu kiện nào
                  và đảm bảo Đơn Vị Hỗ Trợ Kỹ Thuật (như được định nghĩa phía
                  dưới) và Ngân Hàng, cán bộ nhân viên của Ngân Hàng và Đơn Vị
                  Hỗ Trợ Kỹ Thuật không phải chịu bất kỳ trách nhiệm nào đối với
                  bất kỳ tổn thất và thiệt hại nào (nếu có) phát sinh từ hoặc
                  liên quan đến việc thực thi các nội dung nêu dưới đây:
                </p>
                <div className="space-y-3">
                  <p className="text-left leading-relaxed">
                    3.1. Khách Hàng cho phép Ngân Hàng thu thập, xử lý các thông
                    tin về xe, vị trí xe, tình trạng xe cho mục đích quản lý tài
                    sản bảo đảm, xử lý tài sản bảo đảm cho khoản vay theo Hợp
                    Đồng Tín Dụng thông qua bên thứ ba là Đơn Vị Hỗ Trợ Kỹ
                    Thuật, như được định nghĩa phía dưới.
                  </p>
                  <p className="text-left leading-relaxed">
                    3.2. Trong trường hợp Khách Hàng vi phạm nghĩa vụ trả nợ quá{" "}
                    <strong>10 ngày</strong> hoặc thời hạn khác theo yêu cầu của
                    Ngân Hàng, Ngân Hàng có quyền đề nghị VinFast Trading
                    và/hoặc bất kỳ bên thứ ba khác được VinFast Trading ủy
                    quyền/chỉ định (gọi chung là "
                    <strong>Đơn Vị Hỗ Trợ Kỹ Thuật</strong>") trích xuất dữ liệu
                    định vị xe của Khách Hàng và Khách Hàng đồng ý để Đơn Vị Hỗ
                    Trợ Kỹ Thuật thu thập, xử lý, cung cấp và chia sẻ dữ liệu
                    này cho Ngân Hàng để phục vụ hoạt động xử lý, thu hồi nợ
                    và/hoặc sử dụng vào bất kỳ mục đích nào khác theo thỏa thuận
                    giữa Khách Hàng và Ngân Hàng;
                  </p>
                  <p className="text-left leading-relaxed">
                    3.3. Trong trường hợp Khách Hàng vi phạm nghĩa vụ trả nợ quá{" "}
                    <strong>30 ngày</strong> hoặc thời hạn khác theo yêu cầu từ
                    Ngân Hàng, Ngân Hàng có quyền gửi yêu cầu cho Đơn Vị Hỗ Trợ
                    Kỹ Thuật kích hoạt tính năng giới hạn mức SOC của Pin tại
                    ngưỡng 30% theo đề nghị của Ngân Hàng, và Khách Hàng đồng ý
                    để Đơn Vị Hỗ Trợ Kỹ Thuật thực hiện các việc này.
                  </p>
                </div>
              </div>
            </div>

            {/* ĐIỀU 4 */}
            <div className="mt-6">
              <p className="font-bold mb-3">Điều 4. Hiệu lực của Thỏa Thuận</p>

              <div className="space-y-3">
                <p className="text-left leading-relaxed">
                  4.1. Thỏa Thuận này có hiệu lực kể từ ngày ký đến ngày hết hiệu
                  lực của Hợp Đồng Tín Dụng.
                </p>
                <p className="text-left leading-relaxed">
                  4.2. Khách Hàng không được chuyển nhượng, chuyển giao quyền và
                  nghĩa vụ của mình theo Thỏa Thuận này cho bất kỳ bên thứ ba
                  nào nếu không được chấp thuận trước bằng văn bản của
                  VinFast/VinFast Trading. Tuy nhiên, Khách Hàng đồng ý rằng
                  VinFast/VinFast Trading có quyền chuyển nhượng, chuyển giao
                  các quyền/nghĩa vụ theo Thỏa Thuận này cho bên thứ ba, hoặc
                  trong trường hợp VinFast/VinFast Trading tổ chức lại doanh
                  nghiệp, bao gồm sáp nhập vào một công ty khác hoặc được chia,
                  hoặc tách hoặc được chuyển đổi với điều kiện là việc chuyển
                  nhượng, chuyển giao các quyền/nghĩa vụ đó không gây thiệt hại
                  đến quyền và lợi ích của Khách Hàng theo Thỏa Thuận này và bên
                  nhận chuyển giao các quyền/nghĩa vụ theo Thỏa Thuận này chịu
                  trách nhiệm tiếp tục thực hiện đầy đủ các quyền và nghĩa vụ
                  đối với Khách hàng theo Thỏa thuận này.
                </p>
                <p className="text-left leading-relaxed">
                  4.3. Mọi sửa đổi, bổ sung Thỏa Thuận này phải được lập thành văn
                  bản và được ký bởi người đại diện hợp pháp của mỗi Bên.
                </p>
                <p className="text-left leading-relaxed">
                  4.4. Thỏa Thuận này được điều chỉnh theo các quy định của pháp
                  luật Việt Nam. Mọi tranh chấp phát sinh từ Thỏa Thuận này nếu
                  không được giải quyết bằng thương lượng và hòa giải giữa Các
                  Bên, thì sẽ được giải quyết tại Tòa án có thẩm quyền.
                </p>
                <p className="text-left leading-relaxed">
                  4.5. Thỏa Thuận này được lập thành 04 (bốn) bản có giá trị như
                  nhau, mỗi Bên giữ 02 (hai) bản để thực hiện.
                </p>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="mt-16">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="text-center font-bold p-4 w-1/2">
                    <p className="mb-20">ĐẠI DIỆN BÊN BÁN</p>
                  </td>
                  <td className="text-center font-bold p-4 w-1/2">
                    <p className="mb-20">KHÁCH HÀNG</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center mt-8 print:hidden flex flex-wrap justify-center gap-3">
        <button
          onClick={handleBack}
          className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
        >
          Quay lại
        </button>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          In Thỏa Thuận
        </button>
      </div>

      <style>{`
        @media print {
          @page {
            margin: 15mm 20mm 15mm 20mm;
          }
          body * {
            visibility: hidden;
          }
          #printable-content,
          #printable-content * {
            visibility: visible;
          }
          #printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            font-family: 'Times New Roman', Times, serif !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            font-family: 'Times New Roman', Times, serif !important;
          }
          input,
          input:focus,
          input[type="text"],
          input[type="text"]:focus {
            border: none !important;
            border-bottom: none !important;
            border-top: none !important;
            border-left: none !important;
            border-right: none !important;
            outline: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          .underline,
          span.underline,
          .print\\:inline.underline,
          span.print\\:inline.underline {
            text-decoration: none !important;
            border-bottom: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GiayThoaThuanHTLS_VPBank;
