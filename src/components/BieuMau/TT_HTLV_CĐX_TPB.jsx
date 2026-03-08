import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import { getBranchByShowroomName, getDefaultBranch } from "../../data/branchData";
import { vndToWords } from "../../utils/vndToWords";
import { formatCurrency, formatDate } from "../../utils/formatting";
import vinfastLogo from "../../assets/vinfast.svg";
import CurrencyInput from "../shared/CurrencyInput";

const TT_HTLV_CĐX_TPB = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);

  // Helper functions

  const pad = (num) => String(num).padStart(2, "0");

  // Helper function to format date as dd/mm/yyyy
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

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
  const [ngayUyQuyenRaw, setNgayUyQuyenRaw] = useState("");

  // Khách Hàng
  const [tenKH, setTenKH] = useState("");
  const [diaChiKH, setDiaChiKH] = useState("");
  const [dienThoaiKH, setDienThoaiKH] = useState("");
  const [maSoThueKH, setMaSoThueKH] = useState("");
  const [cmtndKH, setCmtndKH] = useState("");
  const [ngayCapKH, setNgayCapKH] = useState("");
  const [noiCapKH, setNoiCapKH] = useState("");
  const [daiDienKH, setDaiDienKH] = useState("");
  const [chucVuKH, setChucVuKH] = useState("");

  // Thông tin xe và hợp đồng
  const [soHopDong, setSoHopDong] = useState("");
  const [mauXe, setMauXe] = useState("");
  const [soKhung, setSoKhung] = useState("");
  const [soMay, setSoMay] = useState("");

  // Thông tin vay
  const [soTienVay, setSoTienVay] = useState("");
  const [soTienVayBangChu, setSoTienVayBangChu] = useState("");
  const [tyLeVay, setTyLeVay] = useState("");
  const [thoiHanVay, setThoiHanVay] = useState("");
  const [laiSuatCo, setLaiSuatCo] = useState("");
  const [laiSuat24Thang, setLaiSuat24Thang] = useState("");
  const [ngayDatCoc, setNgayDatCoc] = useState("");
  const [ngayDatCocRaw, setNgayDatCocRaw] = useState("");

  // Firebase effect
  useEffect(() => {
    const loadData = async () => {
      let showroomName = location.state?.showroom || "";
      let showroomLoadedFromContracts = false;

      // Nếu có firebaseKey, thử lấy showroom từ contracts trước
      if (location.state?.firebaseKey || location.state?.contractId) {
        const contractId =
          location.state.firebaseKey || location.state.contractId;
        try {
          const contractsRef = ref(database, `contracts/${contractId}`);
          const snapshot = await get(contractsRef);
          if (snapshot.exists()) {
            const contractData = snapshot.val();
            console.log("Loaded from contracts:", contractData);
            setData(contractData);

            if (contractData.showroom) {
              showroomName = contractData.showroom;
              showroomLoadedFromContracts = true;
              console.log("Showroom loaded from contracts:", showroomName);

              // Cập nhật thông tin công ty và địa chỉ dựa trên showroom
              const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
              setBranch(branchInfo);
              if (branchInfo) {
                setCongTy(
                  `CÔNG TY CỔ PHẦN ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI GÒN - CHI NHÁNH ${branchInfo.shortName.toUpperCase()}`
                );
                setDiaChiTruSo(branchInfo.address);
                setMaSoDN(branchInfo.taxCode || "");
                setTaiKhoan(branchInfo.bankAccount || "");
                setNganHangTK(branchInfo.bankName || "VP Bank");
                setDaiDien(branchInfo.representativeName || "Nguyễn Thành Trai");
                setChucVu(branchInfo.position || "Tổng Giám Đốc");
              }
            }

            // Auto-fill fields từ contracts
            if (contractData.khachHang || contractData.customerName) {
              setTenKH(
                contractData.khachHang || contractData.customerName || ""
              );
              setDiaChiKH(
                contractData.diaChiKhachHang ||
                contractData.diaChiKhachHang ||
                contractData.address ||
                ""
              );
              setDienThoaiKH(
                contractData.soDienThoaiKhachHang ||
                contractData.soDienThoaiKhachHang ||
                contractData.phone ||
                ""
              );
              setCmtndKH(
                contractData.soCccdKhachHang ||
                contractData.soCccdKhachHang ||
                contractData.cccd ||
                contractData.CCCD ||
                ""
              );
            }

            if (
              contractData.thongTinXe ||
              contractData.tenXe ||
              contractData.dongXe ||
              contractData.model
            ) {
              setMauXe(
                contractData.tenXe ||
                contractData.dongXe ||
                contractData.model ||
                contractData["Dòng xe"] ||
                ""
              );
              setSoKhung(
                contractData.soKhung ||
                contractData["Số Khung"] ||
                contractData.chassisNumber ||
                ""
              );
              setSoMay(
                contractData.soMay ||
                contractData["Số Máy"] ||
                contractData.engineNumber ||
                ""
              );
            }

            setSoHopDong(
              contractData.vso ||
              contractData.VSO ||
              contractData.soHopDong ||
              contractData.contractNumber ||
              ""
            );

            // Ngày cấp CCCD
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
              setNgayCapKH(formatDate(ngayCap));
            }

            // Nơi cấp CCCD
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

            // Mã số thuế
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
          } else {
            console.log("Contract not found in contracts path");
          }
        } catch (err) {
          console.error("Error loading showroom from contracts:", err);
        }
      }

      // Thử load từ exportedContracts nếu có firebaseKey
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
              const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
              setBranch(branchInfo);
              if (branchInfo) {
                setCongTy(
                  `CÔNG TY CỔ PHẦN ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI GÒN - CHI NHÁNH ${branchInfo.shortName.toUpperCase()}`
                );
                setDiaChiTruSo(branchInfo.address);
                setMaSoDN(branchInfo.taxCode || "");
                setTaiKhoan(branchInfo.bankAccount || "");
                setNganHangTK(branchInfo.bankName || "VP Bank");
                setDaiDien(branchInfo.representativeName || "Nguyễn Thành Trai");
                setChucVu(branchInfo.position || "Tổng Giám Đốc");
              }
            }

            // Lấy Model từ database
            if (
              contractData.dongXe ||
              contractData.model ||
              contractData["Dòng xe"]
            ) {
              setMauXe(
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

            // Lấy thông tin khách hàng từ database
            if (
              contractData.customerName ||
              contractData["Tên KH"] ||
              contractData["Tên Kh"] ||
              contractData.khachHang
            ) {
              setTenKH(
                contractData.customerName ||
                contractData["Tên KH"] ||
                contractData["Tên Kh"] ||
                contractData.khachHang ||
                ""
              );
            }

            // Địa chỉ khách hàng
            if (
              contractData.address ||
              contractData["Địa chỉ"] ||
              contractData["Địa Chỉ"] ||
              contractData.diaChiKhachHang
            ) {
              setDiaChiKH(
                contractData.address ||
                contractData["Địa chỉ"] ||
                contractData["Địa Chỉ"] ||
                contractData.diaChiKhachHang ||
                ""
              );
            }

            // Điện thoại khách hàng
            if (
              contractData.phone ||
              contractData["Số Điện Thoại"] ||
              contractData["Số điện thoại"] ||
              contractData.soDienThoaiKhachHang
            ) {
              setDienThoaiKH(
                contractData.phone ||
                contractData["Số Điện Thoại"] ||
                contractData["Số điện thoại"] ||
                contractData.soDienThoaiKhachHang ||
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
              contractData.customerCCCD ||
              contractData.soCccdKhachHang
            ) {
              setCmtndKH(
                contractData.cccd ||
                contractData.CCCD ||
                contractData["Căn cước"] ||
                contractData.customerCCCD ||
                contractData.soCccdKhachHang ||
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
              setNgayCapKH(formatDate(ngayCap));
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

            // Số hợp đồng (ưu tiên VSO)
            if (
              contractData.vso ||
              contractData.VSO ||
              contractData.soHopDong ||
              contractData.contractNumber ||
              contractData["Số Hợp Đồng"]
            ) {
              setSoHopDong(
                contractData.vso ||
                contractData.VSO ||
                contractData.soHopDong ||
                contractData.contractNumber ||
                contractData["Số Hợp Đồng"] ||
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

      // Set branch info nếu chưa load được từ contracts và có showroom
      if (!showroomLoadedFromContracts && showroomName) {
        const branchInfo = getBranchByShowroomName(showroomName);
        if (branchInfo) {
          setBranch(branchInfo);
          setCongTy(
            `CÔNG TY CỔ PHẦN ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI GÒN - CHI NHÁNH ${branchInfo.shortName.toUpperCase()}`
          );
          setDiaChiTruSo(branchInfo.address);
          setMaSoDN(branchInfo.taxCode || "");
          setTaiKhoan(branchInfo.bankAccount || "");
          setNganHangTK(branchInfo.bankName || "VP Bank");
          setDaiDien(branchInfo.representativeName || "Nguyễn Thành Trai");
          setChucVu(branchInfo.position || "Tổng Giám Đốc");
        }
      }

      // Set default date
      const today = new Date();
      setNgayKy(pad(today.getDate()));
      setThangKy(pad(today.getMonth() + 1));
      setNamKy(today.getFullYear().toString());

      // Nếu có showroom từ location.state và chưa load từ contracts, cập nhật thông tin công ty
      if (location.state?.showroom && !showroomLoadedFromContracts) {
        const branchInfo = getBranchByShowroomName(location.state.showroom);
        if (branchInfo) {
          setBranch(branchInfo);
          setCongTy(
            `CÔNG TY CỔ PHẦN ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI GÒN - CHI NHÁNH ${branchInfo.shortName.toUpperCase()}`
          );
          setDiaChiTruSo(branchInfo.address);
          setMaSoDN(branchInfo.taxCode || "");
          setTaiKhoan(branchInfo.bankAccount || "");
          setNganHangTK(branchInfo.bankName || "VP Bank");
          setDaiDien(branchInfo.representativeName || "Nguyễn Thành Trai");
          setChucVu(branchInfo.position || "Tổng Giám Đốc");
        }
      }

      // Auto-fill từ location.state
      if (location.state) {
        const stateData = location.state;
        if (!location.state.firebaseKey && !location.state.contractId) {
          setData(stateData);
          if (stateData.customerName || stateData.tenKh) setTenKH(stateData.customerName || stateData.tenKh);
          if (stateData.customerAddress || stateData.diaChi || stateData.address) setDiaChiKH(stateData.customerAddress || stateData.diaChi || stateData.address);
          if (stateData.customerPhone || stateData.soDienThoai || stateData.phone) setDienThoaiKH(stateData.customerPhone || stateData.soDienThoai || stateData.phone);
          if (stateData.customerCCCD) setCmtndKH(stateData.customerCCCD);
          // Lấy số hợp đồng (ưu tiên VSO)
          if (stateData.vso || stateData.VSO || stateData.contractNumber) {
            setSoHopDong(
              stateData.vso || stateData.VSO || stateData.contractNumber || ""
            );
          }
          if (stateData.hieuxe || stateData.model || stateData.dongXe) setMauXe(stateData.hieuxe || stateData.model || stateData.dongXe);
          if (stateData.soKhung) setSoKhung(stateData.soKhung);
          if (stateData.soMay) setSoMay(stateData.soMay);

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
          // Nếu có firebaseKey, vẫn có thể override từ location.state nếu có VSO
          if (stateData.vso || stateData.VSO) {
            setSoHopDong(stateData.vso || stateData.VSO || "");
          }
        }
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
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
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
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <div className="max-w-4xl mx-auto print:max-w-4xl print:mx-auto">
        <div
          ref={printableRef}
          className="flex-1 bg-white p-8 print:pt-0 flex flex-col"
          id="printable-content"
        >
          {/* Header with title */}
          <div className="text-center mb-6">
            <div className="w-32 mx-auto mb-4">
              <img src={vinfastLogo} alt="VinFast Logo" className="w-full" />
            </div>
            <h1 className="text-xl font-bold uppercase">
              THỎA THUẬN HỖ TRỢ LÃI VAY
            </h1>
            <div className="mt-4">
              <p className="text-sm">
                Thỏa thuận hỗ trợ lãi vay ("<strong>Thỏa Thuận</strong>") này
                được ký ngày{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={ngayKy}
                    onChange={(e) => setNgayKy(e.target.value)}
                    className="border-b border-gray-400 px-1 w-8 text-center focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline underline">{ngayKy}</span>{" "}
                tháng{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={thangKy}
                    onChange={(e) => setThangKy(e.target.value)}
                    className="border-b border-gray-400 px-1 w-8 text-center focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline underline">{thangKy}</span>{" "}
                năm{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={namKy}
                    onChange={(e) => setNamKy(e.target.value)}
                    className="border-b border-gray-400 px-1 w-16 text-center focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline underline">{namKy}</span>,
                bởi và giữa:
              </p>
            </div>
          </div>

          {/* Content */}
          <div
            className="text-sm space-y-4"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
          >
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
                <>
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
                    <span className="hidden print:inline">{diaChiTruSo}</span>
                  </p>
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
                    <span className="hidden print:inline underline">{maSoDN}</span>
                  </p>
                  <p className="mb-1">
                    Tài khoản:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={taiKhoan}
                        onChange={(e) => setTaiKhoan(e.target.value)}
                        className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
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
                        className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{nganHangTK}</span>
                  </p>
                  <p className="mb-1">
                    Đại diện:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={daiDien}
                        onChange={(e) => setDaiDien(e.target.value)}
                        className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{daiDien}</span> Chức vụ:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={chucVu}
                        onChange={(e) => setChucVu(e.target.value)}
                        className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{chucVu}</span>
                  </p>
                  <p className="mb-1">
                    (Theo Giấy uỷ quyền số{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={giayUyQuyen}
                        onChange={(e) => setGiayUyQuyen(e.target.value)}
                        className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{giayUyQuyen}</span> ngày{" "}
                    <span className="print:hidden">
                      <input
                        type="date"
                        value={ngayUyQuyenRaw}
                        onChange={(e) => {
                          setNgayUyQuyenRaw(e.target.value);
                          if (e.target.value) {
                            setNgayUyQuyen(formatDateForDisplay(e.target.value));
                          } else {
                            setNgayUyQuyen("");
                          }
                        }}
                        className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">
                      {ngayUyQuyen || "[---/---/---]"}
                    </span>
                    )
                  </p>
                  <p className="mb-2 font-bold">
                    ("<strong>Bên Bán</strong>")
                  </p>
                </>
              )}
            </div>

            <p className="font-bold mb-4">
              <strong>VÀ</strong>
            </p>

            {/* Khách Hàng */}
            <div>
              <p className="mb-2">
                <span className="font-normal">Ông/Bà: </span>
                <span className="print:hidden">
                  <input
                    type="text"
                    value={tenKH}
                    onChange={(e) => setTenKH(e.target.value)}
                    className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline font-normal">{tenKH}</span>
              </p>
              <p className="mb-1">
                Địa chỉ:{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={diaChiKH}
                    onChange={(e) => setDiaChiKH(e.target.value)}
                    className="border-b border-gray-400 px-1 w-[90%] focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{diaChiKH}</span>
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
                <span className="hidden print:inline">{dienThoaiKH}</span>
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
                <span className="hidden print:inline">{maSoThueKH}</span>
              </p>
              <p className="mb-1">
                CMTND/TCC: Số{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={cmtndKH}
                    onChange={(e) => setCmtndKH(e.target.value)}
                    className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{cmtndKH}</span> cấp ngày{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={ngayCapKH}
                    onChange={(e) => setNgayCapKH(e.target.value)}
                    className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{ngayCapKH}</span> bởi{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={noiCapKH}
                    onChange={(e) => setNoiCapKH(e.target.value)}
                    className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{noiCapKH}</span>
              </p>
              <p className="mb-1">
                Đại diện:{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={daiDienKH}
                    onChange={(e) => setDaiDienKH(e.target.value)}
                    className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{daiDienKH}</span> Chức
                vụ:{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={chucVuKH}
                    onChange={(e) => setChucVuKH(e.target.value)}
                    className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{chucVuKH}</span>
              </p>
              <p className="font-bold mb-4">
                ("<strong>Khách Hàng</strong>")
              </p>
            </div>

            <p className="mb-4">
              Bên Bán và Khách Hàng sau đây được gọi riêng là{" "}
              <strong>"Bên"</strong> và gọi chung là <strong>"Các Bên"</strong>
            </p>

            {/* XÉT RẰNG */}
            <div>
              <h3 className="font-bold mb-3">
                <strong>XÉT RẰNG:</strong>
              </h3>

              <p className="mb-3">
                1. Bên Bán và Khách Hàng đã ký hợp đồng mua bán xe ô tô số{" "}
                <span className="print:hidden">
                  <input
                    type="text"
                    value={soHopDong}
                    onChange={(e) => setSoHopDong(e.target.value)}
                    className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline">{soHopDong}</span> (sau
                đây gọi chung là "<strong>Hợp Đồng Mua Bán Xe</strong>") với
                thông tin về xe như sau:
              </p>
              <div className="ml-4 mb-3">
                <p>
                  - Model:{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={mauXe}
                      onChange={(e) => setMauXe(e.target.value)}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{mauXe}</span>
                </p>
                <p>
                  - Số Khung:{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={soKhung}
                      onChange={(e) => setSoKhung(e.target.value)}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{soKhung}</span>
                </p>
                <p>
                  - Số Máy:{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={soMay}
                      onChange={(e) => setSoMay(e.target.value)}
                      className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{soMay}</span>
                </p>
              </div>

              <p className="mb-3">
                2. Khách Hàng thuộc trường hợp được áp dụng chính sách hỗ trợ
                một khoản tiền tương đương một phần khoản lãi vay của khoản vay
                mua xe tại Ngân hàng TMCP Tiên Phong (sau đây gọi là "
                <strong>Ngân Hàng</strong>") theo chính sách hỗ trợ lãi vay của
                VinFast ("<strong>Chính sách Hỗ trợ lãi vay</strong>") áp dụng
                cho các Khách hàng cá nhân có thời hạn đặt cọc/xuất hóa đơn từ
                ngày{" "}
                <span className="print:hidden">
                  <input
                    type="date"
                    value={ngayDatCocRaw}
                    onChange={(e) => {
                      setNgayDatCocRaw(e.target.value);
                      if (e.target.value) {
                        setNgayDatCoc(formatDateForDisplay(e.target.value));
                      } else {
                        setNgayDatCoc("");
                      }
                    }}
                    className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline underline">
                  {ngayDatCoc || "…./…./….."}
                </span>{" "}
                và giải ngân khoản vay mua xe đến hết ngày 31/12/2025. Công ty
                TNHH Kinh Doanh Thương Mại Và Dịch Vụ VinFast – Mã số thuế:
                0108926276 ("<strong>VinFast Trading</strong>"), Ngân Hàng và
                Công ty cổ phần Sản xuất và Kinh doanh VinFast – Mã số thuế:
                0107894416 ("<strong>VinFast</strong>") đã ký Thỏa thuận hợp tác
                ("<strong>Thỏa Thuận Hợp Tác</strong>") về việc hỗ trợ Khách
                Hàng vay mua xe ô tô điện VinFast. Theo đó, Khách Hàng sẽ được
                VinFast hỗ trợ thanh toán cho Ngân Hàng một khoản tiền chênh
                lệch giữa số tiền lãi của Ngân Hàng theo các quy định và điều
                kiện tại Thỏa Thuận Hợp Tác với số tiền lãi Khách Hàng chi trả
                cố định hàng tháng. Khoản hỗ trợ này sẽ được VinFast chi trả cho
                Ngân Hàng thông qua VinFast Trading.
              </p>

              <p className="mb-3">
                3. Khách Hàng và Ngân Hàng đã hoặc sẽ ký kết một hợp đồng tín
                dụng (hoặc hợp đồng/thỏa thuận/khế ước khác có bản chất là hợp
                đồng tín dụng) và hợp đồng thế chấp (hoặc hợp đồng/thỏa thuận có
                bản chất là giao dịch bảo đảm) và tất cả các thỏa thuận, phụ
                lục, sửa đổi bổ sung liên quan (sau đây gọi chung là "
                <strong>Hợp Đồng Tín Dụng</strong>"). Theo đó, Ngân Hàng cho
                Khách Hàng vay một khoản tiền để mua xe ô tô VinFast theo Hợp
                Đồng Mua Bán Xe, giải ngân trực tiếp vào tài khoản của bên bán
                theo tiến độ thanh toán của Hợp Đồng Mua Bán Xe;
              </p>

              <p className="mb-4">
                4. Bên bán được Vinfast Trading ủy quyền giao kết Thỏa thuận này
                với Khách hàng để triển khai Chính sách Hỗ trợ lãi vay (áp dụng
                cho Đại lý phân phối, bỏ nếu là VFT).
              </p>

              <p className="mb-4">
                Do vậy, để thực hiện Chính Sách Hỗ trợ lãi vay nêu trên, Các Bên
                thống nhất ký kết Thỏa Thuận với những nội dung như sau:
              </p>
            </div>

            {/* ĐIỀU 1 */}
            <div className="mb-6">
              <h3 className="font-bold mb-3">
                Điều 1. Thỏa thuận về việc Hỗ Trợ Lãi Vay:
              </h3>

              <div className="mb-4">
                <p className="text-left leading-relaxed">
                  1.1. Các Bên tại đây đồng ý rằng, khoản lãi vay mà VinFast sẽ
                  hỗ trợ trả thay Khách Hàng cho Ngân Hàng thông qua VinFast
                  Trading đối với mỗi Hợp Đồng Tín Dụng (sau đây là "
                  <strong>Khoản Hỗ Trợ Lãi Vay</strong>") được tính như sau:
                </p>
                <p>
                  Khoản Hỗ Trợ Lãi Vay (kỳ tính toán theo tháng) trong thời gian
                  hỗ trợ được tính như sau:
                </p>
                <p className="text-center my-3">
                  Khoản Hỗ Trợ Lãi Vay tháng T (1) ={" "}
                  <span className="underline">
                    Dự nợ gốc (2) × Lãi suất hỗ trợ (3) × số ngày vay thực tế
                    trong tháng T (1)/365
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
              </div>

              <div className="mb-4">
                <p className="mb-2">1.2. Chính sách Hỗ trợ lãi vay:</p>
                <div className="ml-4 space-y-2">
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
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">
                      {formatCurrency(soTienVay) || "______"}
                    </span>{" "}
                    VNĐ (Bằng chữ:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={soTienVayBangChu}
                        onChange={(e) => setSoTienVayBangChu(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">
                      {soTienVayBangChu || "______"}
                    </span>
                    ) tương ứng với tỷ lệ vay Ngân Hàng:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={tyLeVay}
                        onChange={(e) => setTyLeVay(e.target.value)}
                        className="border-b border-gray-400 px-1 w-16 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{tyLeVay}</span>% giá
                    trị xe
                  </p>
                  <p>
                    b) Ngân Hàng vay: <strong>Ngân hàng TMCP Tiên Phong</strong>
                  </p>
                  <p>
                    c) Lãi suất Ngân hàng áp dụng:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={laiSuatCo}
                        onChange={(e) => setLaiSuatCo(e.target.value)}
                        className="border-b border-gray-400 px-1 w-16 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{laiSuatCo}</span>{" "}
                    %/năm, cố định trong 24 tháng (đã bao gồm mức lãi suất hỗ
                    trợ của Ngân Hàng so với Khách hàng thông thường)
                  </p>
                  <p>
                    d) Lãi suất sau thời gian cố định: Lãi suất cơ sở + Biên độ
                    3.6%/năm (đã bao gồm mức lãi suất hỗ trợ của Ngân Hàng so
                    với Khách hàng thông thường cho năm thứ 3). Chi tiết theo
                    ghi nhận tại Hợp Đồng Tín Dụng
                  </p>
                  <p>
                    e) Thời hạn vay:{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={thoiHanVay}
                        onChange={(e) => setThoiHanVay(e.target.value)}
                        className="border-b border-gray-400 px-1 w-24 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{thoiHanVay}</span>{" "}
                    tháng
                  </p>
                  <p>
                    f) VinFast sẽ hỗ trợ trả thay cho Khách Hàng một khoản tiền
                    lãi ("<strong>Khoản Hỗ Trợ Lãi Vay</strong>") tương đương
                    bằng khoản chênh lệch giữa (i) số tiền lãi Khách Hàng phải
                    thanh toán theo mức lãi suất cho vay tại Hợp Đồng Tín Dụng
                    và (ii) số tiền lãi mà Khách Hàng phải thanh toán theo mức
                    lãi suất cho vay được nêu dưới đây trong suốt thời gian vay
                    (tối đa bằng 96 tháng) kể từ ngày bắt đầu tính lãi theo Hợp
                    Đồng Tín Dụng, tương đương 2%/năm, nhưng không quá 36 tháng
                    ("<strong>Thời Hạn Hỗ Trợ Lãi Vay</strong>") hoặc cho đến
                    khi Thời Hạn Hỗ Trợ Lãi Vay chấm dứt trước thời hạn theo quy
                    định tại Thỏa Thuận này, tùy thời điểm nào đến trước.
                  </p>
                  <p className="mt-2">
                    Số tiền gốc và lãi Khách Hàng thanh toán hàng tháng theo
                    phương án gốc trả đều hàng tháng, lãi theo dư nợ giảm dần,
                    trong đó lãi suất thực tế Khách Hàng phải chi trả khi được
                    VinFast hỗ trợ trả thay đúng hạn như sau:
                  </p>
                  <div className="ml-4 mt-2">
                    <p>
                      - Lãi suất cho vay trong hạn trong 24 tháng đầu tiên:{" "}
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={laiSuat24Thang}
                          onChange={(e) => setLaiSuat24Thang(e.target.value)}
                          className="border-b border-gray-400 px-1 w-16 focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">
                        {laiSuat24Thang || "……."}
                      </span>
                      %/năm.
                    </p>
                    <p>
                      - Lãi suất cho vay trong hạn trong 12 tháng tiếp theo: Là
                      phần chênh lệch giữa mức lãi suất cho vay trong hạn Khách
                      hàng phải trả theo Hợp Đồng Tín Dụng trừ (-) 2%/năm.
                    </p>
                    <p>
                      - Lãi suất cho vay trong hạn trong thời gian vay còn lại:
                      Lãi suất cơ sở + Biên độ 3.6%/năm. Chi tiết theo ghi nhận
                      tại Hợp Đồng Tín Dụng.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="mb-2">
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
              </div>

              <div className="mb-4">
                <p className="mb-2">
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
              </div>

              <div className="mb-4">
                <p className="mb-2">
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
              </div>

              <div className="mb-4">
                <p className="mb-2">
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
            <div className="mb-6">
              <h3 className="font-bold mb-3">
                <strong>Điều 2. Quyền và nghĩa vụ của các Bên</strong>
              </h3>

              <div className="mb-4">
                <p className="mb-2">
                  2.1. Quyền và nghĩa vụ của VinFast Trading:
                </p>
                <div className="ml-4 space-y-2">
                  <p>
                    a) Thực hiện kiểm tra, đối chiếu và xác nhận với Ngân Hàng
                    các Khoản Hỗ Trợ Lãi Vay hỗ trợ cho Khách Hàng khi nhận được
                    thông báo của Ngân Hàng có phát sinh các khoản vay của Khách
                    Hàng thông qua email trước khi ký chính thức thông báo thanh
                    toán Khoản Hỗ Trợ Lãi Vay;
                  </p>
                  <p>
                    b) Thực hiện việc hỗ trợ Khoản Hỗ Trợ Lãi Vay của Khách Hàng
                    theo Chính sách Hỗ trợ lãi vay theo Thỏa Thuận này;
                  </p>
                  <p>
                    c) Không chịu trách nhiệm đối với các mâu thuẫn, tranh chấp,
                    khiếu kiện hay khiếu nại nào liên quan đến và/hoặc phát sinh
                    giữa Ngân Hàng, Khách Hàng và các tổ chức, cá nhân khác
                    trong quá trình thực hiện Hợp Đồng Tín Dụng và các thỏa
                    thuận liên quan đến Hợp Đồng Tín Dụng mà không phải do lỗi
                    từ VinFast Trading.
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="mb-2">2.2. Quyền và nghĩa vụ của Khách Hàng:</p>
                <div className="ml-4 space-y-2">
                  <p>
                    a) Được VinFast Trading thực hiện việc hỗ trợ Khoản Hỗ Trợ
                    Lãi Vay và áp dụng Chính sách Hỗ trợ lãi vay theo quy định
                    của Thỏa Thuận này.
                  </p>
                  <p>
                    b) Tự chi trả, thanh toán nợ gốc, phí trả nợ trước hạn và
                    bất kỳ khoản lãi, lãi quá hạn nào phát sinh ngoài phạm vi
                    Khoản Hỗ Trợ Lãi Vay, Thời Hạn Hỗ Trợ Lãi Vay và Chính sách
                    Hỗ trợ lãi vay.
                  </p>
                  <p>
                    c) Khách Hàng cam kết miễn trừ cho VinFast, VinFast Trading
                    mọi trách nhiệm, nghĩa vụ liên quan đến bất kỳ tranh chấp,
                    mâu thuẫn, khiếu kiện, hay khiếu nại nào phát sinh từ, hoặc
                    liên quan đến Hợp Đồng Tín Dụng.
                  </p>
                  <p>
                    d) Khách Hàng không được VinFast Trading hỗ trợ Khoản Hỗ Trợ
                    Lãi Vay kể từ thời điểm Khách Hàng ký Văn bản chuyển nhượng
                    Hợp Đồng Mua Bán và/hoặc xe ô tô là đối tượng của hợp đồng
                    mua bán/chuyển nhượng với bất kỳ bên thứ ba nào khác.
                  </p>
                  <p>
                    e) Trong Thời Hạn Hỗ Trợ Lãi Vay, nếu Khách Hàng tất toán
                    Khoản Giải Ngân trước hạn, ký văn bản chuyển nhượng Hợp Đồng
                    Mua Bán và/hoặc xe ô tô là đối tượng của hợp đồng mua
                    bán/chuyển nhượng với bất kỳ bên thứ ba nào khác, không thực
                    hiện theo đúng quy định tại Hợp Đồng Tín Dụng đã ký giữa
                    Khách Hàng và Ngân Hàng dẫn đến Ngân Hàng chấm dứt Hợp Đồng
                    Tín Dụng thì VinFast chấm dứt hỗ trợ Khoản Hỗ Trợ Lãi Vay
                    theo Chính sách Hỗ trợ lãi vay theo quy định tại Thỏa Thuận
                    này kể từ thời điểm Hợp Đồng Tín Dụng bị chấm dứt. Khách
                    Hàng vẫn phải có trách nhiệm thực hiện nghĩa vụ đối với Ngân
                    Hàng theo quy định của Hợp Đồng Tín Dụng và các thỏa thuận
                    khác giữa Khách Hàng và Ngân Hàng (nếu có).
                  </p>
                </div>
              </div>
            </div>

            {/* ĐIỀU 3 */}
            <div className="mb-6">
              <h3 className="font-bold mb-3">
                Điều 3. Điều khoản hỗ trợ kỹ thuật Ngân hàng
              </h3>

              <p className="mb-4">
                Khách Hàng cam kết không có bất kỳ khiếu nại, khiếu kiện nào và
                đảm bảo Đơn Vị Hỗ Trợ Kỹ Thuật như được định nghĩa phía dưới,
                cán bộ nhân viên của Đơn Vị Hỗ Trợ Kỹ Thuật không phải chịu bất
                kỳ trách nhiệm nào đối với bất kỳ tổn thất và thiệt hại nào (nếu
                có) phát sinh từ hoặc liên quan đến việc thực thi các nội dung
                nêu tại điểm a, b, c dưới đây:
              </p>

              <div className="ml-4 space-y-3">
                <p>
                  a) Khách Hàng cho phép Ngân Hàng thu thập, xử lý các thông tin
                  về xe, vị trí xe, tình trạng xe cho mục đích quản lý tài sản
                  đảm bảo cho khoản vay theo Hợp Đồng Tín Dụng thông qua bên thứ
                  ba là Đơn Vị Hỗ Trợ Kỹ Thuật.
                </p>
                <p>
                  b) Trong trường hợp Khách Hàng vi phạm nghĩa vụ trả nợ quá 10
                  ngày, Ngân Hàng có quyền đề nghị VinFast Trading, nhà sản xuất
                  xe và/hoặc bất kỳ bên thứ ba khác được VinFast Trading ủy
                  quyền (gọi chung là “<strong>Đơn Vị Hỗ Trợ Kỹ Thuật</strong>”)
                  trích xuất dữ liệu định vị xe của Khách Hàng và Khách Hàng
                  đồng ý để Đơn Vị Hỗ Trợ Kỹ Thuật thu thập, xử lý, cung cấp và
                  chia sẻ dữ liệu này cho Ngân Hàng để phục vụ hoạt động xử lý
                  thu hồi nợ.
                </p>
                <p>
                  c) Trong trường hợp Khách Hàng vi phạm nghĩa vụ trả nợ quá 15
                  ngày, Ngân Hàng có quyền ủy quyền cho Đơn Vị Hỗ Trợ Kỹ Thuật
                  kích hoạt tính năng giới hạn mức SOC (dung lượng pin) của pin
                  tại ngưỡng 30% theo đề nghị của Ngân Hàng và Khách Hàng đồng ý
                  để Đơn Vị Hỗ Trợ Kỹ Thuật thực hiện các việc này.
                </p>
              </div>
            </div>

            {/* ĐIỀU 4 */}
            <div className="mb-6">
              <h3 className="font-bold mb-3">
                Điều 4. Điều khoản hỗ trợ mua lại
              </h3>

              <div className="ml-4 space-y-3">
                <p>
                  Trong trường hợp Khách Hàng vi phạm nghĩa vụ trả nợ khoản vay,
                  Khách Hàng cam kết đồng ý phối hợp với Ngân Hàng và một bên
                  thứ ba được VinFast/VinFast Trading chỉ định mua lại xe theo
                  chấp thuận từ Ngân Hàng (Sau đây gọi là “
                  <strong>Bên Mua Lại Xe</strong>”) để hoàn thiện các thủ tục
                  mua lại tài sản bảo đảm được hình thành từ vốn vay theo Hợp
                  Đồng Tín Dụng (“<strong>Tài Sản Bảo Đảm</strong>”), cụ thể:
                </p>
                <p>
                  a) Việc mua lại Tài Sản Bảo Đảm này sẽ được bắt đầu trong vòng
                  tối đa 30 ngày làm việc nhưng không sớm hơn 10 ngày làm việc
                  kể từ (và bao gồm cả) ngày Bên Mua Lại Xe nhận được Thông báo
                  kèm căn cứ là sao kê của Ngân Hàng về việc khách hàng không
                  trả nợ hoặc trả nợ không đầy đủ cho Ngân Hàng theo đúng Hợp
                  Đồng Tín Dụng.
                </p>
                <p>
                  b) Để làm rõ, thời hạn thanh toán của Bên Mua Lại Xe với Ngân
                  Hàng liên quan đến việc mua lại Tài Sản Bảo Đảm phải hoàn tất
                  trong vòng 30 ngày kể từ thời điểm: (i) Bên Mua Lại Xe nhận
                  được Thông báo đề nghị mua lại từ phía Ngân Hàng và (ii) đồng
                  thời thỏa mãn đủ điều kiện: Ngân Hàng đã nhận bàn giao/thu hồi
                  được Tài Sản Bảo Đảm từ Khách Hàng theo Biên bản giao nhận.
                </p>
                <p>
                  c) Giá mua lại là Giá trị còn lại của Tài Sản Bảo Đảm nhưng
                  đảm bảo không thấp hơn nghĩa vụ nợ gốc và lãi trong hạn (được
                  tính từ ngày bắt đầu kỳ trả nợ đến ngày hoàn thành việc mua
                  lại nhưng không quá 30 ngày kể từ ngày VinFast Trading kích
                  hoạt tính năng giới hạn SOC) của Khách Hàng phát sinh tại Ngân
                  Hàng theo Hợp Đồng Tín Dụng tại ngày Ngân Hàng gửi Thông báo
                  mua lại trừ đi (-) Khoản tiền bảo hiểm mà công ty bảo hiểm đã
                  bồi thường cho Ngân Hàng liên quan đến Tài Sản Bảo Đảm đề nghị
                  mua lại (nếu có).
                </p>
                <p>
                  d) Trường hợp giá mua lại mà Bên Mua Lại Xe phải trả cao hơn
                  tổng giá trị thực tế còn lại của Tài Sản Bảo Đảm theo định giá
                  hợp lý của Bên Mua Lại Xe hoặc một bên thứ ba do Bên Mua Lại
                  Xe chỉ định tại thời điểm mua lại, Khách Hàng có trách nhiệm
                  trả cho Bên Mua Lại Xe khoản tiền chênh lệch này trong vòng 15
                  (mười lăm) ngày kể từ ngày Bên Mua Lại Xe ký hợp đồng/thỏa
                  thuận mua lại Tài Sản Bảo Đảm. Sau thời hạn này mà Khách Hàng
                  không bồi hoàn cho Bên Mua Lại Xe thì Khách Hàng có trách
                  nhiệm trả thêm cho Bên Mua Lại Xe một khoản lãi chậm trả được
                  tính bằng 18%/số tiền chậm thanh toán/năm (tính theo số ngày
                  chậm thanh toán thực tế) và bồi thường mọi thiệt hại (nếu có)
                  cho Bên Mua Lại Xe.
                </p>
                <p>
                  e) Trường hợp giá mua lại mà Bên Mua Lại Xe phải trả thấp hơn
                  tổng giá trị thực tế còn lại của Tài Sản Bảo Đảm thì Bên Mua
                  Lại Xe không cần phải trả lại phần giá trị thừa cho Khách
                  Hàng.
                </p>
                <p>
                  f) Việc chuyển tiền mua lại Tài Sản Bảo Đảm sẽ được Bên Mua
                  Lại Xe hoặc bên thứ ba do Bên Mua Lại Xe chỉ định thông báo
                  cho Ngân Hàng trước tối đa 05 ngày bằng văn bản hoặc email.
                  Khách Hàng đồng ý toàn bộ số tiền trên sẽ được chuyển vào tài
                  khoản của Khách Hàng mở tại Ngân Hàng hoặc tài khoản khác do
                  Ngân Hàng chỉ định trong Thông báo mua lại để Ngân Hàng thực
                  hiện thu nợ đối với các nghĩa vụ vay vốn của Khách Hàng tại
                  Ngân Hàng. Đồng thời, Khách Hàng cũng đồng ý rằng Ngân Hàng có
                  toàn quyền phong tỏa và trích toàn bộ số tiền này để thực hiện
                  thu hồi các nghĩa vụ nợ của Khách Hàng đối với Ngân Hàng và
                  cam kết không có bất kỳ khiếu nại nào khi Ngân Hàng thực hiện
                  việc này.
                </p>
              </div>
            </div>

            {/* ĐIỀU 5 */}
            <div className="mb-6">
              <h3 className="font-bold mb-3">
                Điều 5. Hiệu lực của Thỏa Thuận
              </h3>

              <div className="space-y-3">
                <p>
                  5.1. Thỏa Thuận này có hiệu lực kể từ ngày ký đến ngày hết
                  hiệu lực của Hợp Đồng Tín Dụng. Thỏa Thuận có thể chấm dứt
                  trước thời hạn theo thỏa thuận của Các Bên hoặc xảy ra các
                  trường hợp quy định tại Điều 2.2.e Thỏa Thuận này.
                </p>
                <p>
                  5.2. Khách Hàng không được chuyển nhượng, chuyển giao quyền và
                  nghĩa vụ của mình theo Thỏa Thuận này cho bất kỳ bên thứ ba
                  nào nếu không được chấp thuận trước bằng văn bản của VinFast
                  Trading. Tuy nhiên, Khách Hàng đồng ý rằng VinFast và/hoặc
                  VinFast Trading có quyền chuyển nhượng, chuyển giao các
                  quyền/nghĩa vụ theo Thỏa Thuận này cho bên thứ ba, hoặc trong
                  trường hợp VinFast/VinFast Trading tổ chức lại doanh nghiệp,
                  bao gồm sáp nhập vào một công ty khác hoặc được chia, hoặc
                  tách hoặc được chuyển đổi với điều kiện là việc chuyển nhượng,
                  chuyển giao các quyền/nghĩa vụ đó không gây thiệt hại đến
                  quyền và lợi ích của Khách Hàng theo Thỏa Thuận này và bên
                  nhận chuyển giao các quyền/nghĩa vụ theo Thỏa Thuận này chịu
                  trách nhiệm tiếp tục thực hiện đầy đủ các quyền và nghĩa vụ
                  đối với Khách hàng theo Thỏa thuận này.
                </p>
                <p>
                  5.3. Mọi sửa đổi, bổ sung Thỏa Thuận này phải được lập thành
                  văn bản và được ký bởi người đại diện hợp pháp của mỗi Bên.
                </p>
                <p>
                  5.4. Thỏa Thuận này được điều chỉnh theo các quy định của pháp
                  luật Việt Nam. Mọi tranh chấp phát sinh từ Thỏa Thuận này nếu
                  không được giải quyết bằng thương lượng và hòa giải giữa các
                  Bên, thì sẽ được giải quyết tại Tòa án có thẩm quyền.
                </p>
                <p>
                  5.5. Thỏa Thuận này được lập thành 04 (bốn) bản có giá trị như
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
        * {
          font-family: 'Times New Roman', Times, serif !important;
        }
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
          #printable-content * {
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
            font-family: 'Times New Roman', Times, serif !important;
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

export default TT_HTLV_CĐX_TPB;
