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

const GiayThoaThuanTraCham = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);

  // Editable fields
  const [soThoaThuan, setSoThoaThuan] = useState("");
  const [ngayKy, setNgayKy] = useState("");
  const [thangKy, setThangKy] = useState("");
  const [namKy, setNamKy] = useState("");

  // Company fields
  const [congTy, setCongTy] = useState("");
  const [maSoDN, setMaSoDN] = useState("");
  const [daiDien, setDaiDien] = useState("");
  const [chucVu, setChucVu] = useState("");
  const [soGiayUyQuyen, setSoGiayUyQuyen] = useState("");
  const [ngayUyQuyen, setNgayUyQuyen] = useState("");
  const [ngayUyQuyenRaw, setNgayUyQuyenRaw] = useState("");

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
  const [ngayHopDong, setNgayHopDong] = useState("");
  const [ngayHopDongRaw, setNgayHopDongRaw] = useState("");
  const [modelXe, setModelXe] = useState("");
  const [soKhung, setSoKhung] = useState("");
  const [soMay, setSoMay] = useState("");
  const [giaTriThanhToan, setGiaTriThanhToan] = useState("");
  const [soTienTraCham, setSoTienTraCham] = useState("");
  const [soTienTraChamBangChu, setSoTienTraChamBangChu] = useState("");
  const [ngayTraNo, setNgayTraNo] = useState("");
  const [thoiHanThanhToan, setThoiHanThanhToan] = useState("60");

  useEffect(() => {
    const loadData = async () => {
      let showroomName = location.state?.showroom || "";

      // Nếu có firebaseKey, thử lấy showroom từ exportedContracts hoặc contracts
      if (location.state?.firebaseKey) {
        try {
          const contractId = location.state.firebaseKey;
          // Thử exportedContracts trước (vì đây là từ trang hợp đồng đã xuất)  
          let contractsRef = ref(database, `exportedContracts/${contractId}`);  
          let snapshot = await get(contractsRef);

          // Nếu không có trong exportedContracts, thử contracts
          if (!snapshot.exists()) {
            contractsRef = ref(database, `contracts/${contractId}`);
            snapshot = await get(contractsRef);
          }

          if (snapshot.exists()) {
            const contractData = snapshot.val();
            if (contractData.showroom) {
              showroomName = contractData.showroom;
            }
          }
        } catch (err) {
          console.error("Error loading showroom from database:", err);
        }
      }

      // Chỉ set branch khi có showroom được chọn
      const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
      setBranch(branchInfo);

      if (location.state) {
        const incoming = location.state;

        // Parse date for agreement signing
        const today = new Date();
        setNgayKy(String(today.getDate()).padStart(2, "0"));
        setThangKy(String(today.getMonth() + 1).padStart(2, "0"));
        setNamKy(String(today.getFullYear()));

        // Company info - chỉ điền từ showroom khi có branchInfo
        const congTyFromIncoming = incoming.congTy || incoming["Công Ty"] || "";
        if (branchInfo) {
          setCongTy(congTyFromIncoming || branchInfo.name.toUpperCase());       
          setMaSoDN(incoming.maSoDN || incoming["Mã Số DN"] || branchInfo.taxCode || "");
          setDaiDien(incoming.daiDien || incoming["Đại Diện"] || branchInfo.representativeName || "");
          setChucVu(incoming.chucVu || incoming["Chức Vụ"] || branchInfo.position || "");
        } else {
          setCongTy(congTyFromIncoming);
          setMaSoDN(incoming.maSoDN || incoming["Mã Số DN"] || "");
          setDaiDien(incoming.daiDien || incoming["Đại Diện"] || "");
          setChucVu(incoming.chucVu || incoming["Chức Vụ"] || "");
        }

        // Customer info
        setTenKH(
          incoming.customerName ||
            incoming["Tên KH"] ||
            incoming["Tên Kh"] ||
            ""
        );
        setDiaChiKH(
          incoming.address || incoming["Địa Chỉ"] || incoming.diaChi || ""      
        );
        setDienThoaiKH(
          incoming.phone ||
            incoming["Số Điện Thoại"] ||
            incoming.soDienThoai ||
            ""
        );
        setMaSoThueKH(incoming.maSoThue || incoming["Mã Số Thuế"] || "");       
        setSoCCCDKH(incoming.cccd || incoming.CCCD || incoming["CCCD"] || "");  
        setNgayCapKH(
          incoming.issueDate || incoming.ngayCap || incoming["Ngày Cấp"] || ""  
        );
        setNoiCapKH(
          incoming.issuePlace || incoming.noiCap || incoming["Nơi Cấp"] || ""   
        );

        // Spouse info (if available)
        const hasSpouseData =
          incoming.tenVoChong ||
          incoming["Tên Vợ/Chồng"] ||
          incoming.diaChiVoChong ||
          incoming["Địa Chỉ Vợ/Chồng"] ||
          incoming.cccdVoChong ||
          incoming["CCCD Vợ/Chồng"];
        setCoVoChong(!!hasSpouseData);
        setTenVoChong(incoming.tenVoChong || incoming["Tên Vợ/Chồng"] || "");   
        setDiaChiVoChong(
          incoming.diaChiVoChong || incoming["Địa Chỉ Vợ/Chồng"] || ""
        );
        setDienThoaiVoChong(
          incoming.dienThoaiVoChong || incoming["Điện Thoại Vợ/Chồng"] || ""    
        );
        setMaSoThueVoChong(
          incoming.maSoThueVoChong || incoming["Mã Số Thuế Vợ/Chồng"] || ""     
        );
        setSoCCCDVoChong(
          incoming.cccdVoChong || incoming["CCCD Vợ/Chồng"] || ""
        );
        setNgayCapVoChong(
          incoming.ngayCapVoChong || incoming["Ngày Cấp Vợ/Chồng"] || ""        
        );
        setNoiCapVoChong(
          incoming.noiCapVoChong || incoming["Nơi Cấp Vợ/Chồng"] || ""
        );

        // Contract info
        setSoHopDong(
          incoming.vso || incoming["VSO"] || incoming.soHopDong || ""
        );
        const contractDate =
          incoming.ngayXhd || incoming.createdAt || incoming.createdDate || ""; 
        // Parse và set cả raw và formatted
        if (contractDate) {
          let dateObj;
          if (contractDate.includes("/")) {
            const [day, month, year] = contractDate.split("/");
            dateObj = new Date(year, month - 1, day);
          } else {
            dateObj = new Date(contractDate);
          }
          if (!isNaN(dateObj.getTime())) {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, "0");      
            const day = String(dateObj.getDate()).padStart(2, "0");
            setNgayHopDongRaw(`${year}-${month}-${day}`);
            setNgayHopDong(formatDateForDisplay(`${year}-${month}-${day}`));    
          } else {
            setNgayHopDongRaw("");
            setNgayHopDong(contractDate);
          }
        } else {
          setNgayHopDongRaw("");
          setNgayHopDong("");
        }
        setModelXe(
          incoming.model || incoming.dongXe || incoming["Dòng xe"] || ""        
        );
        setSoKhung(
          incoming.soKhung ||
            incoming["Số Khung"] ||
            incoming.chassisNumber ||
            ""
        );
        setSoMay(
          incoming.soMay || incoming["Số Máy"] || incoming.engineNumber || ""   
        );
        const giaTri =
          incoming.contractPrice ||
          incoming.giaHD ||
          incoming["Giá Hợp Đồng"] ||
          "";
        setGiaTriThanhToan(giaTri);
        const soTien = incoming.soTienTraCham || "";
        setSoTienTraCham(soTien);
        if (soTien) {
          setSoTienTraChamBangChu(vndToWords(soTien));
        }
        setThoiHanThanhToan(incoming.thoiHanThanhToan || "60");

        setData({
          loaded: true,
        });
      } else {
        // Dữ liệu mẫu
        const today = new Date();
        setNgayKy(String(today.getDate()).padStart(2, "0"));
        setThangKy(String(today.getMonth() + 1).padStart(2, "0"));
        setNamKy(String(today.getFullYear()));

        // Chỉ điền từ branchInfo khi có showroom
        if (branchInfo) {
          setCongTy(branchInfo.name.toUpperCase());
          setMaSoDN(branchInfo.taxCode || "");
          setDaiDien(branchInfo.representativeName || "");
          setChucVu(branchInfo.position || "");
        } else {
          setCongTy("");
          setMaSoDN("");
          setDaiDien("");
          setChucVu("");
        }

        setTenKH("Nguyễn Văn A");
        setDiaChiKH("123 Đường ABC, Phường XYZ, Quận 1, TP. Hồ Chí Minh");      
        setDienThoaiKH("0901234567");
        setMaSoThueKH("");
        setSoCCCDKH("001234567890");
        setNgayCapKH("01/01/2020");
        setNoiCapKH("Công An TP. Hồ Chí Minh");

        setModelXe("VINFAST VF 5");
        setSoHopDong("S00901-VSO-24-10-0042");
        setNgayHopDongRaw("2024-10-08");
        setNgayHopDong("08/10/2024");
        setSoKhung("");
        setSoMay("");
        setGiaTriThanhToan("540000000");
        setSoTienTraCham("");

        setData({
          loaded: true,
        });
      }
      setLoading(false);
    };

    loadData();
  }, [location.state]);

  const pad = (num) => String(num).padStart(2, "0");

  // Helper function to format date as dd/mm/yyyy
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;   
  };

  const formatDateLong = (dateStr) => {
    if (!dateStr) return "";
    try {
      let date;
      if (dateStr.includes("/")) {
        const [day, month, year] = dateStr.split("/");
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(dateStr);
      }
      if (isNaN(date.getTime())) return "";
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${day} tháng ${month} năm ${year}`;
    } catch {
      return "";
    }
  };

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

  if (!data) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"    
        style={{ fontFamily: "Times New Roman" }}
      >
        <div className="text-center">
          <p className="text-red-600 mb-4">Không có dữ liệu hợp đồng</p>        
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
          >
            Quay lại
          </button>
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
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold uppercase mb-2">
              THỎA THUẬN THANH TOÁN CHẬM
            </h1>
            <div className="text-sm mb-4">
              <span className="font-semibold">Số:</span>
              <span className="print:hidden">
                <input
                  type="text"
                  value={soThoaThuan}
                  onChange={(e) => setSoThoaThuan(e.target.value)}
                  className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
                  placeholder="Nhập số thỏa thuận"
                />
              </span>
              <span className="hidden print:inline ml-2 font-bold uppercase">
                {soThoaThuan || "______"}
              </span>
            </div>
          </div>

          {/* Introduction */}
          <div className="text-sm mb-6 leading-relaxed">
            <p>
              Thỏa thuận thanh toán chậm ("Thỏa Thuận") này được ký ngày        
              <span className="print:hidden">
                <input
                  type="text"
                  value={ngayKy}
                  onChange={(e) => setNgayKy(e.target.value)}
                  className="border-b border-gray-400 px-1 py-0 text-sm w-12 text-center focus:outline-none focus:border-blue-500"
                  placeholder=""
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
                  placeholder=""
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
                  placeholder=""
                />
              </span>
              <span className="hidden print:inline mx-1">
                {namKy || "____"}
              </span>
              , bởi và giữa:
            </p>
          </div>

          {/* Company Section */}
          <div className="mb-3">
            {branch ? (
              <>
                <h2 className="text-base font-bold uppercase mb-2">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={congTy}
                      onChange={(e) => setCongTy(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 w-full focus:outline-none focus:border-blue-500 uppercase"
                      placeholder="Nhập tên công ty"
                    />
                  </span>
                  <span className="hidden print:inline underline uppercase">{congTy || ""}</span>   
                </h2>
                <div className="text-sm space-y-1">
                  <div className="info-row">
                    <span className="info-label">Địa chỉ trụ sở chính:</span>
                    <div className="info-value">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={branch.address || ""}
                          readOnly
                          className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none"
                        />
                      </span>
                      <span className="hidden print:inline">
                        {branch.address}
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
                          className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500 font-bold"
                          placeholder="Nhập mã số doanh nghiệp"
                        />
                      </span>
                      <span className="hidden print:inline font-bold">
                        {maSoDN || "______"}
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
                    </div>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Chức vụ:</span>
                    <div className="info-value">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={chucVu}
                          onChange={(e) => setChucVu(e.target.value)}
                          className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
                          placeholder="Nhập chức vụ"
                        />
                      </span>
                      <span className="hidden print:inline">
                        {chucVu || "______"}
                      </span>
                    </div>
                  </div>
                  <div className="">
                    (Theo Giấy uỷ quyền số
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={soGiayUyQuyen}
                        onChange={(e) => setSoGiayUyQuyen(e.target.value)}      
                        className="border-b border-gray-400 px-1 py-0 text-xs w-24 focus:outline-none focus:border-blue-500"
                        placeholder=""
                      />
                    </span>
                    <span className="hidden print:inline mx-1 font-bold">
                      {soGiayUyQuyen || "____"}
                    </span>
                    ngày
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
                        className="border-b border-gray-400 px-1 py-0 text-xs w-24 focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </span>
                    <span className="hidden print:inline mx-1 font-bold">
                      {ngayUyQuyen || "____"}
                    </span>
                    )
                  </div>
                  <p className="font-bold uppercase">(Bên Bán)</p>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-sm">
                [Chưa chọn showroom - Thông tin công ty sẽ hiển thị khi chọn showroom]
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="mb-3">
            <p className="font-bold uppercase">VÀ</p>
          </div>

          {/* Customer Section */}
          <div className="mb-6">
            <h2 className="text-base font-bold mb-3">
              Ông/Bà
              <span className="print:hidden">
                <input
                  type="text"
                  value={tenKH}
                  onChange={(e) => setTenKH(e.target.value)}
                  className="border-b border-gray-400 px-2 py-1 text-sm w-[90%] ml-2 focus:outline-none focus:border-blue-500"
                  placeholder="Nhập tên khách hàng"
                />
              </span>
              <span className="hidden print:inline ml-2 uppercase">
                {tenKH || "______"}
              </span>
            </h2>
            <div className="text-sm space-y-1">
              <div className="info-row">
                <span className="info-label">Địa chỉ:</span>
                <div className="info-value font-bold">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={diaChiKH}
                      onChange={(e) => setDiaChiKH(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-[90%] focus:outline-none focus:border-blue-500"
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
                <div className="info-value font-bold">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={dienThoaiKH}
                      onChange={(e) => setDienThoaiKH(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
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
                <div className="info-value font-bold">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={maSoThueKH}
                      onChange={(e) => setMaSoThueKH(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
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
                <div className="info-value font-bold">
                  Số
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={soCCCDKH}
                      onChange={(e) => setSoCCCDKH(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
                      placeholder="Nhập số CCCD"
                    />
                  </span>
                  <span className="hidden print:inline mx-1">
                    {soCCCDKH || "______"}
                  </span>
                  cấp ngày {formatDateForDisplay(ngayCapKH)} bởi
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={noiCapKH}
                      onChange={(e) => setNoiCapKH(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
                      placeholder="Nhập nơi cấp"
                    />
                  </span>
                  <span className="hidden print:inline mx-1">
                    {noiCapKH || "______"}
                  </span>
                </div>
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
            <div className="mb-6">
              <h2 className="text-base font-bold italic mb-3">
                Có vợ/chồng là
              </h2>
              <div className="text-sm space-y-1">
                <div className="info-row">
                  <span className="info-label font-bold">Ông/Bà</span>
                  <div className="info-value font-bold">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={tenVoChong}
                        onChange={(e) => setTenVoChong(e.target.value)}
                        className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500 uppercase"
                        placeholder="Nhập tên vợ/chồng"
                      />
                    </span>
                    <span className="hidden print:inline uppercase">
                      {tenVoChong || "______"}
                    </span>
                  </div>
                </div>
                <div className="info-row">
                  <span className="info-label">Địa chỉ:</span>
                  <div className="info-value font-bold">
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
                  <div className="info-value font-bold">
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
                  <div className="info-value font-bold">
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
                  <div className="info-value font-bold">
                    Số
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={soCCCDVoChong}
                        onChange={(e) => setSoCCCDVoChong(e.target.value)}        
                        className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
                        placeholder="Nhập số CCCD"
                      />
                    </span>
                    <span className="hidden print:inline mx-1">
                      {soCCCDVoChong || "______"}
                    </span>
                    cấp ngày
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={ngayCapVoChong}
                        onChange={(e) => setNgayCapVoChong(e.target.value)}
                        className="border-b border-gray-400 px-1 py-0 text-sm w-24 focus:outline-none focus:border-blue-500"
                        placeholder=""
                      />
                    </span>
                    <span className="hidden print:inline mx-1">
                      {ngayCapVoChong || "____"}
                    </span>
                    bởi
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={noiCapVoChong}
                        onChange={(e) => setNoiCapVoChong(e.target.value)}        
                        className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
                        placeholder="Nhập nơi cấp"
                      />
                    </span>
                    <span className="hidden print:inline mx-1">
                      {noiCapVoChong || "______"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm mb-3 font-bold uppercase">("Khách Hàng")</p>

          {/* Parties Definition */}
          <p className="text-sm mb-3">
            <strong>Bên Bán</strong> và <strong>Khách Hàng</strong> sau đây được
            gọi riêng là <strong>"Bên"</strong> và gọi chung là{" "}
            <strong>"Các Bên"</strong>
          </p>

          {/* WHEREAS Section */}
          <div className="mb-6">
            <h2 className="text-base font-bold mb-3">XÉT RẰNG:</h2>
            <div className="text-sm space-y-2">
              <p>
                1. Khách Hàng là khách hàng cá nhân mua xe ô tô điện VinFast    
                và/hoặc là (ii) vợ/chồng của Khách Hàng đã ký Hợp đồng mua bán  
                xe ô tô điện VinFast số
                <span className="print:hidden">
                  <input
                    type="text"
                    value={soHopDong}
                    onChange={(e) => setSoHopDong(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500"
                    placeholder="Nhập số hợp đồng"
                  />
                </span>
                <span className="hidden print:inline mx-1 font-bold">
                  {soHopDong || "______"}
                </span>
                , ngày
                <span className="print:hidden">
                  <input
                    type="text"
                    value={formatDate(ngayHopDong)}
                    onChange={(e) => setNgayHopDong(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-32 focus:outline-none focus:border-blue-500"
                    placeholder="Nhập ngày"
                  />
                </span>
                <span className="hidden print:inline mx-1 font-bold">
                  {formatDate(ngayHopDong) || "____"}
                </span>
                với Bên Bán (sau đây gọi chung là "Hợp Đồng Mua Bán Xe") với    
                thông tin về xe như sau:
              </p>
            </div>
            {/* Car Information */}
            <div className="ml-4 space-y-1 mt-2">
              <div className="info-row grid-cols-[120px_1fr]">
                <span className="info-label w-[120px]">- Model:</span>
                <div className="info-value font-bold">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={modelXe}
                      onChange={(e) => setModelXe(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                      placeholder="Nhập model xe"
                    />
                  </span>
                  <span className="hidden print:inline">
                    {modelXe || "______"}
                  </span>
                </div>
              </div>
              <div className="info-row grid-cols-[120px_1fr]">
                <span className="info-label w-[120px]">- Số khung:</span>
                <div className="info-value font-bold uppercase">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={soKhung}
                      onChange={(e) => setSoKhung(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                      placeholder="Nhập số khung"
                    />
                  </span>
                  <span className="hidden print:inline">
                    {soKhung || "______"}
                  </span>
                </div>
              </div>
              <div className="info-row grid-cols-[120px_1fr]">
                <span className="info-label w-[120px]">- Số máy:</span>
                <div className="info-value font-bold uppercase">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={soMay}
                      onChange={(e) => setSoMay(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                      placeholder="Nhập số máy"
                    />
                  </span>
                  <span className="hidden print:inline">
                    {soMay || "______"}
                  </span>
                </div>
              </div>
              <div className="info-row grid-cols-[120px_1fr]">
                <span className="info-label w-[120px]">- Giá trị xe:</span>
                <div className="info-value">
                  <span className="print:hidden">
                    <CurrencyInput
                      value={giaTriThanhToan}
                      onChange={(val) => setGiaTriThanhToan(val)}
                      className="border-b border-gray-400 px-2 py-1 text-sm w-48 focus:outline-none focus:border-blue-500 font-bold"
                      placeholder="Nhập giá trị"
                    />
                  </span>
                  <span className="hidden print:inline font-bold">
                    {formatCurrency(giaTriThanhToan) || "______"} VNĐ
                  </span>
                  <span className="italic"> (Giá Trị Thanh Toán)</span>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-2 mt-4">
              <p>
                2. Khách Hàng mua xe theo Chương trình mua xe 0 đồng (“
                <strong>Chương Trình</strong>”), thuộc trường hợp được Bên Bán  
                áp dụng chính sách thúc đẩy bán hàng theo đó Bên Bán sẽ cho     
                Khách Hàng thanh toán chậm một khoản tiền tương đương tối đa Giá
                Trị Thanh Toán trừ đi khoản tiền Khách Hàng vay tổ chức tín dụng
                để mua xe, và đảm bảo không cao hơn 10% Giá Trị Thanh Toán trong
                thời hạn tối đa 60 tháng (“<strong>Khoản Trả Chậm</strong>”).   
                Chương Trình áp dụng cho (các) khách hàng thỏa mãn đầy đủ các   
                điều kiện sau:
              </p>
              <div className="ml-6 space-y-1">
                <p>
                  - Mua xe Herio Green hoặc VF5 và được xuất hóa đơn từ ngày    
                  13/09/2025 đến hết ngày 31/12/2025.
                </p>
                <p>
                  - Đã được tổ chức tín dụng đối tác thuộc danh sách do VinFast 
                  thông báo theo từng thời kỳ ra thông báo cho vay để mua xe    
                  ("Ngân Hàng Cho Vay").
                </p>
                <p>
                  - Các điều kiện khác của Chương Trình đã được VinFast công bố 
                  tại thời điểm ký kết Thỏa Thuận này bao gồm nhưng không giới  
                  hạn thông báo triển khai Chương Trình tại Phụ lục 01 đính kèm 
                  Thỏa Thuận này.
                </p>
                <p>
                  - Không được áp dụng đồng thời mức hỗ trợ lãi suất của "Chương
                  trình ưu đãi chuyển đổi xanh", ưu đãi chính sách "Vì Thủ Đô   
                  trong xanh" và "Sài Gòn xanh" và các chương trình hỗ trợ lãi  
                  vay khác do VinFast thông báo theo từng thời kỳ.
                </p>
              </div>
            </div>

            {/* Section 3 */}
            <div className="mt-4">
              <p>
                3. Bên Bán tại đây chỉ định Khách Hàng thanh toán Khoản Trả Chậm
                và các khoản thanh toán khác cho Bên Bán theo Thỏa Thuận này    
                trực tiếp cho VinFast và VinFast được Bên Bán ủy quyền, vô điều 
                kiện và không hủy ngang, để thực hiện việc nhận tiền thanh toán 
                và thực hiện các biện pháp phù hợp để yêu cầu Khách Hàng thanh  
                toán theo các điều khoản và điều kiện của Thỏa Thuận này.       
              </p>
            </div>

            {/* Section 4 */}
            <div className="mt-4 mb-3">
              <p>
                4. VinFast có thể ủy quyền cho tổ chức tín dụng thực hiện một   
                phần hoặc toàn bộ công việc nêu tại Mục 3 trên đây để thu Khoản 
                Trả Chậm và các khoản thanh toán khác cho Bên Bán theo Thỏa     
                Thuận này từ Khách Hàng ("Ngân Hàng Thu Hộ").
              </p>
            </div>

            {/* DO VẬY Section */}
            <div>
              <p className="mb-3 mt-4">
                <strong>DO VẬY</strong>, để thực hiện Chương Trình nêu trên, Các
                Bên thống nhất ký kết Thỏa Thuận này với những nội dung như sau:
              </p>
            </div>

            {/* Điều 1 */}
            <div className="space-y-3">
              <h3 className="font-bold">Điều 1. Điều khoản thanh toán</h3>      
              <p>
                Khách Hàng mua xe theo Chương Trình được phép thanh toán chậm   
                Khoản Trả Chậm với nội dung cụ thể như sau:
              </p>

              {/* 1.1 */}
              <div className="space-y-2">
                <span className="font-bold">1.1. Chính sách trả chậm:</span>
                <div className="space-y-2 ml-8">
                  <div className="info-row grid-cols-[250px_1fr]">
                    <span className="info-label w-[250px]">a) Số tiền Khách Hàng được trả chậm:</span>
                    <div className="info-value font-bold">
                      <span className="print:hidden">
                        <CurrencyInput
                          value={soTienTraCham}
                          onChange={(val) => {
                            setSoTienTraCham(val);
                            setSoTienTraChamBangChu(vndToWords(val));
                          }}
                          className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                          placeholder="Nhập số tiền"
                        />
                      </span>
                      <span className="hidden print:inline">
                        {formatCurrency(soTienTraCham) || "______"} VNĐ
                      </span>
                    </div>
                  </div>
                  <div className="info-row grid-cols-[100px_1fr]">
                    <span className="info-label w-[100px] italic">(Bằng chữ:</span>
                    <div className="info-value italic font-bold">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={soTienTraChamBangChu}
                          onChange={(e) =>
                            setSoTienTraChamBangChu(e.target.value)
                          }
                          className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                          placeholder="Nhập bằng chữ"
                        />
                      </span>
                      <span className="hidden print:inline">
                        {soTienTraChamBangChu || "______"}
                      </span>
                      <strong>)</strong>
                    </div>
                  </div>
                  <p>
                    <span className="font-bold">b) Phí áp dụng:</span> Không áp dụng.
                  </p>
                  <div className="info-row grid-cols-[200px_1fr]">
                    <span className="info-label w-[200px] font-bold">c) Thời hạn thanh toán:</span>
                    <div className="info-value font-bold">
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={thoiHanThanhToan}
                          onChange={(e) => setThoiHanThanhToan(e.target.value)}   
                          className="border-b border-gray-400 px-2 py-1 text-sm w-16 focus:outline-none focus:border-blue-500"
                          placeholder="60"
                        />
                      </span>
                      <span className="hidden print:inline">
                        {thoiHanThanhToan || "60"}
                      </span>{" "}
                      tháng.
                    </div>
                  </div>
                  <div className="info-row grid-cols-[200px_1fr]">
                    <span className="info-label w-[200px] font-bold">d) Kỳ hạn thanh toán:</span>
                    <div className="info-value">
                      Ngày
                      <span className="print:hidden">
                        <input
                          type="text"
                          value={ngayTraNo}
                          onChange={(e) => setNgayTraNo(e.target.value)}
                          className="border-b border-gray-400 px-2 py-1 text-sm w-24 focus:outline-none focus:border-blue-500 font-bold"
                          placeholder="Nhập ngày"
                        />
                      </span>
                      <span className="hidden print:inline font-bold ml-1">
                        {ngayTraNo || "____"}
                      </span>{" "}
                      hàng tháng cho đến khi Khách Hàng hoàn tất nghĩa vụ thanh   
                      toán. Kỳ thanh toán đầu tiên là tháng T+1 trong đó: tháng T 
                      là tháng mà Bên Bán bàn giao xe cho Khách Hàng.
                    </div>
                  </div>
                </div>
              </div>

              {/* 1.2 */}
              <div className="mt-4">
                <p>
                  1.2. Trong trường hợp đến kỳ hạn thanh toán theo quy định tại 
                  Thỏa Thuận này mà Khách Hàng thanh toán chậm và/hoặc không đầy
                  đủ, thì ngoài các biện pháp khác được quy định tại Thỏa Thuận 
                  này, Khách Hàng còn phải thanh toán thêm cho VinFast khoản    
                  lãi/phí chậm thanh toán, được tính theo mức lãi suất 10%/năm  
                  trên số tiền chậm thanh toán, tương ứng với số ngày thực tế   
                  chậm trả.{" "}
                </p>
              </div>

              {/* 1.3 */}
              <div className="mt-4">
                <p className="font-bold">1.3. Hình thức thanh toán: </p>
                <p className="mb-2">
                  Khách Hàng có thể lựa chọn các hình thức thanh toán bên dưới  
                  hoặc các hình thức khác (nếu có) được VinFast thông báo tùy   
                  từng thời kỳ.
                </p>
                <div className="ml-8 space-y-2">
                  <p>
                    a) Thanh toán tự động qua dịch vụ thu hộ định kỳ hàng tháng 
                    của Ngân Hàng Thu Hộ được quy định tại Phụ lục 02 đính kèm  
                    Thỏa Thuận này.
                  </p>
                  <p className="">
                    Trong trường hợp Khách Hàng chọn hình thức thanh toán tại   
                    điểm a) này, Khách Hàng theo đây đồng ý để VinFast cung cấp 
                    dữ liệu cá nhân của Khách Hàng, bao gồm hình ảnh hoặc thông 
                    tin căn cước công dân, hộ chiếu hoặc một phần của danh tính 
                    điện tử của cá nhân, cho Ngân Hàng Thu Hộ nhằm mục đích thực
                    hiện yêu cầu của Khách Hàng tại điểm a) này. VinFast theo đó
                    sẽ thực hiện yêu cầu của Khách Hàng phù hợp với quy định    
                    pháp luật về bảo vệ dữ liệu cá nhân hiện hành.
                  </p>
                  <p>
                    b) Khách Hàng thanh toán trực tiếp vào tài khoản của VinFast
                    thông qua hướng dẫn trên ứng dụng "VinFast" và/hoặc các nền 
                    tảng trực tuyến khác theo hướng dẫn của VinFast theo từng   
                    thời kỳ. Khách Hàng có thể lựa chọn thanh toán 01 (một) kỳ  
                    hoặc thanh toán trước nhiều kỳ.
                  </p>
                </div>
              </div>
            </div>

            {/* Điều 2 */}
            <div className="mt-6 space-y-4">
              <h3 className="font-bold">
                Điều 2. Quyền và nghĩa vụ của các Bên
              </h3>

              {/* 2.1 */}
              <div className="space-y-2">
                <h4 className="font-bold">2.1. Quyền và nghĩa vụ của Bên Bán:</h4>       
                <div className="ml-8 space-y-1">
                  <p>
                    a) Hỗ trợ Khách Hàng được trả chậm theo Chương Trình và theo
                    điều khoản và điều kiện của Thỏa Thuận này.
                  </p>
                  <p>
                    b) Yêu cầu Khách Hàng thanh toán đầy đủ và đúng hạn Khoản   
                    Trả Chậm và/hoặc các khoản phí, lãi phạt và chi phí phát    
                    sinh khác liên quan (nếu có) cho VinFast theo quy định của  
                    Thỏa Thuận này và các văn bản khác có liên quan.
                  </p>
                  <p>
                    c) Ủy quyền vô điều kiện, không hủy ngang cho VinFast, thực 
                    hiện các biện pháp yêu cầu Khách Hàng thanh toán phù hợp    
                    theo quy định của pháp luật và Thỏa Thuận này trong trường  
                    hợp Khách Hàng vi phạm nghĩa vụ thanh toán.
                  </p>
                </div>
              </div>

              {/* 2.2 */}
              <div className="space-y-2">
                <h4 className="font-bold">2.2. Quyền và nghĩa vụ của Khách Hàng:</h4>    
                <div className="ml-8 space-y-1">
                  <p>
                    a) Được trả chậm một phần Giá Trị Thanh Toán theo quy định  
                    của Chương Trình và Thỏa Thuận này khi đáp ứng đủ điều kiện.
                  </p>
                  <p>
                    b) Hiểu và chấp thuận việc thanh toán đầy đủ và đúng hạn    
                    Khoản Trả Chậm và/hoặc các khoản phí, lãi phạt và chi phí   
                    phát sinh khác liên quan (nếu có) cho VinFast hoặc Ngân Hàng
                    Thu Hộ do VinFast chỉ định theo quy định của Thỏa Thuận này.
                  </p>
                  <p>
                    c) Khách Hàng được quyền thanh toán trước hạn một phần/toàn 
                    bộ Khoản Trả Chậm.
                  </p>
                  <p>
                    d) Khách Hàng phải thanh toán trước hạn và tất toán Khoản   
                    Trả Chậm trước khi Khách Hàng ký Văn bản chuyển nhượng Hợp  
                    Đồng Mua Bán Xe và/hoặc xe ô tô là đối tượng của hợp đồng   
                    mua bán/chuyển nhượng với bất kỳ bên thứ ba nào khác.       
                  </p>
                  <p>
                    e) Khi Khách Hàng vi phạm các điều kiện tham gia Chương     
                    Trình quy định tại mục 2 phần Xét Rằng và/hoặc các điều     
                    kiện, nghĩa vụ khác theo quy định tại Thỏa Thuận này, tất cả
                    các Khoản Trả Chậm còn lại và/hoặc các khoản phí, lãi phạt  
                    và chi phí phát sinh khác liên quan (nếu có) theo Thỏa Thuận
                    này sẽ ngay lập tức đến hạn và VinFast có quyền dừng áp dụng
                    các chương trình hỗ trợ lãi vay, hỗ trợ trả thay cho Khách  
                    Hàng khi vay vốn mua xe tại Ngân Hàng Cho Vay (nếu có).     
                  </p>
                  <p>
                    f)Bằng việc ký vào Thỏa Thuận này, Khách Hàng theo đây đồng 
                    ý cho phép VinFast và Bên Bán xử lý thông tin, dữ liệu cá   
                    nhân của mình theo Chính Sách Bảo Vệ Dữ Liệu Cá Nhân của    
                    VinFast công bố tại{" "}
                    <a
                      href="https://vinfastauto.com/vn_vi/privacy-policy"       
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline print:text-black"      
                    >
                      https://vinfastauto.com/vn_vi/privacy-policy
                    </a>{" "}
                    và quy định pháp luật hiện hành về bảo vệ dữ liệu cá nhân.  
                  </p>
                </div>
              </div>
            </div>

            {/* Điều 3 */}
            <div className="mt-6 space-y-4">
              <h3 className="font-bold">Điều 3. Biện pháp can thiệp</h3>        

              {/* 3.1 */}
              <div className="space-y-2">
                <span className="">
                  3.1. Để phục vụ hoạt động VinFast yêu cầu thanh toán and/hoặc  
                  yêu cầu Khách Hàng thực hiện nghĩa vụ khác theo Thỏa Thuận    
                  này, Khách Hàng đồng ý để VinFast and/hoặc bất kỳ bên thứ ba do
                  VinFast ủy quyền hoặc chỉ định (gọi chung là “
                  <strong>Đơn Vị Hỗ Trợ Kỹ Thuật</strong>”) thực hiện các công  
                  việc sau:
                </span>{" "}
                <div className="ml-8 space-y-2 mt-2">
                  <p>
                    a) Thu thập, xử lý và sử dụng thông tin về xe, dữ liệu trong
                    xe và dữ liệu định vị xe của Khách Hàng trong suốt thời hạn 
                    Thỏa Thuận này có hiệu lực; và
                  </p>
                  <p>
                    b) Trong trường hợp Khách Hàng vi phạm nghĩa vụ thanh toán  
                    theo quy định tại Điều 2 của Thỏa Thuận này quá 30 ngày hoặc
                    theo thời hạn khác do VinFast yêu cầu, Đơn Vị Hỗ Trợ Kỹ     
                    Thuật có quyền thực hiện các biện pháp can thiệp vào vận    
                    hành của xe, bao gồm nhưng không giới hạn ngắt vận hành xe, 
                    ngừng cung cấp dịch vụ liên quan đến xe. Trong vòng 02 ngày 
                    trước khi thực hiện, cảnh báo sẽ được hiển thị trên màn hình
                    chính của xe mỗi khi xe được khởi động. Để làm rõ, Đơn Vị Hỗ
                    Trợ Kỹ Thuật sẽ ngừng thực hiện các biện pháp can thiệp nêu 
                    trên khi Khách Hàng tuân thủ nghĩa vụ thanh toán Khoản Trả  
                    Chậm và/hoặc các khoản phí, lãi phạt và chi phí phát sinh   
                    khác liên quan (nếu có) đối với VinFast.
                  </p>
                </div>
              </div>

              {/* 3.2 */}
              <div className="space-y-2 mt-2">
                <p>
                  3.2. Khách Hàng đồng ý phối hợp, không cản trở và không có ý  
                  kiến gì khác khi VinFast/Đơn Vị Hỗ Trợ Kỹ Thuật và bất kỳ cán 
                  bộ nhân viên liên quan của các Bên thực hiện các nội dung quy 
                  định tại Điều 3.1 trên đây và tự mình chịu trách nhiệm đối với
                  bất kỳ tổn thất, thiệt hại phát sinh từ hoặc liên quan đến    
                  việc thực hiện Điều 3 này, ngay cả sau khi Thỏa Thuận đã chấm 
                  dứt, trừ khi pháp luật có quy định khác.
                </p>
              </div>
            </div>

            {/* Điều 4 */}
            <div className="mt-6 space-y-4">
              <h3 className="font-bold">Điều 4. Cam kết của Khách Hàng</h3>     

              {/* 4.1 */}
              <div className="space-y-2">
                <p>
                  4.1. Khách Hàng cam kết hoàn tất toàn bộ hồ sơ vay vốn với    
                  Ngân Hàng Cho Vay trong thời hạn tối đa 30 ngày kể từ ngày    
                  Khách Hàng được cấp đăng ký xe (cà vẹt) từ cơ quan có thẩm    
                  quyền. Để làm rõ <em>“hoàn tất hồ sơ vay vốn”</em> được hiểu  
                  là việc Khách Hàng đã ký kết đầy đủ hợp đồng tín dụng, hợp    
                  đồng thế chấp (nếu có), và thực hiện toàn bộ nghĩa vụ cung cấp
                  giấy tờ, ký nhận, cũng như các thủ tục cần thiết khác theo yêu
                  cầu của Ngân Hàng để khoản vay mua xe của Khách Hàng được giải
                  ngân cho Bên Bán.
                </p>
              </div>

              {/* 4.2 */}
              <div className="space-y-2">
                <p>
                  4.2. Trường hợp Khách Hàng không hoàn thành nghĩa vụ nêu trên 
                  hoặc giao dịch với Ngân Hàng Cho Vay bị từ chối/đình chỉ do   
                  lỗi của Khách Hàng, thì Khách Hàng cam kết bồi thường cho Bên 
                  Bán toàn bộ các chi phí, tổn thất và nghĩa vụ tài chính mà Bên
                  Bán phải gánh chịu phát sinh từ việc Khách Hàng không hoàn    
                  thành hồ sơ vay vốn, bao gồm nhưng không giới hạn ở: chi phí  
                  quản lý, xử lý hành chính; các khoản phạt, phí phát sinh với  
                  cơ quan Nhà nước hoặc đối tác thứ ba; các khoản thiệt hại khác
                  có liên quan trực tiếp.
                </p>
              </div>
            </div>

            {/* Điều 5 */}
            <div className="mt-6 space-y-4">
              <h3 className="font-bold">Điều 5. Hiệu lực của Thỏa Thuận</h3>    

              {/* 5.1 */}
              <div className="space-y-2">
                <p>
                  5.1. Thỏa Thuận này có hiệu lực kể từ ngày ký cho đến khi Các 
                  Bên hoàn thành nghĩa vụ theo Thỏa Thuận này.
                </p>
              </div>

              {/* 5.2 */}
              <div className="space-y-2">
                <p>
                  5.2. Bên Bán và Khách Hàng đồng ý và cam kết không chuyển     
                  nhượng, chuyển giao quyền và nghĩa vụ của mình theo Thỏa Thuận
                  này cho bất kỳ bên thứ ba nào nếu không được chấp thuận trước 
                  bằng văn bản của VinFast.
                </p>
              </div>

              {/* 5.3 */}
              <div className="space-y-2">
                <p>
                  5.3. Mọi sửa đổi, bổ sung Thỏa Thuận này phải được VinFast    
                  chấp thuận và lập thành văn bản và được ký bởi người đại diện 
                  hợp pháp của mỗi Bên. Các thay đổi không được VinFast chấp    
                  thuận theo quy định này sẽ bị xem là vô hiệu và không có giá  
                  trị pháp lý.
                </p>
              </div>

              {/* 5.4 */}
              <div className="space-y-2">
                <p>
                  5.4. Thỏa Thuận này được điều chỉnh theo các quy định của pháp
                  luật Việt Nam. Mọi tranh chấp phát sinh từ Thỏa Thuận này nếu 
                  không được giải quyết bằng thương lượng và hòa giải giữa Các  
                  Bên, thì sẽ được giải quyết tại Tòa án có thẩm quyền.
                </p>
              </div>

              {/* 5.5 */}
              <div className="space-y-2">
                <p>
                  5.5. Thỏa Thuận này được lập thành 04 (bốn) bản có giá trị như
                  nhau, mỗi Bên giữ 02 (hai) bản để thực hiện.
                </p>
              </div>
            </div>

            {/* Signature Section */}
            <div className="mt-12 mb-8 signature-block">
              <div className="flex justify-between">
                {/* Bên Bán */}
                <div className="flex-1 text-center">
                  <p className="font-bold signer-title uppercase">ĐẠI DIỆN BÊN BÁN</p>
                </div>

                {/* Khách Hàng */}
                <div className="flex-1 text-center">
                  <p className="font-bold signer-title uppercase">KHÁCH HÀNG</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-7xl mx-auto mt-8 print:hidden">
        <div className="text-center flex flex-wrap justify-center gap-3">
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
        </div>
      </div>
    </div>
  );
};

export default GiayThoaThuanTraCham;
