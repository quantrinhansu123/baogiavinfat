import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import {
  getBranchByShowroomName,
  getDefaultBranch,
} from "../../data/branchData";
import { formatCurrency, formatDate } from "../../utils/formatting";
import {
  uniqueNgoaiThatColors,
  uniqueNoiThatColors,
} from "../../data/calculatorData";
import VinfastLogo from "../../assets/images/logo.svg";
import CurrencyInput from "../shared/CurrencyInput";
import { PrintStyles } from "./PrintStyles";

const DeXuatGiaban = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);

  // Editable fields
  const [ngay, setNgay] = useState("18");
  const [thang, setThang] = useState("11");
  const [nam, setNam] = useState("2025");
  const [tuVanBanHang, setTuVanBanHang] = useState("Tạ Công Trí");
  const [khachHang, setKhachHang] = useState("NGÔ NGUYÊN HOÀI NAM");
  const [soHopDong, setSoHopDong] = useState("S00901-VSO-25-09-0039");
  const [ngayHopDong, setNgayHopDong] = useState("29/09/2025");
  const [cccd, setCccd] = useState("079 099 014 151");
  const [maSoThue, setMaSoThue] = useState("");
  const [dienThoai, setDienThoai] = useState("093 412 2178");
  const [diaChi, setDiaChi] = useState(
    "Số 72/14 Đường tỉnh lộ 7, Ấp Bình Hạ, Xã Thái Mỹ, Tp Hồ Chí Minh"
  );
  const [loaiXe, setLoaiXe] = useState("LIMO GREEN");
  const [mauXe, setMauXe] = useState("TRẮNG/ĐEN");
  const [namSanXuat, setNamSanXuat] = useState("2025");
  const [soKhung, setSoKhung] = useState("RLLVFPNT9SH858285");

  // Đối tượng khách hàng
  const [thong, setThong] = useState("FALSE");
  const [corporate, setCorporate] = useState("FALSE");
  const [vinClub, setVinClub] = useState("FALSE");
  const [banBuon, setBanBuon] = useState("FALSE");
  const [xang, setXang] = useState("FALSE");

  const [chinhSachKhuyenMai, setChinhSachKhuyenMai] = useState(

  );

  // Giá bán
  const [giaNiemYet, setGiaNiemYet] = useState("749.000.000");
  const [giamGia, setGiamGia] = useState("29.960.000");
  const [giaBanHopDong, setGiaBanHopDong] = useState("719.040.000");

  // Quà tặng
  const [quaTangTheoXe, setQuaTangTheoXe] = useState(
    "bao da tay lái, bình chữa lửa, áo trùm xe, nước hoa xe."
  );
  const [quaTangKhac, setQuaTangKhac] = useState(
    "Bảo Hiểm Vật Chất Kinh Doanh, Cam, Film, Sàn"
  );

  // Thanh toán
  const [traThang, setTraThang] = useState("");
  const [traGop, setTraGop] = useState("647.000.000");
  const [nganHang, setNganHang] = useState("VP Bank");
  const [soTienDatCoc, setSoTienDatCoc] = useState("Full tiền");
  const [ngayDuKienNhanXe, setNgayDuKienNhanXe] = useState("");

  // Đề xuất lương TVBH
  const [theoChinhSachKhung, setTheoChinhSachKhung] = useState("");
  const [deXuat, setDeXuat] = useState("");
  const [lyDo, setLyDo] = useState(
    "(Lưu ý: Mức lương TVBH phụ thuộc vào chính sách của VINFAST, trường hợp tại thời điểm XHĐ chính sách VINFAST thay đổi, Cty sẽ xem xét điều chỉnh phù hợp)"
  );

  const parseUuDaiList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item || "").trim())
        .filter(Boolean);
    }
    if (typeof value === "string") {
      const normalized = value.replace(/\r\n/g, "\n").trim();
      if (!normalized) return [];
      const splitLegacyByProgramPrefix = (text) =>
        text
          .split(
            /,\s*(?=(?:-?\s*CTKM:|Chương trình|CHƯƠNG TRÌNH|Ưu đãi|ƯU ĐÃI))/i
          )
          .map((item) => item.replace(/^-CTKM:\s*/i, "").trim())
          .filter(Boolean);

      try {
        const parsed = JSON.parse(normalized);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item || "").trim())
            .filter(Boolean);
        }
      } catch (_) {
        // Keep string parsing fallback below.
      }

      if (normalized.includes("\n")) {
        return normalized
          .split("\n")
          .map((item) => item.replace(/^-CTKM:\s*/i, "").trim())
          .filter(Boolean);
      }
      if (normalized.includes("-CTKM:")) {
        return normalized
          .split(/-CTKM:\s*/i)
          .map((item) => item.trim())
          .filter(Boolean);
      }
      // Legacy fallback: old exported text sometimes joined programs by comma.
      // Only split when comma is followed by a likely new program prefix.
      const legacyParts = splitLegacyByProgramPrefix(normalized);
      if (legacyParts.length > 1) return legacyParts;
      return [normalized];
    }
    return [];
  };

  const formatUuDaiForTextarea = (value) =>
    parseUuDaiList(value)
      .map((item) => `-CTKM: ${item}`)
      .join("\n");

  // Helper function to format text with non-breaking commas
  // This function processes data that has already been formatted by the load logic
  // Newlines (\n) are used to separate programs (each program on a new line)
  // Commas within a line should not break lines
  // Colons (:) should not break lines either
  const formatTextWithNonBreakingCommas = (text) => {
    if (!text) return text;

    // Split by newline to separate programs (Enter = new program/new line)
    const programs = text.split('\n').map(p => p.trim()).filter(p => p);

    // Process each program: don't split by colon, just replace commas with non-breaking space
    return programs.map((program, programIndex) => {
      // Remove -CTKM: prefix if present
      let cleanProgram = program.replace(/^-CTKM:\s*/i, '');

      // Replace commas with comma + non-breaking space (don't split by colon)
      const formattedProgram = cleanProgram.replace(/,/g, ',\u00A0');

      return (
        <React.Fragment key={programIndex}>
          {formattedProgram}
          {programIndex < programs.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  // Helper function to get color name from color code
  const getColorName = (colorCode, isExterior = true) => {
    if (!colorCode) return colorCode || "";
    const colorList = isExterior ? uniqueNgoaiThatColors : uniqueNoiThatColors;
    // Check if it's already a name (contains Vietnamese characters or is lowercase)
    const foundByCode = colorList.find(
      (color) =>
        color.code === colorCode ||
        color.code.toLowerCase() === colorCode.toLowerCase()
    );
    if (foundByCode) {
      return foundByCode.name;
    }
    // Check if it's a name
    const foundByName = colorList.find(
      (color) => color.name.toLowerCase() === colorCode.toLowerCase()
    );
    return foundByName ? foundByName.name : colorCode; // Return name if found, otherwise return original value
  };

  useEffect(() => {
    const loadData = async () => {
      let showroomName = location.state?.showroom || "";

      // Thử load showroom từ contracts trước
      let showroomLoadedFromContracts = false;
      if (location.state?.firebaseKey) {
        try {
          const contractId = location.state.firebaseKey;
          const contractsRef = ref(database, `contracts/${contractId}`);
          const snapshot = await get(contractsRef);
          if (snapshot.exists()) {
            const contractData = snapshot.val();
            if (contractData.showroom) {
              showroomName = contractData.showroom;
              showroomLoadedFromContracts = true;
            }
          }
        } catch (error) {
          console.error("Error loading showroom from contracts:", error);
        }
      }

      // Load dữ liệu từ exportedContracts
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

            // Load showroom nếu chưa có từ contracts
            if (contractData.showroom && !showroomLoadedFromContracts) {
              showroomName = contractData.showroom;
            }

            // Tư vấn bán hàng
            if (contractData.tvbh || contractData.TVBH) {
              setTuVanBanHang(contractData.tvbh || contractData.TVBH || "");
            }

            // Khách hàng
            if (
              contractData.customerName ||
              contractData["Tên KH"] ||
              contractData["Tên Kh"]
            ) {
              setKhachHang(
                contractData.customerName ||
                contractData["Tên KH"] ||
                contractData["Tên Kh"] ||
                ""
              );
            }

            // Số hợp đồng (VSO)
            if (
              contractData.vso ||
              contractData.VSO ||
              contractData.contractNumber
            ) {
              setSoHopDong(
                contractData.vso ||
                contractData.VSO ||
                contractData.contractNumber ||
                ""
              );
            }

            // Ngày hợp đồng
            if (
              contractData["ngày xhd"] ||
              contractData.ngayXhd ||
              contractData.createdDate ||
              contractData.contractDate
            ) {
              const ngayHD =
                contractData["ngày xhd"] ||
                contractData.ngayXhd ||
                contractData.createdDate ||
                contractData.contractDate ||
                "";
              if (ngayHD) {
                // Format date nếu cần
                if (ngayHD.includes("-")) {
                  const date = new Date(ngayHD);
                  if (!isNaN(date.getTime())) {
                    const day = String(date.getDate()).padStart(2, "0");
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const year = date.getFullYear();
                    setNgayHopDong(`${day}/${month}/${year}`);
                  } else {
                    setNgayHopDong(ngayHD);
                  }
                } else {
                  setNgayHopDong(ngayHD);
                }
              }
            }

            // CCCD
            if (
              contractData.cccd ||
              contractData.CCCD ||
              contractData.customerCCCD
            ) {
              setCccd(
                contractData.cccd ||
                contractData.CCCD ||
                contractData.customerCCCD ||
                ""
              );
            }

            // Mã số thuế
            if (
              contractData.maSoThue ||
              contractData["Mã số thuế"] ||
              contractData["Mã Số Thuế"]
            ) {
              setMaSoThue(
                contractData.maSoThue ||
                contractData["Mã số thuế"] ||
                contractData["Mã Số Thuế"] ||
                ""
              );
            }

            // Điện thoại
            if (
              contractData.phone ||
              contractData["Số Điện Thoại"] ||
              contractData["Số điện thoại"]
            ) {
              setDienThoai(
                contractData.phone ||
                contractData["Số Điện Thoại"] ||
                contractData["Số điện thoại"] ||
                ""
              );
            }

            // Địa chỉ
            if (
              contractData.address ||
              contractData["Địa Chỉ"] ||
              contractData["Địa chỉ"]
            ) {
              setDiaChi(
                contractData.address ||
                contractData["Địa Chỉ"] ||
                contractData["Địa chỉ"] ||
                ""
              );
            }

            // Loại xe
            if (
              contractData.dongXe ||
              contractData.model ||
              contractData["Dòng xe"]
            ) {
              setLoaiXe(
                contractData.dongXe ||
                contractData.model ||
                contractData["Dòng xe"] ||
                ""
              );
            }

            // Màu xe (ngoại thất/nội thất) - chuyển từ mã sang tên
            if (
              contractData.ngoaiThat ||
              contractData["Ngoại Thất"] ||
              contractData.exterior
            ) {
              const ngoaiThatCode =
                contractData.ngoaiThat ||
                contractData["Ngoại Thất"] ||
                contractData.exterior ||
                "";
              const noiThatCode =
                contractData.noiThat ||
                contractData["Nội Thất"] ||
                contractData.interior ||
                "";

              const ngoaiThatName = getColorName(ngoaiThatCode, true);
              const noiThatName = getColorName(noiThatCode, false);

              if (noiThatName && noiThatName !== noiThatCode) {
                setMauXe(
                  `${ngoaiThatName.toUpperCase()}/${noiThatName.toUpperCase()}`
                );
              } else if (noiThatCode) {
                // Nếu có nội thất nhưng không tìm thấy tên, giữ nguyên
                setMauXe(
                  `${ngoaiThatName.toUpperCase()}/${noiThatCode.toUpperCase()}`
                );
              } else {
                setMauXe(ngoaiThatName.toUpperCase());
              }
            }

            // Số khung
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

            // Năm sản xuất
            if (
              contractData.namSanXuat ||
              contractData["Năm sản xuất"] ||
              contractData.year
            ) {
              setNamSanXuat(
                contractData.namSanXuat ||
                contractData["Năm sản xuất"] ||
                contractData.year ||
                ""
              );
            }

            // Giá niêm yết
            if (contractData.giaNiemYet || contractData["Giá Niêm Yết"]) {
              const gia =
                contractData.giaNiemYet || contractData["Giá Niêm Yết"] || "";
              if (gia) {
                setGiaNiemYet(formatCurrency(gia.toString()));
              }
            }

            // Giảm giá
            if (contractData.giaGiam || contractData["Giá Giảm"]) {
              const giam =
                contractData.giaGiam || contractData["Giá Giảm"] || "";
              if (giam) {
                setGiamGia(formatCurrency(giam.toString()));
              }
            }

            // Giá bán hợp đồng
            if (
              contractData.giaHopDong ||
              contractData["Giá Hợp Đồng"] ||
              contractData.contractPrice ||
              contractData.giaHD
            ) {
              const giaHD =
                contractData.giaHopDong ||
                contractData["Giá Hợp Đồng"] ||
                contractData.contractPrice ||
                contractData.giaHD ||
                "";
              if (giaHD) {
                setGiaBanHopDong(formatCurrency(giaHD.toString()));
              }
            }

            // Ngân hàng
            if (
              contractData.nganHang ||
              contractData.bank ||
              contractData["ngân hàng"]
            ) {
              setNganHang(
                contractData.nganHang ||
                contractData.bank ||
                contractData["ngân hàng"] ||
                ""
              );
            }

            // Quà tặng theo xe - luôn set giá trị từ Firebase
            const quaTangValue =
              contractData.quaTang ||
              contractData["Quà tặng"] ||
              contractData["quà tặng"] ||
              contractData.quaTangTheoXe ||
              contractData["quà tặng theo xe"] ||
              "";
            // Chỉ dùng giá trị mặc định nếu không có dữ liệu nào trong Firebase
            if (quaTangValue) {
              setQuaTangTheoXe(quaTangValue);
            } else {
              // Nếu không có dữ liệu, để trống thay vì dùng giá trị mặc định   
              setQuaTangTheoXe("");
            }

            // Quà tặng khác - luôn set giá trị từ Firebase, không có giá trị mặc định
            const quaTangKhacValue =
              contractData.quaTangKhac ||
              contractData["Quà tặng khác"] ||
              contractData["quà tặng khác"] ||
              "";
            setQuaTangKhac(quaTangKhacValue);

            // Ưu đãi / Chính sách khuyến mãi
            const uuDaiValue =
              contractData.uuDai ||
              contractData["Ưu đãi"] ||
              contractData["ưu đãi"] ||
              "";
            if (uuDaiValue) {
              const formattedUuDai = formatUuDaiForTextarea(uuDaiValue);
              if (formattedUuDai) {
                setChinhSachKhuyenMai(formattedUuDai);
              }
            }

            // Số tiền đặt cọc
            if (
              contractData.tienDatCoc ||
              contractData["Tiền đặt cọc"] ||
              contractData.soTienCoc ||
              contractData.deposit
            ) {
              const tienCoc =
                contractData.tienDatCoc ||
                contractData["Tiền đặt cọc"] ||
                contractData.soTienCoc ||
                contractData.deposit ||
                "";
              setSoTienDatCoc(tienCoc.toString());
            }

            // Trả góp (tiền vay ngân hàng)
            if (
              contractData.tienVayNganHang ||
              contractData["Tiền vay ngân hàng"] ||
              contractData.loanAmount ||
              contractData["Tiền vay"]
            ) {
              const tienVay =
                contractData.tienVayNganHang ||
                contractData["Tiền vay ngân hàng"] ||
                contractData.loanAmount ||
                contractData["Tiền vay"] ||
                "";
              if (tienVay) {
                setTraGop(formatCurrency(tienVay.toString()));
              }
            }
          }
        } catch (error) {
          console.error(
            "Error loading contract data from exportedContracts:",
            error
          );
        }
      }

      const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
      setBranch(branchInfo);

      const today = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      setNgay(pad(today.getDate()));
      setThang(pad(today.getMonth() + 1));
      setNam(today.getFullYear().toString());

      if (location.state) {
        const stateData = location.state;
        setData(stateData);

        if (stateData.customerName || stateData.tenKh) setKhachHang(stateData.customerName || stateData.tenKh);
        if (stateData.contractNumber || stateData.vso) setSoHopDong(stateData.contractNumber || stateData.vso);
        if (stateData.contractDate) setNgayHopDong(stateData.contractDate);
        if (stateData.customerAddress || stateData.diaChi || stateData.address) setDiaChi(stateData.customerAddress || stateData.diaChi || stateData.address);
        if (stateData.customerPhone || stateData.soDienThoai || stateData.phone) setDienThoai(stateData.customerPhone || stateData.soDienThoai || stateData.phone);
        if (stateData.customerCCCD) setCccd(stateData.customerCCCD);
        if (stateData.hieuxe || stateData.model || stateData.dongXe) setLoaiXe(stateData.hieuxe || stateData.model || stateData.dongXe);
        if (stateData.soKhung) setSoKhung(stateData.soKhung);
        if (stateData.namSanXuat || stateData.year) {
          setNamSanXuat(stateData.namSanXuat || stateData.year);
        }
        if (stateData.contractPrice)
          setGiaBanHopDong(formatCurrency(stateData.contractPrice));

        // Ưu đãi / Chính sách khuyến mãi từ location.state
        const stateUuDai =
          stateData.uuDai || stateData["Ưu đãi"] || stateData["ưu đãi"] || "";
        if (stateUuDai) {
          const formattedUuDai = formatUuDaiForTextarea(stateUuDai);
          if (formattedUuDai) {
            setChinhSachKhuyenMai(formattedUuDai);
          }
        }
      } else {
        setData({
          contractNumber: "",
          contractDate: "",
          customerName: "",
          customerAddress: "",
          customerPhone: "",
          customerCCCD: "",
          hieuxe: "",
          soKhung: "",
          contractPrice: "",
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
      <PrintStyles />
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          /* Full trang A4: dùng hết diện tích in */
          #printable-content.de-xuat-gia-ban-print {
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: 281mm !important;
            height: auto !important;
            overflow: hidden !important;
            padding: 0 5mm 5mm !important;
            box-sizing: border-box !important;
            font-size: 15px !important;
          }
          /* Font và bảng rõ, full trang */
          #printable-content.de-xuat-gia-ban-print .text-xs {
            font-size: 13px !important;
          }
          #printable-content.de-xuat-gia-ban-print .text-sm {
            font-size: 14px !important;
          }
          #printable-content.de-xuat-gia-ban-print .text-lg {
            font-size: 19px !important;
          }
          #printable-content.de-xuat-gia-ban-print table.border-table td:not(.signature-empty-cell),
          #printable-content.de-xuat-gia-ban-print table.border-table th {
            padding: 8px 12px !important;
          }
          /* Không thu nhỏ: nội dung full 100% trang */
          #printable-content.de-xuat-gia-ban-print .de-xuat-gia-ban-print-inner {
            width: 100% !important;
            max-width: none !important;
            transform: none !important;
            transform-origin: top left !important;
          }
          /* Giảm chiều cao hàng tiêu đề chữ ký, giữ nguyên hàng ô trống dưới cùng */
          #printable-content.de-xuat-gia-ban-print .signature-block {
            min-height: 0 !important;
            margin-top: 6px !important;
          }
          #printable-content.de-xuat-gia-ban-print .signature-block .signer-title {
            margin-bottom: 4px !important;
          }
          #printable-content.de-xuat-gia-ban-print .signature-block td {
            padding: 4px 8px !important;
          }
        }
      `}</style>
      <style>{`
        /* Áp dụng cả màn hình: giảm độ rộng hàng tiêu đề chữ ký */
        #printable-content.de-xuat-gia-ban-print .signature-block {
          min-height: 0;
          margin-top: 6px;
        }
        #printable-content.de-xuat-gia-ban-print .signature-block .signer-title {
          margin-bottom: 4px;
        }
        #printable-content.de-xuat-gia-ban-print .signature-block td {
          padding: 4px 8px;
        }
      `}</style>
      <div className="max-w-5xl mx-auto print:max-w-full">
        <div
          ref={printableRef}
          className="flex-1 bg-white p-6 print:pt-0 flex flex-col min-h-screen print:min-h-0 de-xuat-gia-ban-print"
          id="printable-content"
        >
          <div className="de-xuat-gia-ban-print-inner">
            <div className="flex items-start justify-between mb-4">
              {/* Logo */}
              <div className="w-16">
                <img src={VinfastLogo} alt="VinFast Logo" className="w-16 h-16" />
              </div>

              {/* Company Info */}
              <div className="flex-1 text-center">
                <p className="font-bold text-sm">
                  {branch ? (
                    branch.shortName === "Thủ Đức"
                      ? "CÔNG TY CPĐT VÀ TMDV Ô TÔ ĐÔNG SÀI GÒN"
                      : `CN ${branch.shortName.toUpperCase()}-CÔNG TY CPĐT VÀ TMDV Ô TÔ ĐÔNG SÀI GÒN`
                  ) : "[Chưa chọn showroom]"}
                </p>
                <h1 className="font-bold text-lg mt-2 uppercase">ĐỀ XUẤT GIÁ BÁN XE</h1>
              </div>

              {/* Date */}
              <div className="w-48 text-right text-sm italic">
                <p>
                  Ngày{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={ngay}
                      onChange={(e) => setNgay(e.target.value)}
                      className="border-b border-gray-400 px-1 w-6 text-center focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{ngay}</span> tháng{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={thang}
                      onChange={(e) => setThang(e.target.value)}
                      className="border-b border-gray-400 px-1 w-6 text-center focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{thang}</span> Năm{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={nam}
                      onChange={(e) => setNam(e.target.value)}
                      className="border-b border-gray-400 px-1 w-12 text-center focus:outline-none focus:border-blue-500"
                    />
                  </span>
                  <span className="hidden print:inline">{nam}</span>
                </p>
              </div>
            </div>

            {/* Bảng 1: Thông tin khách hàng và hợp đồng */}
            <div className="text-xs">
              <table className="w-full border border-black border-table">
                <tbody>
                  {/* Hàng 1: Tư vấn bán hàng và Số hợp đồng, Ngày hợp đồng */}
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1 font-bold w-1/2">
                      TƯ VẤN BÁN HÀNG:{" "}
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={tuVanBanHang}
                          onChange={(e) => setTuVanBanHang(e.target.value)}
                          className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{tuVanBanHang}</span>
                    </td>
                    <td className="p-1 w-1/2">
                      <div className="space-y-1">
                        <div className="info-row !grid-cols-[100px_1fr]">
                          <strong className="info-label w-[100px]">Số Hợp đồng:</strong>{" "}
                          <div className="info-value">
                            <span className="print:hidden font-bold">
                              <input
                                type="text"
                                value={soHopDong}
                                onChange={(e) => setSoHopDong(e.target.value)}
                                className="border-b border-gray-400 px-1 w-40 font-bold focus:outline-none focus:border-blue-500"
                              />
                            </span>
                            <span className="hidden print:inline font-bold">{soHopDong}</span>
                          </div>
                        </div>
                        <div className="info-row !grid-cols-[100px_1fr]">
                          <strong className="info-label w-[100px]">Ngày Hợp đồng:</strong>{" "}
                          <div className="info-value">
                            <span className="print:hidden font-bold">
                              <input
                                type="text"
                                value={ngayHopDong}
                                onChange={(e) => setNgayHopDong(e.target.value)}
                                className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                              />
                            </span>
                            <span className="hidden print:inline font-bold">
                              {ngayHopDong}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Hàng 2: Khách hàng và CCCD, Mã số thuế, Điện thoại */}
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1 font-bold w-1/2">
                      KHÁCH HÀNG (Cá nhân/ Cty):{" "}
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={khachHang}
                          onChange={(e) => setKhachHang(e.target.value)}
                          className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{khachHang}</span>
                    </td>
                    <td className="p-1 w-1/2">
                      <div className="space-y-1">
                        <div className="info-row !grid-cols-[100px_1fr]">
                          <strong className="info-label w-[100px]">CCCD (Cá nhân):</strong>{" "}
                          <div className="info-value">
                            <span className="print:hidden font-bold">
                              <input
                                type="text"
                                value={cccd}
                                onChange={(e) => setCccd(e.target.value)}
                                className="border-b border-gray-400 px-1 w-40 focus:outline-none focus:border-blue-500"
                              />
                            </span>
                            <span className="hidden print:inline font-bold">{cccd}</span>
                          </div>
                        </div>
                        <div className="info-row !grid-cols-[100px_1fr]">
                          <strong className="info-label w-[100px]">Mã số thuế (Cty):</strong>{" "}
                          <div className="info-value">
                            <span className="print:hidden font-bold">
                              <input
                                type="text"
                                value={maSoThue}
                                onChange={(e) => setMaSoThue(e.target.value)}
                                className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                              />
                            </span>
                            <span className="hidden print:inline font-bold">{maSoThue}</span>
                          </div>
                        </div>
                        <div className="info-row !grid-cols-[100px_1fr]">
                          <strong className="info-label w-[100px]">Điện thoại:</strong>{" "}
                          <div className="info-value">
                            <span className="print:hidden font-bold">
                              <input
                                type="text"
                                value={dienThoai}
                                onChange={(e) => setDienThoai(e.target.value)}
                                className="border-b border-gray-400 px-1 w-40 focus:outline-none focus:border-blue-500"
                              />
                            </span>
                            <span className="hidden print:inline font-bold">{dienThoai}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Hàng 3: Địa chỉ */}
                  <tr className="border-b border-black">
                    <td
                      className="border-r border-black p-1 font-bold"
                      colSpan={2}
                    >
                      ĐỊA CHỈ (địa chỉ khớp với thông tin Xuất hoá đơn):{" "}
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={diaChi}
                          onChange={(e) => setDiaChi(e.target.value)}
                          className="border-b border-gray-400 px-1 w-[70%] focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{diaChi}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bảng 2: Thông tin xe, đối tượng khách hàng, giá bán, quà tặng, thanh toán */}
            <div className="text-xs">
              <table className="w-full border-x border-black border-table">
                <tbody>
                  {/* Thông tin xe */}
                  <tr className="border-b border-black">
                    <td
                      className="border-r border-black p-1 font-bold align-middle text-center"
                      rowSpan={4}
                    >
                      THÔNG TIN XE:
                    </td>
                    <td className="border-r border-black p-1 font-bold" colSpan={3}>
                      <div className="info-row !grid-cols-[120px_1fr]">
                        <strong className="info-label w-[120px]">Loại xe:</strong>{" "}
                        <div className="info-value">
                          <span className="print:hidden">
                            <input
                              type="text"
                              value={loaiXe}
                              onChange={(e) => setLoaiXe(e.target.value)}
                              className="border-b border-gray-400 px-1 w-64 focus:outline-none focus:border-blue-500"
                            />
                          </span>
                          <span className="hidden print:inline">{loaiXe}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1 font-bold" colSpan={3}>
                      <div className="info-row !grid-cols-[120px_1fr]">
                        <strong className="info-label w-[120px]">Màu xe (ngoại/nội):</strong>{" "}
                        <div className="info-value">
                          <span className="print:hidden">
                            <input
                              type="text"
                              value={mauXe}
                              onChange={(e) => setMauXe(e.target.value)}
                              className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                            />
                          </span>
                          <span className="hidden print:inline">{mauXe}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1" colSpan={3}>
                      <div className="info-row !grid-cols-[120px_1fr]">
                        <strong className="info-label w-[120px]">Năm sản xuất:</strong>{" "}
                        <div className="info-value">
                          <span className="print:hidden">
                            <input
                              type="text"
                              value={namSanXuat}
                              onChange={(e) => setNamSanXuat(e.target.value)}
                              className="border-b border-gray-400 font-bold px-1 w-64 focus:outline-none focus:border-blue-500"
                            />
                          </span>
                          <span className="hidden print:inline font-bold">{namSanXuat}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1" colSpan={3}>
                      <div className="info-row !grid-cols-[120px_1fr]">
                        <strong className="info-label w-[120px]">Số khung (VIN):</strong>{" "}
                        <div className="info-value">
                          <span className="print:hidden">
                            <input
                              type="text"
                              value={soKhung}
                              onChange={(e) => setSoKhung(e.target.value)}
                              className="border-b border-gray-400 font-bold px-1 w-64 focus:outline-none focus:border-blue-500"
                            />
                          </span>
                          <span className="hidden print:inline font-bold">{soKhung}</span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Đối tượng khách hàng */}
                  <tr className="border-b border-black">
                    <td
                      className="border-r border-black p-1 font-bold align-middle text-center"
                      rowSpan={5}
                    >
                      ĐỐI TƯỢNG
                      <br />
                      KHÁCH HÀNG
                    </td>
                    <td className="border-r border-black font-bold p-1 w-32 ">
                      1. Thông thường
                    </td>
                    <td className="border-r border-black p-1 text-center w-20 font-bold">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={thong}
                          onChange={(e) => setThong(e.target.value)}
                          className="border-b border-gray-400 px-1 w-16 text-center focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{thong}</span>
                    </td>
                    <td className="p-1" rowSpan={5}>
                      <div className="flex flex-col h-full">
                        <strong className="ml-4 mb-2">Chính sách ưu đãi theo đối tượng:</strong>
                        <span className="print:hidden ml-4">
                          <textarea
                            value={chinhSachKhuyenMai}
                            onChange={(e) => setChinhSachKhuyenMai(e.target.value)}
                            className="border border-gray-400 px-1 w-[95%] h-20 font-bold focus:outline-none focus:border-blue-500"
                          />
                        </span>
                        <div className="hidden print:inline font-bold ml-4 mt-1 leading-relaxed policy-content">
                          {formatTextWithNonBreakingCommas(chinhSachKhuyenMai)}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-black font-bold">
                    <td className="border-r border-black p-1">2. Corporate</td>
                    <td className="border-r border-black p-1 text-center">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={corporate}
                          onChange={(e) => setCorporate(e.target.value)}
                          className="border-b border-gray-400 px-1 w-16 text-center focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{corporate}</span>
                    </td>
                  </tr>
                  <tr className="border-b border-black font-bold">
                    <td className="border-r border-black p-1">3. VinClub</td>
                    <td className="border-r border-black p-1 text-center">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={vinClub}
                          onChange={(e) => setVinClub(e.target.value)}
                          className="border-b border-gray-400 px-1 w-16 text-center focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{vinClub}</span>
                    </td>
                  </tr>
                  <tr className="border-b border-black font-bold">
                    <td className="border-r border-black p-1">4. Bán buôn</td>
                    <td className="border-r border-black p-1 text-center">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={banBuon}
                          onChange={(e) => setBanBuon(e.target.value)}
                          className="border-b border-gray-400 px-1 w-16 text-center focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{banBuon}</span>
                    </td>
                  </tr>
                  <tr className="border-b border-black font-bold">
                    <td className="border-r border-black p-1">5. Xăng - Điện</td>
                    <td className="border-r border-black p-1 text-center">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={xang}
                          onChange={(e) => setXang(e.target.value)}
                          className="border-b border-gray-400 px-1 w-16 text-center focus:outline-none focus:border-blue-500"
                        />
                      </span>
                      <span className="hidden print:inline">{xang}</span>
                    </td>
                  </tr>

                  {/* Giá bán */}
                  <tr className="border-b border-black font-bold">
                    <td
                      className="border-r border-black p-1 font-bold align-middle w-32 text-center"
                      rowSpan={3}
                    >
                      GIÁ BÁN:
                    </td>
                    <td className="border-r border-black p-1" colSpan={3}>
                      <div className="info-row !grid-cols-[150px_1fr]">
                        <strong className="info-label w-[150px]">Giá niêm yết (VNĐ)</strong>{" "}
                        <div className="info-value">
                          <span className="print:hidden">
                            <input
                              type="text"
                              value={giaNiemYet}
                              onChange={(e) =>
                                setGiaNiemYet(e.target.value.replace(/\D/g, ""))
                              }
                              className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                            />
                          </span>
                          <span className="hidden print:inline">
                            {formatCurrency(giaNiemYet)} VNĐ
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-black font-bold">
                    <td className="border-r border-black p-1" colSpan={3}>
                      <div className="info-row !grid-cols-[150px_1fr]">
                        <strong className="info-label w-[150px]">Giảm giá (VNĐ)</strong>{" "}
                        <div className="info-value">
                          <span className="print:hidden">
                            <input
                              type="text"
                              value={giamGia}
                              onChange={(e) =>
                                setGiamGia(e.target.value.replace(/\D/g, ""))
                              }
                              className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                            />
                          </span>
                          <span className="hidden print:inline">
                            {formatCurrency(giamGia)} VNĐ
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-black font-bold">
                    <td className="border-r border-black p-1" colSpan={3}>
                      <div className="info-row !grid-cols-[150px_1fr]">
                        <strong className="info-label w-[150px]">Giá bán hợp đồng (VNĐ)</strong>{" "}
                        <div className="info-value">
                          <span className="print:hidden">
                            <input
                              type="text"
                              value={giaBanHopDong}
                              onChange={(e) =>
                                setGiaBanHopDong(e.target.value.replace(/\D/g, ""))
                              }
                              className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                            />
                          </span>
                          <span className="hidden print:inline">
                            {formatCurrency(giaBanHopDong)} VNĐ
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Diễn giải mức giảm */}
                  <tr className="border-b border-black">
                    <td className="p-1 italic text-xs" colSpan={4}>
                      Diễn giải mức giảm (nếu nằm ngoài khung quy định):
                    </td>
                  </tr>

                  {/* Quà tặng */}
                  <tr className="border-b border-black">
                    <td
                      className="border-r border-black p-1 font-bold align-middle text-center"
                      rowSpan={2}
                    >
                      QUÀ TẶNG
                    </td>
                    <td className="border-r border-black p-1 font-bold" colSpan={3}>
                      <div className="info-row !grid-cols-[120px_1fr]">
                        <strong className="info-label w-[120px]">Quà tặng theo xe:</strong>{" "}
                        <div className="info-value">
                          <span className="print:hidden">
                            <input
                              type="text"
                              value={quaTangTheoXe}
                              onChange={(e) => setQuaTangTheoXe(e.target.value)}
                              className="border-b border-gray-400 px-1 w-[80%] focus:outline-none focus:border-blue-500"
                            />
                          </span>
                          <span className="hidden print:inline">{quaTangTheoXe}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1 font-bold" colSpan={3}>
                      <div className="info-row !grid-cols-[120px_1fr]">
                        <strong className="info-label w-[120px]">Quà tặng khác:</strong>{" "}
                        <div className="info-value">
                          <span className="print:hidden">
                            <input
                              type="text"
                              value={quaTangKhac}
                              onChange={(e) => setQuaTangKhac(e.target.value)}
                              className="border-b border-gray-400 px-1 w-[80%] focus:outline-none focus:border-blue-500"
                            />
                          </span>
                          <span className="hidden print:inline">{quaTangKhac}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bảng 3: Thanh toán */}
            <div className="text-xs">
              <table className="w-full border-x border-b border-black border-table">
                <tbody>
                  {/* Thanh toán */}
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1 font-bold w-32">
                      THANH TOÁN
                    </td>
                    <td className="border-r border-black p-1 font-bold">
                      <div className="info-row !grid-cols-[60px_1fr]">
                        <strong className="info-label w-[60px]">Trả thẳng:</strong>{" "}
                        <div className="info-value print:whitespace-nowrap">
                          <span className="print:hidden">
                            <CurrencyInput
                              value={traThang}
                              onChange={(val) => setTraThang(val)}
                              className="border-b border-gray-400 px-1 w-24 focus:outline-none focus:border-blue-500"
                            />
                          </span>
                          <span className="hidden print:inline">
                            {traThang ? `${formatCurrency(traThang)}` : ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="border-r border-black p-1 font-bold">
                      <div className="info-row !grid-cols-[60px_1fr]">
                        <strong className="info-label w-[60px]">Trả góp:</strong>{" "}
                        <div className="info-value print:whitespace-nowrap">
                          <span className="print:hidden">
                            <CurrencyInput
                              value={traGop}
                              onChange={(val) => setTraGop(val)}
                              className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                            />
                          </span>
                          <span className="hidden print:inline">
                            {traGop ? `${formatCurrency(traGop)}` : ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-1 font-bold">
                      <div className="info-row !grid-cols-[40px_1fr]">
                        <strong className="info-label w-[40px]">Bank:</strong>{" "}
                        <div className="info-value print:whitespace-nowrap">
                          <span className="print:hidden">
                            <input
                              type="text"
                              value={nganHang}
                              onChange={(e) => setNganHang(e.target.value)}
                              className="border-b border-gray-400 px-1 w-24 focus:outline-none focus:border-blue-500"
                            />
                          </span>
                          <span className="hidden print:inline">{nganHang}</span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Số tiền đặt cọc */}
                  <tr className="border-b border-black">
                    <td
                      className="border-r border-black p-1 font-bold"
                      colSpan={2}
                    >
                      <div className="info-row !grid-cols-[100px_1fr]">
                        <span className="info-label w-[100px]">Số tiền Đặt cọc:</span>{" "}
                        <div className="info-value">
                          <span className="print:hidden">
                            <input
                              type="text"
                              value={soTienDatCoc}
                              onChange={(e) => setSoTienDatCoc(e.target.value)}
                              className="border-b border-gray-400 px-1 w-[80%] focus:outline-none focus:border-blue-500"
                            />
                          </span>
                          <span className="hidden print:inline">{soTienDatCoc}</span>
                        </div>
                      </div>
                    </td>
                    <td className="border-r border-black p-1" colSpan={2}>
                      <div className="info-row !grid-cols-[120px_1fr]">
                        <strong className="info-label w-[120px]">Ngày dự kiến nhận xe:</strong>{" "}
                        <div className="info-value">
                          <span className="print:hidden">
                            <input
                              type="date"
                              value={ngayDuKienNhanXe}
                              onChange={(e) => setNgayDuKienNhanXe(e.target.value)}
                              className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                            />
                          </span>
                          <span className="hidden print:inline">
                            {formatDate(ngayDuKienNhanXe)}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bảng 4: Đề xuất lương TVBH và chữ ký */}
            <div className="text-xs">
              <table className="w-full border-x border-b border-black border-table">
                <tbody>
                  {/* Đề xuất lương TVBH */}
                  <tr className="border-b border-black">
                    <td
                      className="border-r border-black p-1 font-bold"
                      rowSpan={2}
                    >
                      Đề xuất Lương TVBH:
                    </td>
                    <td className="border-r border-black p-1" colSpan={3}>
                      <div className="info-row !grid-cols-[150px_1fr]">
                        <strong className="info-label w-[150px]">Theo chính sách khung:</strong>{" "}
                        <div className="info-value">
                          <span className="print:hidden">
                            <input
                              type="text"
                              value={theoChinhSachKhung}
                              onChange={(e) => setTheoChinhSachKhung(e.target.value)}
                              className="border-b border-gray-400 px-1 w-[80%] focus:outline-none focus:border-blue-500"
                            />
                          </span>
                          <span className="hidden print:inline">
                            {theoChinhSachKhung}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1" colSpan={3}>
                      <div className="info-row !grid-cols-[150px_1fr]">
                        <strong className="info-label w-[150px]">Đề xuất:</strong>{" "}
                        <div className="info-value">
                          <span className="print:hidden">
                            <input
                              type="text"
                              value={deXuat}
                              onChange={(e) => setDeXuat(e.target.value)}
                              className="border-b border-gray-400 px-1 w-[91%] focus:outline-none focus:border-blue-500"
                            />
                          </span>
                          <span className="hidden print:inline">{deXuat}</span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Lưu ý */}
                  <tr className="border-b border-black">
                    <td
                      className="p-1 italic text-xs print:font-bold"
                      colSpan={4}
                    >
                      {lyDo}
                    </td>
                  </tr>

                  {/* Signature row */}
                  <tr className="signature-block">
                    <td className="border-r border-black p-2 text-center font-bold">
                      <p className="signer-title">TƯ VẤN BÁN HÀNG</p>
                    </td>
                    <td className="border-r border-black p-2 text-center font-bold">
                      <p className="signer-title">TP KINH DOANH</p>
                    </td>
                    <td className="border-r border-black p-2 text-center font-bold">
                      <p className="signer-title">GĐ KINH DOANH</p>
                    </td>
                    <td className="p-2 text-center font-bold">
                      <p className="signer-title">PHÊ DUYỆT</p>
                    </td>
                  </tr>
                  <tr>
                    <td className="border-r border-black p-12 signature-empty-cell"></td>
                    <td className="border-r border-black p-12 signature-empty-cell"></td>
                    <td className="border-r border-black p-12 signature-empty-cell"></td>
                    <td className="p-12 signature-empty-cell"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center mt-8 print:hidden">
        <p className="text-sm text-gray-500 mb-3">
          Để không in ngày giờ và tên trang (đầu/chân trang), trong hộp thoại in hãy tắt &quot;Đầu trang và chân trang&quot;.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
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
            In Đề Xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeXuatGiaban;
