import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getBranchByShowroomName,
  getDefaultBranch,
} from "../../data/branchData";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import { vndToWords } from "../../utils/vndToWords";
import { formatCurrency, formatDate } from "../../utils/formatting";
import CurrencyInput from "../shared/CurrencyInput";
import { PrintStyles } from "./PrintStyles";
import { downloadElementAsPdf } from "../../utils/pdfExport";

const GiayThoaThuanTraThay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);

  // Editable fields
  const [ngayKy, setNgayKy] = useState("");
  const [thangKy, setThangKy] = useState("");
  const [namKy, setNamKy] = useState("");
  const [nguoiKy, setNguoiKy] = useState("");

  // Company fields
  const [congTy, setCongTy] = useState("");
  const [diaChiTruSo, setDiaChiTruSo] = useState("");
  const [maSoDN, setMaSoDN] = useState("");
  const [taiKhoan, setTaiKhoan] = useState("");
  const [nganHang, setNganHang] = useState("");
  const [daiDien, setDaiDien] = useState("");
  const [chucVu, setChucVu] = useState("");
  const [soGiayUyQuyen, setSoGiayUyQuyen] = useState("");
  const [ngayUyQuyen, setNgayUyQuyen] = useState("");

  // Customer fields
  const [tenKH, setTenKH] = useState("");
  const [diaChiKH, setDiaChiKH] = useState("");
  const [dienThoaiKH, setDienThoaiKH] = useState("");
  const [maSoThueKH, setMaSoThueKH] = useState("");
  const [soCCCDKH, setSoCCCDKH] = useState("");
  const [ngayCapKH, setNgayCapKH] = useState("");
  const [noiCapKH, setNoiCapKH] = useState("");

  // Spouse fields
  const [coVoChong, setCoVoChong] = useState(false);
  const [tenVoChong, setTenVoChong] = useState("");
  const [diaChiVoChong, setDiaChiVoChong] = useState("");
  const [dienThoaiVoChong, setDienThoaiVoChong] = useState("");
  const [maSoThueVoChong, setMaSoThueVoChong] = useState("");
  const [soCCCDVoChong, setSoCCCDVoChong] = useState("");
  const [ngayCapVoChong, setNgayCapVoChong] = useState("");
  const [noiCapVoChong, setNoiCapVoChong] = useState("");

  // Contract and car fields
  const [soHopDong, setSoHopDong] = useState("");
  const [modelXe, setModelXe] = useState("");
  const [soKhung, setSoKhung] = useState("");
  const [soMay, setSoMay] = useState("");
  const [giaTriXe, setGiaTriXe] = useState("");

  // Loan fields
  const [soTienVay, setSoTienVay] = useState("");
  const [soTienVayBangChu, setSoTienVayBangChu] = useState("");
  const [tyLeVay, setTyLeVay] = useState("");
  const [laiSuat, setLaiSuat] = useState("");
  const [bienDo, setBienDo] = useState("");

  // Date fields for policy
  const [ngayBatDauChinhSach, setNgayBatDauChinhSach] = useState("13/09/2025");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const incoming = location.state || {};
      const firebaseKey = incoming.firebaseKey;

      // Load from Firebase if firebaseKey exists
      let contractData = null;
      if (firebaseKey) {
        try {
          // Thử exportedContracts trước
          let contractRef = ref(database, `exportedContracts/${firebaseKey}`);
          let snapshot = await get(contractRef);

          // Nếu không có trong exportedContracts, thử contracts
          if (!snapshot.exists()) {
            contractRef = ref(database, `contracts/${firebaseKey}`);
            snapshot = await get(contractRef);
          }

          if (snapshot.exists()) {
            contractData = { ...snapshot.val(), firebaseKey };
          }
        } catch (error) {
          console.error("Error loading contract from Firebase:", error);
        }
      }

      // Get branch info - ưu tiên từ contractData, sau đó mới từ incoming      
      let showroomName = "";
      if (contractData && contractData.showroom) {
        showroomName = contractData.showroom;
      } else {
        showroomName = incoming.showroom || incoming["Showroom"] || incoming.showroomName || "";
      }

      const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
      setBranch(branchInfo);

      if (contractData || Object.keys(incoming).length > 0) {
        const dataSource = contractData || incoming;

        // Set default date
        const today = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        setNgayKy(pad(today.getDate()));
        setThangKy(pad(today.getMonth() + 1));
        setNamKy(today.getFullYear().toString());

        // Company info
        if (branchInfo) {
          setCongTy(
            `Công ty Cổ phần Đầu tư Thương mại và Dịch vụ Ô tô Đông Sài Gòn - Chi nhánh ${branchInfo.shortName.toUpperCase()}`
          );
          setDiaChiTruSo(branchInfo.address);
          setMaSoDN(branchInfo.taxCode || "");
          setTaiKhoan(branchInfo.bankAccount || "");
          setNganHang(branchInfo.bankName || "");
          setDaiDien(branchInfo.representativeName || "");
          setChucVu(branchInfo.position || "");
        }

        // Customer info
        setTenKH(
          dataSource.customerName ||
          dataSource["Tên KH"] ||
          dataSource["Tên Kh"] ||
          ""
        );
        setDiaChiKH(
          dataSource.address || dataSource["Địa Chỉ"] || dataSource.diaChi || ""
        );
        setDienThoaiKH(
          dataSource.phone ||
          dataSource["Số Điện Thoại"] ||
          dataSource.soDienThoai ||
          ""
        );
        setMaSoThueKH(dataSource.maSoThue || dataSource["Mã Số Thuế"] || "");
        setSoCCCDKH(
          dataSource.cccd || dataSource.CCCD || dataSource["CCCD"] || ""
        );
        setNgayCapKH(
          dataSource.issueDate ||
          dataSource.ngayCap ||
          dataSource["Ngày Cấp"] ||
          ""
        );
        setNoiCapKH(
          dataSource.issuePlace ||
          dataSource.noiCap ||
          dataSource["Nơi Cấp"] ||
          ""
        );

        // Spouse info (if available)
        const hasSpouseData =
          dataSource.tenVoChong ||
          dataSource["Tên Vợ/Chồng"] ||
          dataSource.diaChiVoChong ||
          dataSource["Địa Chỉ Vợ/Chồng"] ||
          dataSource.cccdVoChong ||
          dataSource["CCCD Vợ/Chồng"];
        setCoVoChong(!!hasSpouseData);
        setTenVoChong(
          dataSource.tenVoChong || dataSource["Tên Vợ/Chồng"] || ""
        );
        setDiaChiVoChong(
          dataSource.diaChiVoChong || dataSource["Địa Chỉ Vợ/Chồng"] || ""
        );
        setDienThoaiVoChong(
          dataSource.dienThoaiVoChong || dataSource["Điện Thoại Vợ/Chồng"] || ""
        );
        setMaSoThueVoChong(
          dataSource.maSoThueVoChong || dataSource["Mã Số Thuế Vợ/Chồng"] || ""
        );
        setSoCCCDVoChong(
          dataSource.cccdVoChong || dataSource["CCCD Vợ/Chồng"] || ""
        );
        setNgayCapVoChong(
          dataSource.ngayCapVoChong || dataSource["Ngày Cấp Vợ/Chồng"] || ""
        );
        setNoiCapVoChong(
          dataSource.noiCapVoChong || dataSource["Nơi Cấp Vợ/Chồng"] || ""
        );

        // Contract info
        setSoHopDong(
          dataSource.vso || dataSource["VSO"] || dataSource.soHopDong || ""
        );
        setModelXe(
          dataSource.model || dataSource.dongXe || dataSource["Dòng xe"] || ""
        );
        setSoKhung(
          dataSource.soKhung ||
          dataSource["Số Khung"] ||
          dataSource.chassisNumber ||
          ""
        );
        setSoMay(
          dataSource.soMay ||
          dataSource["Số Máy"] ||
          dataSource.engineNumber ||
          ""
        );
        const giaTri =
          dataSource.contractPrice ||
          dataSource.giaHD ||
          dataSource["Giá Hợp Đồng"] ||
          dataSource["Giá Niêm Yết"] ||
          "";
        setGiaTriXe(giaTri);

        // Loan info
        const loanAmount =
          dataSource.soTienVay ||
          dataSource["Số Tiền Vay"] ||
          dataSource.loanAmount ||
          "";
        if (loanAmount) {
          const loanValue =
            typeof loanAmount === "string"
              ? loanAmount.replace(/\D/g, "")
              : String(loanAmount);
          setSoTienVay(loanValue);
          // Tự động chuyển sang chữ nếu chưa có
          if (
            !dataSource.soTienVayBangChu &&
            !dataSource["Số Tiền Vay Bằng Chữ"]
          ) {
            setSoTienVayBangChu(vndToWords(loanValue));
          } else {
            setSoTienVayBangChu(
              dataSource.soTienVayBangChu ||
              dataSource["Số Tiền Vay Bằng Chữ"] ||
              ""
            );
          }
        }
        setTyLeVay(
          dataSource.tyLeVay ||
          dataSource["Tỷ Lệ Vay"] ||
          dataSource.loanRatio ||
          ""
        );
        setLaiSuat(
          dataSource.laiSuat ||
          dataSource["Lãi Suất"] ||
          dataSource.interestRate ||
          ""
        );
        setBienDo(
          dataSource.bienDo || dataSource["Biên Độ"] || dataSource.margin || ""
        );

        setData({
          loaded: true,
        });
      } else {
        // Default data
        const today = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        setNgayKy(pad(today.getDate()));
        setThangKy(pad(today.getMonth() + 1));
        setNamKy(today.getFullYear().toString());

        if (branchInfo) {
          setCongTy(
            `Công ty Cổ phần Đầu tư Thương mại và Dịch vụ Ô tô Đông Sài Gòn - Chi nhánh ${branchInfo.shortName.toUpperCase()}`
          );
          setDiaChiTruSo(branchInfo.address);
          setMaSoDN(branchInfo.taxCode || "");
          setTaiKhoan(branchInfo.bankAccount || "");
          setNganHang(branchInfo.bankName || "");
          setDaiDien(branchInfo.representativeName || "");
          setChucVu(branchInfo.position || "");
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
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
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
      <div className="flex gap-6 max-w-4xl mx-auto print:max-w-4xl print:mx-auto">
        <div ref={printableRef} className="flex-1 bg-white p-8" id="printable-content">
          {/* Title */}
          <div className="text-center mb-2">
            <h1 className="text-xl font-bold uppercase mb-4">
              THỎA THUẬN HỖ TRỢ TRẢ THAY
            </h1>
          </div>

          {/* Introduction */}
          <div className="text-sm mb-2 leading-relaxed text-center">
            <p>
              Thỏa thuận hỗ trợ trả thay ("<strong>Thỏa Thuận</strong>") này
              được ký ngày
              <span className="print:hidden">
                <input
                  type="text"
                  value={ngayKy}
                  onChange={(e) => setNgayKy(e.target.value)}
                  className="border-b border-gray-400 px-1 py-0 text-sm w-12 text-center focus:outline-none focus:border-blue-500"
                  placeholder="__"
                />
              </span>
              <span className="hidden print:inline mx-1">
                {ngayKy || "____"}
              </span>
              tháng
              <span className="print:hidden">
                <input
                  type="text"
                  value={thangKy}
                  onChange={(e) => setThangKy(e.target.value)}
                  className="border-b border-gray-400 px-1 py-0 text-sm w-12 text-center focus:outline-none focus:border-blue-500"
                  placeholder="__"
                />
              </span>
              <span className="hidden print:inline mx-1">
                {thangKy || "____"}
              </span>
              năm
              <span className="print:hidden">
                <input
                  type="text"
                  value={namKy}
                  onChange={(e) => setNamKy(e.target.value)}
                  className="border-b border-gray-400 px-1 py-0 text-sm w-16 text-center focus:outline-none focus:border-blue-500"
                  placeholder="____"
                />
              </span>
              <span className="hidden print:inline mx-1">
                {namKy || "____"}
              </span>
              bởi và giữa:
            </p>
          </div>

          {/* Company Section */}
          <div className="mb-2">
            {branch ? (
              <>
                <h2 className="text-base font-bold uppercase mb-3">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={congTy}
                      onChange={(e) => setCongTy(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 uppercase text-sm w-full ml-2 focus:outline-none focus:border-blue-500"
                      placeholder="Nhập tên công ty"
                    />
                  </span>
                  <span className="hidden print:inline ml-2">{congTy || ""}</span>
                </h2>
                <div className="text-sm space-y-1">
                  <div className="info-row">
                    <span className="info-label">Địa chỉ trụ sở chính:</span>
                    <div className="info-value">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={diaChiTruSo}
                          onChange={(e) => setDiaChiTruSo(e.target.value)}
                          className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                          placeholder="Nhập địa chỉ"
                        />
                      </span>
                      <span className="hidden print:inline">
                        {diaChiTruSo || "______"}
                      </span>
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Mã số doanh nghiệp:</span>
                    <div className="info-value">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={maSoDN}
                          onChange={(e) => setMaSoDN(e.target.value)}
                          className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                          placeholder="Nhập mã số doanh nghiệp"
                        />
                      </span>
                      <span className="hidden print:inline">
                        {maSoDN || "______"}
                      </span>
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Tài khoản:</span>
                    <div className="info-value">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={taiKhoan}
                          onChange={(e) => setTaiKhoan(e.target.value)}
                          className="border-b border-gray-400 px-1 py-0 text-sm w-32 focus:outline-none focus:border-blue-500"
                          placeholder="____"
                        />
                      </span>
                      <span className="hidden print:inline mx-1">
                        {taiKhoan || "____"}
                      </span>
                      tại Ngân hàng
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={nganHang}
                          onChange={(e) => setNganHang(e.target.value)}
                          className="border-b border-gray-400 px-1 py-0 text-sm w-32 focus:outline-none focus:border-blue-500"
                          placeholder="____"
                        />
                      </span>
                      <span className="hidden print:inline mx-1">
                        {nganHang || "____"}
                      </span>
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Đại diện:</span>
                    <div className="info-value">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={daiDien}
                          onChange={(e) => setDaiDien(e.target.value)}
                          className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
                          placeholder="Nhập tên đại diện"
                        />
                      </span>
                      <span className="hidden print:inline">
                        {daiDien || "______"}
                      </span>
                      <span className=" ml-4 font-bold">Chức vụ:</span>
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={chucVu}
                          onChange={(e) => setChucVu(e.target.value)}
                          className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
                          placeholder="Nhập chức vụ"
                        />
                      </span>
                      <span className="hidden print:inline ml-2">
                        {chucVu || "______"}
                      </span>
                    </div>
                  </div>
                  <div>
                    (Theo Giấy uỷ quyền số
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={soGiayUyQuyen}
                        onChange={(e) => setSoGiayUyQuyen(e.target.value)}
                        className="border-b border-gray-400 px-1 py-0 text-xs w-24 focus:outline-none focus:border-blue-500"
                        placeholder="____"
                      />
                    </span>
                    <span className="hidden print:inline mx-1">
                      {soGiayUyQuyen || "____"}
                    </span>
                    ngày
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={ngayUyQuyen}
                        onChange={(e) => setNgayUyQuyen(e.target.value)}
                        className="border-b border-gray-400 px-1 py-0 text-xs w-24 focus:outline-none focus:border-blue-500"
                        placeholder="____"
                      />
                    </span>
                    <span className="hidden print:inline mx-1">
                      {ngayUyQuyen || "____"}
                    </span>
                    )
                  </div>
                  <p className="font-bold">(Bên bán)</p>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-sm">
                [Chưa chọn showroom - Thông tin công ty sẽ hiển thị khi chọn showroom]
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="text-left mb-2">
            <p className="text-base font-bold">VÀ</p>
          </div>

          {/* Customer Section */}
          <div className="mb-2">
            <h2 className="text-base font-bold mb-3">
              Ông/Bà
              <span className="print:hidden">
                <input
                  type="text"
                  value={tenKH}
                  onChange={(e) => setTenKH(e.target.value)}
                  className="border-b border-gray-400 px-2 py-1 text-sm w-64 ml-2 focus:outline-none focus:border-blue-500"
                  placeholder="Nhập tên khách hàng"
                />
              </span>
              <span className="hidden print:inline ml-2">
                {tenKH || "______"}
              </span>
            </h2>
            <div className="text-sm space-y-1">
              <div className="info-row">
                <span className="info-label">Địa chỉ:</span>
                <div className="info-value">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={diaChiKH}
                      onChange={(e) => setDiaChiKH(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                      placeholder="Nhập địa chỉ"
                    />
                  </span>
                  <span className="hidden print:inline">
                    {diaChiKH || "______"}
                  </span>
                </div>
              </div>
              <div className="info-row">
                <span className="info-label">Điện thoại:</span>
                <div className="info-value">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={dienThoaiKH}
                      onChange={(e) => setDienThoaiKH(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                      placeholder="Nhập số điện thoại"
                    />
                  </span>
                  <span className="hidden print:inline">
                    {dienThoaiKH || "______"}
                  </span>
                </div>
              </div>
              <div className="info-row">
                <span className="info-label">Mã số thuế:</span>
                <div className="info-value">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={maSoThueKH}
                      onChange={(e) => setMaSoThueKH(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                      placeholder="Nhập mã số thuế"
                    />
                  </span>
                  <span className="hidden print:inline">
                    {maSoThueKH || "______"}
                  </span>
                </div>
              </div>
              <div className="info-row">
                <span className="info-label">CCCD/Hộ chiếu:</span>
                <div className="info-value">
                  Số
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={soCCCDKH}
                      onChange={(e) => setSoCCCDKH(e.target.value)}
                      className="border-b border-gray-400 px-1 py-0 text-sm w-32 focus:outline-none focus:border-blue-500"
                      placeholder="____"
                    />
                  </span>
                  <span className="hidden print:inline mx-1">
                    {soCCCDKH || "____"}
                  </span>
                  cấp ngày
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={formatDate(ngayCapKH)}
                      onChange={(e) => setNgayCapKH(e.target.value)}
                      className="border-b border-gray-400 px-1 py-0 text-sm w-24 focus:outline-none focus:border-blue-500"
                      placeholder="____"
                    />
                  </span>
                  <span className="hidden print:inline mx-1">
                    {formatDate(ngayCapKH) || "____"}
                  </span>
                  bởi
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={noiCapKH}
                      onChange={(e) => setNoiCapKH(e.target.value)}
                      className="border-b border-gray-400 px-1 py-0 text-sm w-48 focus:outline-none focus:border-blue-500"
                      placeholder="____"
                    />
                  </span>
                  <span className="hidden print:inline mx-1">
                    {noiCapKH || "____"}
                  </span>
                </div>
              </div>
            </div>

            {/* Checkbox for spouse */}
            <div className="print:hidden mb-2 mt-2">
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

            {/* Spouse Section */}
            {coVoChong && (
              <>
                <h2 className="text-base font-bold mt-3">
                  Có vợ/chồng là <br />
                  <span className="font-bold mt-3">Ông/Bà</span>
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={tenVoChong}
                      onChange={(e) => setTenVoChong(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-64 ml-2 focus:outline-none focus:border-blue-500"
                      placeholder="Nhập tên vợ/chồng"
                    />
                  </span>
                  <span className="hidden print:inline ml-2">
                    {tenVoChong || "______"}
                  </span>
                </h2>
                <div className="text-sm space-y-1">
                  <div className="info-row">
                    <span className="info-label">Địa chỉ:</span>
                    <div className="info-value">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={diaChiVoChong}
                          onChange={(e) => setDiaChiVoChong(e.target.value)}
                          className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                          placeholder="Nhập địa chỉ"
                        />
                      </span>
                      <span className="hidden print:inline">
                        {diaChiVoChong || "______"}
                      </span>
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Điện thoại:</span>
                    <div className="info-value">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={dienThoaiVoChong}
                          onChange={(e) => setDienThoaiVoChong(e.target.value)}
                          className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                          placeholder="Nhập số điện thoại"
                        />
                      </span>
                      <span className="hidden print:inline">
                        {dienThoaiVoChong || "______"}
                      </span>
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Mã số thuế:</span>
                    <div className="info-value">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={maSoThueVoChong}
                          onChange={(e) => setMaSoThueVoChong(e.target.value)}
                          className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                          placeholder="Nhập mã số thuế"
                        />
                      </span>
                      <span className="hidden print:inline">
                        {maSoThueVoChong || "______"}
                      </span>
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-label">CCCD/Hộ chiếu:</span>
                    <div className="info-value">
                      Số
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={soCCCDVoChong}
                          onChange={(e) => setSoCCCDVoChong(e.target.value)}
                          className="border-b border-gray-400 px-1 py-0 text-sm w-32 focus:outline-none focus:border-blue-500"
                          placeholder="____"
                        />
                      </span>
                      <span className="hidden print:inline mx-1">
                        {soCCCDVoChong || "____"}
                      </span>
                      cấp ngày
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={formatDate(ngayCapVoChong)}
                          onChange={(e) => setNgayCapVoChong(e.target.value)}
                          className="border-b border-gray-400 px-1 py-0 text-sm w-24 focus:outline-none focus:border-blue-500"
                          placeholder="____"
                        />
                      </span>
                      <span className="hidden print:inline mx-1">
                        {formatDate(ngayCapVoChong) || "____"}
                      </span>
                      bởi
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={noiCapVoChong}
                          onChange={(e) => setNoiCapVoChong(e.target.value)}
                          className="border-b border-gray-400 px-1 py-0 text-sm w-48 focus:outline-none focus:border-blue-500"
                          placeholder="____"
                        />
                      </span>
                      <span className="hidden print:inline mx-1">
                        {noiCapVoChong || "____"}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
            <p className=" mt-2">
              ("<strong>Khách Hàng</strong>")
            </p>
          </div>

          {/* Party Definitions */}
          <div className="mb-2">
            <p>
              <strong>Bên bán</strong> và <strong>Khách Hàng</strong> sau đây
              được gọi riêng là "<strong>Bên</strong>" và gọi chung là "
              <strong>Các Bên</strong>"
            </p>
          </div>

          {/* XÉT RẰNG Section */}
          <div className="mb-2">
            <h2 className="text-base font-bold mb-3">XÉT RẰNG:</h2>
            <div className="text-sm space-y-3 leading-relaxed">
              <p>
                1. Khách Hàng là Khách hàng cá nhân vay mua xe ô tô điện VinFast
                theo Chương trình hỗ trợ tiền vay dành cho Khách hàng cá nhân là
                tài vay mua ô tô điện VinFast VF5 hoặc Herio Green và/hoặc là
                (ii) vợ/chồng của Khách hàng đã ký Hợp đồng mua bán xe ô tô số
                <span className="print:hidden">
                  <input
                    type="text"
                    value={soHopDong}
                    onChange={(e) => setSoHopDong(e.target.value)}
                    className="border-b border-gray-400 px-1 py-0 text-sm w-48 focus:outline-none focus:border-blue-500"
                    placeholder="____"
                  />
                </span>
                <span className="hidden print:inline mx-1">
                  {soHopDong || "____"}
                </span>
                với Bên bán (sau đây gọi chung là "
                <strong>Hợp Đồng Mua Bán Xe</strong>") với thông tin về xe như
                sau:
              </p>
              <div className="ml-4 space-y-1">
                <div className="info-row">
                  <span className="info-label w-[100px] min-w-[100px]">Model:</span>
                  <div className="info-value">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={modelXe}
                        onChange={(e) => setModelXe(e.target.value)}
                        className="border-b border-gray-400 px-1 py-0 text-sm w-full focus:outline-none focus:border-blue-500"
                        placeholder="Nhập model xe"
                      />
                    </span>
                    <span className="hidden print:inline">
                      {modelXe || "______"}
                    </span>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-label w-[100px] min-w-[100px]">Số Khung:</span>
                  <div className="info-value">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={soKhung}
                        onChange={(e) => setSoKhung(e.target.value)}
                        className="border-b border-gray-400 px-1 py-0 text-sm w-full focus:outline-none focus:border-blue-500"
                        placeholder="Nhập số khung"
                      />
                    </span>
                    <span className="hidden print:inline">
                      {soKhung || "______"}
                    </span>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-label w-[100px] min-w-[100px]">Số Máy:</span>
                  <div className="info-value">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={soMay}
                        onChange={(e) => setSoMay(e.target.value)}
                        className="border-b border-gray-400 px-1 py-0 text-sm w-full focus:outline-none focus:border-blue-500"
                        placeholder="Nhập số máy"
                      />
                    </span>
                    <span className="hidden print:inline">
                      {soMay || "______"}
                    </span>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-label w-[100px] min-w-[100px]">Giá trị xe:</span>
                  <div className="info-value">
                    <span className="print:hidden">
                      <CurrencyInput
                        value={giaTriXe}
                        onChange={(val) => setGiaTriXe(val)}
                        className="border-b border-gray-400 px-1 py-0 text-sm w-48 focus:outline-none focus:border-blue-500"
                        placeholder="Nhập giá trị"
                      />
                    </span>
                    <span className="hidden print:inline">
                      {formatCurrency(giaTriXe) || "______"} VNĐ
                    </span>
                    <span className="ml-1">(đã bao gồm ưu đãi/giảm giá)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Chính sách Hỗ trợ Trả thay */}
          <div className="mb-2">
            <div className="text-sm space-y-3 leading-relaxed">
              <p>
                2. Khách Hàng thuộc trường hợp được áp dụng chính sách hỗ trợ
                một khoản tiền tương đương một phần nợ gốc và lãi trong hạn của
                khoản vay mua xe tại Ngân hàng Thương Mại Cổ Phần Việt Nam Thịnh
                Vượng (sau đây gọi là "<strong>Ngân Hàng</strong>") theo chính
                sách hỗ trợ tiền vay của VinFast được đại diện thực hiện bởi Bên
                bán (“<strong>Chính sách Hỗ trợ Trả thay</strong>”) áp dụng cho
                (các) Khách hàng đặt cọc mua xe/xuất hóa đơn từ ngày
                <span className="print:hidden">
                  <input
                    type="text"
                    value={ngayBatDauChinhSach}
                    onChange={(e) => setNgayBatDauChinhSach(e.target.value)}
                    className="border-b border-gray-400 px-1 py-0 text-sm w-24 focus:outline-none focus:border-blue-500"
                    placeholder="dd/mm/yyyy"
                  />
                </span>
                <span className="hidden print:inline mx-1">
                  {ngayBatDauChinhSach || "____"}
                </span>
                đến hết ngày 31/12/2025 (tính theo ngày Bên bán xuất hóa đơn giá
                trị gia tăng bán xe) - Thời hạn giải ngân của khoản vay đến hết
                ngày 31/12/2025. Công ty TNHH kinh doanh thương mại và dịch vụ
                VinFast – Mã số thuế: 0108926276 (“
                <strong>VinFast Trading</strong>”), Ngân Hàng và Công ty cổ phần
                Sản xuất và Kinh doanh VinFast – Mã số thuế: 0107894416 (“
                <strong>VinFast</strong>”) đã ký Thỏa thuận hợp tác khung và các
                Phụ lục đính kèm (sau đây gọi là “
                <strong>Thỏa Thuận Hợp Tác</strong>”) về việc triển khai Chương
                trình hỗ trợ tiền vay dành cho Khách hàng cá nhân vay là tài xế
                vay mua xe ô tô điện VinFast VF5 và Herio Green phục vụ mục đích
                nhu cầu đời sống. Theo đó, Khách Hàng sẽ được VinFast hỗ trợ
                thanh toán cho Ngân Hàng một khoản tiền chênh lệch giữa số tiền
                gốc và lãi của Ngân Hàng theo các quy định và điều kiện tại Thỏa
                Thuận Hợp Tác với số tiền gốc và lãi Khách Hàng chi trả hàng
                tháng theo thỏa thuận tại Hợp Đồng Tín Dụng. Khoản hỗ trợ này sẽ
                được VinFast chi trả cho Ngân Hàng thông qua VinFast Trading.
              </p>
            </div>
          </div>

          {/* Section 3: Hợp Đồng Tín Dụng */}
          <div className="mb-2">
            <div className="text-sm space-y-3 leading-relaxed">
              <p>
                3. Khách Hàng và Ngân Hàng đã hoặc sẽ ký kết một hợp đồng cho
                vay (hoặc hợp đồng/thỏa thuận/khế ước khác có bản chất là hợp
                đồng cho vay) và hợp đồng thế chấp (hoặc hợp đồng/thỏa thuận
                khác có bản chất là giao dịch bảo đảm) và tất cả các thỏa thuận,
                phụ lục, sửa đổi bổ sung liên quan (sau đây gọi chung là “
                <strong>Hợp Đồng Tín Dụng</strong>”). Theo đó, Ngân Hàng cho
                Khách Hàng vay một khoản tiền để thanh toán tiền mua xe ô tô
                VinFast theo Hợp Đồng Mua Bán Xe, giải ngân trực tiếp vào tài
                khoản của Bên bán theo tiến độ thanh toán của Hợp Đồng Mua Bán
                Xe.
              </p>
            </div>
          </div>

          {/* Section 4: Uỷ quyền */}
          <div className="mb-2">
            <div className="text-sm space-y-3 leading-relaxed">
              <p>
                4. Bên bán được VinFast Trading ủy quyền giao kết Thỏa Thuận này
                với Khách Hàng để triển khai Chính sách Hỗ trợ Trả thay.
              </p>
              <p>
                Do vậy, để thực hiện Chính sách Hỗ trợ Trả thay nêu trên, Các
                Bên thống nhất ký kết Thỏa Thuận này với những nội dung như sau:
              </p>
            </div>
          </div>

          {/* Article 1: Thỏa thuận về việc Hỗ Trợ Trả Thay */}
          <div className="mb-2">
            <h2 className="text-base font-bold mb-3">
              Điều 1. Thỏa thuận về việc Hỗ Trợ Trả Thay
            </h2>
            <div className="text-sm space-y-4 leading-relaxed">
              <div>
                <h3 className="mb-2">1.1. Chính sách Hỗ trợ Trả thay:</h3>
                <div className="ml-4 space-y-2">
                  <p>
                    a) Số tiền Khách Hàng vay Ngân hàng để thanh toán:{" "}
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
                        className="border-b border-gray-400 px-1 py-0 text-sm w-48 focus:outline-none focus:border-blue-500"
                        placeholder="Nhập số tiền"
                      />
                    </span>
                    <span className="hidden print:inline mx-1">
                      {formatCurrency(soTienVay) || "______"} VNĐ
                    </span>
                    <i>(Bằng chữ: </i>
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={soTienVayBangChu}
                        onChange={(e) => setSoTienVayBangChu(e.target.value)}
                        className="border-b border-gray-400 px-1 py-0 text-sm w-64 italic focus:outline-none focus:border-blue-500"
                        placeholder="Nhập bằng chữ"
                      />
                    </span>
                    <span className="hidden print:inline mx-1">
                      {soTienVayBangChu || "______"}
                    </span>
                    ), tương ứng với tỷ lệ vay{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={tyLeVay}
                        onChange={(e) => setTyLeVay(e.target.value)}
                        className="border-b border-gray-400 px-1 py-0 text-sm w-24 focus:outline-none focus:border-blue-500"
                        placeholder="__%"
                      />
                    </span>
                    <span className="hidden print:inline mx-1">
                      {tyLeVay || "____"}%
                    </span>{" "}
                    so với giá trị xe.
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
                        value={laiSuat}
                        onChange={(e) => setLaiSuat(e.target.value)}
                        className="border-b border-gray-400 px-1 py-0 text-sm w-24 focus:outline-none focus:border-blue-500"
                        placeholder="__%"
                      />
                    </span>
                    <span className="hidden print:inline mx-1">
                      {laiSuat || "____"}%
                    </span>
                    /năm, cố định trong 24 tháng.
                  </p>
                  <p>
                    d) Lãi suất sau thời gian cố định: Lãi suất cơ sở + Biên độ{" "}
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={bienDo}
                        onChange={(e) => setBienDo(e.target.value)}
                        className="border-b border-gray-400 px-1 py-0 text-sm w-24 focus:outline-none focus:border-blue-500"
                        placeholder="__%"
                      />
                    </span>
                    <span className="hidden print:inline mx-1">
                      {bienDo || "____"}%
                    </span>
                    /năm. Chi tiết theo ghi nhận tại Hợp Đồng Tín Dụng.
                  </p>
                  <p>e) Thời hạn vay: 60 tháng.</p>
                  <p>
                    f) VinFast sẽ hỗ trợ trả thay cho Khách Hàng một khoản tiền
                    như sau:
                  </p>
                  <div className="ml-4 space-y-2 mt-2">
                    <p>
                      -{" "}
                      <strong>
                        Nếu số tiền gốc và lãi trong hạn mà Khách Hàng phải trả
                        nợ hàng tháng theo Hợp Đồng Tín Dụng vượt quá ({">"})
                        9.756.128 VNĐ đối với Khách Hàng vay mua xe ô tô điện
                        VF5 hoặc 9.001.600 VNĐ đối với Khách Hàng vay mua xe ô
                        tô điện Herio Green
                      </strong>
                      : VinFast hỗ trợ trả thay phần tiền chênh lệch vượt quá số
                      tiền nêu trên (sau đây gọi chung là "
                      <strong>Khoản Hỗ Trợ Tiền Vay</strong>").
                    </p>
                    <p>
                      -{" "}
                      <strong>
                        Nếu số tiền gốc và lãi trong hạn mà Khách Hàng phải trả
                        nợ hàng tháng theo Hợp Đồng Tín Dụng nhỏ hơn hoặc bằng (
                        {"≤"}) 9.756.128 VNĐ đối với Khách Hàng vay mua ô tô
                        điện VF5 hoặc 9.001.600 VNĐ đối với Khách Hàng vay mua
                        xe ô tô điện Herio Green
                      </strong>
                      : Khách Hàng tự trả nợ đúng theo số tiền thực tế phải trả
                      theo Hợp Đồng Tín Dụng – nghĩa là VinFast không hỗ trợ trả
                      thay trong các trường hợp này.
                    </p>
                  </div>
                  <p>
                    g) Thời hạn hỗ trợ trả thay (sau đây gọi chung là "
                    <strong>Thời Hạn Hỗ Trợ Trả Thay</strong>"): 36 tháng tính
                    từ ngày tiếp theo liền kề ngày hết thời gian cố định lãi
                    suất theo quy định tại Hợp Đồng Tín Dụng hoặc cho đến khi
                    Thời Hạn Hỗ Trợ Trả Thay chấm dứt trước thời hạn theo quy
                    định tại Thỏa Thuận này, tùy thời điểm nào đến trước.
                  </p>
                </div>

                {/* Section 1.2 */}
                <div className="mt-4">
                  <span className="mb-2">
                    1.2. Để tránh hiểu nhầm Các Bên thống nhất rằng: Trong mọi
                    trường hợp VinFast, VinFast Trading không chịu trách nhiệm
                    đối với bất kỳ số tiền trả nợ nào ngoài số tiền trả thay quy
                    định trên đây vì lý do Khách Hàng không tuân thủ các quy
                    định của Ngân Hàng hay vì bất kỳ lý do gì không phải do lỗi
                    của VinFast, VinFast Trading. Khách Hàng chịu trách nhiệm
                    thanh toán với Ngân Hàng toàn bộ các khoản nợ gốc, lãi và
                    chi phí phát sinh ngoài mức hỗ trợ trả thay của VinFast quy
                    định ở trên bao gồm các khoản phí trả nợ trước hạn; các
                    khoản lãi quá hạn, lãi chậm trả lãi; lãi tăng lên do Khách
                    Hàng vi phạm nghĩa vụ trả nợ hoặc vi phạm nghĩa vụ khác; các
                    khoản tiền hoàn trả ưu đãi do trả nợ trước hạn; tiền bồi
                    thường vi phạm Hợp Đồng Tín Dụng,.... VinFast/VinFast
                    Trading không có trách nhiệm thông báo, làm rõ, nhắc nợ hay
                    thanh toán thay các khoản tiền này cho Khách Hàng.
                  </span>
                </div>

                {/* Section 1.3 */}
                <div className="mt-4">
                  <p className="mb-2">
                    1.3. Thời Hạn Hỗ Trợ Trả Thay sẽ tự động chấm dứt trước hạn
                    trong trường hợp (i) Hợp Đồng Tín Dụng chấm dứt trước khi
                    hết Thời Hạn Hỗ Trợ Trả Thay vì bất cứ lý do gì hoặc (ii)
                    theo thỏa thuận về việc chấm dứt Thỏa Thuận Hỗ Trợ Trả Thay
                    giữa Khách Hàng và VinFast/VinFast Trading. Hết Thời Hạn Hỗ
                    Trợ Trả Thay hoặc khi Thời Hạn Hỗ Trợ Trả Thay chấm dứt
                    trước hạn, Khách Hàng có nghĩa vụ tiếp tục thực hiện trả nợ
                    cho Ngân Hàng theo đúng quy định tại Hợp Đồng Tín Dụng và
                    quy định của Ngân Hàng.
                  </p>
                </div>

                {/* Section 1.4 */}
                <div className="mt-4">
                  <p className="mb-2">
                    1.4. Không phụ thuộc vào các thỏa thuận nêu trên, Các Bên
                    đồng ý rằng, thỏa thuận trả thay theo Thỏa Thuận này là thỏa
                    thuận riêng giữa các Bên (bao gồm cả VinFast, VinFast
                    Trading), không ràng buộc, liên quan đến Ngân Hàng. Ngân
                    Hàng chỉ tham gia với vai trò hỗ trợ VinFast, VinFast
                    Trading chuyển số tiền trả thay được VinFast/VinFast Trading
                    hỗ trợ trả thay cho Khách Hàng để Khách Hàng trả nợ. Do đó,
                    trường hợp VinFast/VinFast Trading không thực hiện/thực hiện
                    không đầy đủ việc hỗ trợ trả thay đã thỏa thuận với Khách
                    Hàng, Khách Hàng vẫn có nghĩa vụ thanh toán đầy đủ các khoản
                    tiền gốc, lãi,… theo đúng thỏa thuận với Ngân Hàng tại Hợp
                    Đồng Tín Dụng. Trường hợp VinFast/VinFast Trading vi phạm
                    nội dung tại Thỏa Thuận này dẫn đến khoản tiền gốc, lãi
                    (thuộc phần được hỗ trợ trả thay) của Khách Hàng bị chậm
                    thanh toán, Ngân Hàng được quyền xử lý, quản lý và phân loại
                    nợ đối với khoản vay của Khách Hàng phù hợp với quy định có
                    liên quan của pháp luật và thỏa thuận giữa Ngân Hàng và
                    Khách Hàng tại Hợp Đồng Tín Dụng.
                  </p>
                </div>

                {/* Section 1.5 */}
                <div className="mt-4">
                  <p className="mb-2">
                    1.5. Khách Hàng đồng ý cho phép Ngân Hàng, VinFast, VinFast
                    Trading, Bên bán được cung cấp các thông tin cá nhân, thông
                    tin liên quan đến xe ô tô, khoản vay được VinFast, VinFast
                    Trading cam kết trả thay và các thông tin khác của Khách
                    Hàng tại Ngân Hàng hoặc tại VinFast, VinFast Trading, Bên
                    bán cho bên còn lại theo yêu cầu của bên còn lại with thời
                    gian và số lượng cung cấp không hạn chế. Việc sử dụng thông
                    tin sau khi được Ngân Hàng, VinFast, VinFast Trading, Bên
                    bán cung cấp, thực hiện theo quyết định của Ngân Hàng,
                    VinFast, VinFast Trading, Bên bán.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Article 2: Quyền và nghĩa vụ của các Bên */}
          <div className="mb-2">
            <h2 className="text-base font-bold mb-3">
              Điều 2. Quyền và nghĩa vụ của các Bên
            </h2>
            <div className="text-sm space-y-4 leading-relaxed">
              {/* Section 2.1 */}
              <div>
                <p className="mb-2">
                  2.1. Quyền và nghĩa vụ của VinFast Trading:
                </p>
                <div className="ml-4 space-y-2">
                  <p>
                    a) Thực hiện kiểm tra, đối chiếu và xác nhận với Ngân Hàng
                    các Khoản Hỗ Trợ Tiền Vay hỗ trợ cho Khách Hàng theo thỏa
                    thuận giữa Ngân Hàng, VinFast và VinFast Trading tại Thỏa
                    Thuận Hợp Tác;
                  </p>
                  <p>
                    b) Thực hiện việc hỗ trợ Khoản Hỗ Trợ Tiền Vay của Khách
                    Hàng theo Chính sách Hỗ trợ Trả thay theo Thỏa Thuận này;
                  </p>
                  <p>
                    c) Không chịu trách nhiệm đối với các mâu thuẫn, tranh chấp,
                    khiếu kiện hay khiếu nại nào liên quan đến và/hoặc phát sinh
                    giữa Ngân Hàng, Khách Hàng và các tổ chức, cá nhân khác
                    trong quá trình thực hiện Hợp Đồng Tín Dụng và các thỏa
                    thuận liên quan đến Hợp Đồng Tín Dụng mà không phải do lỗi
                    từ VinFast Trading, VinFast.
                  </p>
                </div>
              </div>

              {/* Section 2.2 - Khách Hàng */}
              <div className="mt-4">
                <p className="mb-2">2.2. Quyền và nghĩa vụ của Khách Hàng:</p>
                <div className="ml-4 space-y-2">
                  <p>
                    a) Được VinFast (thông qua VinFast Trading) thực hiện việc
                    hỗ trợ Khoản Hỗ Trợ Tiền Vay và áp dụng Chính sách Hỗ trợ
                    Trả thay theo quy định của Thỏa Thuận này.
                  </p>
                  <p>
                    b) Tự chi trả, thanh toán nợ gốc, phí trả nợ trước hạn và
                    bất kỳ khoản lãi, lãi quá hạn nào phát sinh ngoài phạm vi
                    Khoản Hỗ Trợ Tiền Vay, Thời Hạn Hỗ Trợ Trả Thay và Chính
                    sách Hỗ trợ Trả thay.
                  </p>
                  <p>
                    c) Trong Thời Hạn Hỗ Trợ Trả Thay, trường hợp
                    VinFast/VinFast Trading chậm/không thanh toán Khoản Hỗ Trợ
                    Tiền Vay đến hạn cho Ngân Hàng, và việc VinFast/VinFast
                    Trading chậm/không thanh toán Khoản Hỗ Trợ Tiền Vay không
                    phát sinh từ việc Khách Hàng vi phạm các cam kết với
                    VinFast/VinFast Trading, Khách Hàng có nghĩa vụ thanh toán
                    cho Ngân Hàng để đảm bảo việc thanh toán cho Ngân Hàng đúng
                    hạn. Khi đó, VinFast/VinFast Trading sẽ hoàn trả đầy đủ số
                    tiền Khách Hàng đã thanh toán sau khi Khách Hàng cung cấp
                    chứng từ hợp lệ theo yêu cầu của VinFast/VinFast Trading.
                    Việc hoàn trả được thực hiện trong thời hạn 15 ngày làm việc
                    kể từ ngày VinFast/VinFast Trading hoàn tất việc xác minh.
                    Khách Hàng cam kết miễn trừ cho VinFast, VinFast Trading mọi
                    trách nhiệm, nghĩa vụ liên quan đến bất kỳ tranh chấp, mâu
                    thuẫn, khiếu kiện, hay khiếu nại nào phát sinh từ, hoặc liên
                    quan đến Hợp Đồng Tín Dụng, Hợp đồng thế chấp ký giữa Khách
                    Hàng và Ngân Hàng, bên liên quan (nếu có).
                  </p>
                  <p>
                    d) Khách Hàng không được VinFast/VinFast Trading hỗ trợ
                    Khoản Hỗ Trợ Tiền Vay kể từ thời điểm Khách Hàng ký Văn bản
                    chuyển nhượng Hợp Đồng Mua Bán và/hoặc xe ô tô là đối tượng
                    của hợp đồng mua bán/chuyển nhượng với bất kỳ bên thứ ba nào
                    khác.
                  </p>
                  <p>
                    e) Trong Thời Hạn Hỗ Trợ Trả Thay, nếu Khách Hàng tất toán
                    khoản vay trước hạn, ký Văn bản chuyển nhượng Hợp Đồng Mua
                    Bán và/hoặc xe ô tô là đối tượng của hợp đồng mua bán/
                    chuyển nhượng với bất kỳ bên thứ ba nào khác, không thực
                    hiện theo đúng quy định tại Hợp Đồng Tín Dụng đã ký giữa
                    Khách Hàng và Ngân Hàng dẫn đến Ngân Hàng chấm dứt Hợp Đồng
                    Tín Dụng thì VinFast/VinFast Trading chấm dứt hỗ trợ Khoản
                    Hỗ Trợ Tiền Vay theo Chính sách Hỗ trợ Trả thay theo quy
                    định tại Thỏa Thuận này kể từ thời điểm Hợp Đồng Tín Dụng bị
                    chấm dứt. Khách Hàng vẫn phải có trách nhiệm thực hiện nghĩa
                    vụ đối với Ngân Hàng theo quy định của Hợp Đồng Tín Dụng và
                    các thỏa thuận khác giữa Khách Hàng và Ngân Hàng (nếu có).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Article 3: Điều khoản hỗ trợ Ngân Hàng */}
          <div className="mb-2">
            <h2 className="text-base font-bold mb-3">
              Điều 3. Điều khoản hỗ trợ Ngân Hàng
            </h2>
            <div className="text-sm space-y-4 leading-relaxed">
              <p>
                Khách Hàng cam kết không có bất kỳ khiếu nại, khiếu kiện nào và
                đảm bảo Đơn Vị Hỗ Trợ Kỹ Thuật (như được định nghĩa phía dưới)
                và Ngân Hàng, cán bộ nhân viên của Ngân Hàng và Đơn Vị Hỗ Trợ Kỹ
                Thuật không phải chịu bất kỳ trách nhiệm nào đối với bất kỳ tổn
                thất và thiệt hại nào (nếu có) phát sinh từ hoặc liên quan đến
                việc thực thi các nội dung nêu dưới đây:
              </p>
              <div className="ml-4 space-y-3">
                <div>
                  <p className="mb-2">
                    3.1. Khách Hàng cho phép Ngân Hàng thu thập, xử lý các thông
                    tin về xe, vị trí xe, tình trạng xe cho mục đích quản lý tài
                    sản bảo đảm, xử lý tài sản bảo đảm cho khoản vay theo Hợp
                    Đồng Tín Dụng thông qua bên thứ ba là Đơn Vị Hỗ Trợ Kỹ
                    Thuật, như được định nghĩa phía dưới.
                  </p>
                </div>
                <div>
                  <p className="mb-2">
                    3.2. Trong trường hợp Khách Hàng vi phạm nghĩa vụ trả nợ quá
                    10 ngày hoặc thời hạn khác theo yêu cầu của Ngân Hàng, Ngân
                    Hàng có quyền đề nghị VinFast Trading và/hoặc bất kỳ bên thứ
                    ba khác được VinFast Trading ủy quyền/chỉ định (gọi chung là
                    “<strong>Đơn Vị Hỗ Trợ Kỹ Thuật</strong>”) trích xuất dữ
                    liệu định vị xe của Khách Hàng và Khách Hàng đồng ý để Đơn
                    Vị Hỗ Trợ Kỹ Thuật thu thập, xử lý, cung cấp và chia sẻ dữ
                    liệu này cho Ngân Hàng để phục vụ hoạt động xử lý, thu hồi
                    nợ và/hoặc sử dụng vào bất kỳ mục đích nào khác theo thỏa
                    thuận giữa Khách Hàng và Ngân Hàng;
                  </p>
                </div>
                <div>
                  <p className="mb-2">
                    3.3. Trong trường hợp Khách Hàng vi phạm nghĩa vụ trả nợ quá
                    30 ngày hoặc thời hạn khác theo yêu cầu từ Ngân Hàng, Ngân
                    Hàng có quyền gửi yêu cầu cho Đơn Vị Hỗ Trợ Kỹ Thuật kích
                    hoạt tính năng giới hạn mức SOC của Pin tại ngưỡng 30% theo
                    đề nghị của Ngân Hàng, và Khách Hàng đồng ý để Đơn Vị Hỗ Trợ
                    Kỹ Thuật thực hiện các việc này.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Article 4: Hiệu lực của Thỏa Thuận */}
          <div className="mb-2">
            <h2 className="text-base font-bold mb-3">
              Điều 4. Hiệu lực của Thỏa Thuận
            </h2>
            <div className="text-sm space-y-4 leading-relaxed">
              <div>
                <p className="mb-2">
                  4.1. Thỏa Thuận này có hiệu lực kể từ ngày ký đến ngày hết
                  hiệu lực của Hợp Đồng Tín Dụng.
                </p>
              </div>
              <div>
                <p className="mb-2">
                  4.2. Khách Hàng không được chuyển nhượng, chuyển giao quyền và
                  nghĩa vụ của mình theo Thỏa Thuận này cho bất kỳ bên thứ ba
                  nào nếu không được chấp thuận trước bằng văn bản của
                  VinFast/VinFast Trading. Tuy nhiên, Khách Hàng đồng ý rằng
                  VinFast/VinFast Trading có quyền chuyển nhượng, chuyển giao
                  các quyền/nghĩa vụ theo Thỏa Thuận này cho bên thứ ba, hoặc
                  trong trường hợp VinFast/VinFast Trading tổ chức lại doanh
                  nghiệp, bao gồm sáp nhập vào một công ty khác hoặc được chia,
                  hoặc tách hoặc được chuyển đổi với điều kiện là việc chuyển
                  nhượng, chuyển giao các quyền/nghĩa vụ đó không gây thiệt hại
                  đến quyền và lợi ích của Khách Hàng theo Thỏa Thuận này và bên
                  nhận chuyển giao các quyền/nghĩa vụ theo Thỏa Thuận này chịu
                  trách nhiệm tiếp tục thực hiện đầy đủ các quyền và nghĩa vụ
                  đối với Khách hàng theo Thỏa thuận này.
                </p>
              </div>
              <div>
                <p className="mb-2">
                  4.3.Mọi sửa đổi, bổ sung Thỏa Thuận này phải được lập thành
                  văn bản và được ký bởi người đại diện hợp pháp của mỗi Bên.
                </p>
              </div>
              <div>
                <p className="mb-2">
                  4.4. Thỏa Thuận này được điều chỉnh theo các quy định của pháp
                  luật Việt Nam. Mọi tranh chấp phát sinh từ Thỏa Thuận này nếu
                  không được giải quyết bằng thương lượng và hòa giải giữa Các
                  Bên, thì sẽ được giải quyết tại Tòa án có thẩm quyền.
                </p>
              </div>
              <div>
                <p className="mb-2">
                  4.5. Thỏa Thuận này được lập thành 04 (bốn) bản có giá trị như
                  nhau, mỗi Bên giữ 02 (hai) bản để thực hiện.
                </p>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="mt-12 flex justify-between signature-block">
            <div className="text-center flex-1">
              <p className="font-bold mb-1 signer-title">ĐẠI DIỆN BÊN BÁN</p>
              <p className="text-sm italic mb-16">(Ký và ghi rõ họ tên)</p>
            </div>
            <div className="text-center flex-1">
              <p className="font-bold mb-1 signer-title">KHÁCH HÀNG</p>
              <p className="text-sm italic mb-16">(Ký và ghi rõ họ tên)</p>
            </div>
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
          In Giấy Thỏa Thuận
        </button>
        <button
          onClick={() => { setDownloadingPdf(true); downloadElementAsPdf(printableRef.current, "giay-thoa-thuan-tra-thay").then(() => setDownloadingPdf(false)).catch(() => setDownloadingPdf(false)); }}
          disabled={downloadingPdf}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloadingPdf ? "Đang tạo PDF..." : "Tải PDF"}
        </button>
      </div>
    </div>
  );
};

export default GiayThoaThuanTraThay;
