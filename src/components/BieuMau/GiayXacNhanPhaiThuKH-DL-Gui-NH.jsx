import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import {
  getBranchByShowroomName,
  getDefaultBranch,
} from "../../data/branchData";
import { vndToWords } from "../../utils/vndToWords";
import { formatCurrency, formatDate } from "../../utils/formatting";
import { PrintStyles } from "./PrintStyles";
import { downloadElementAsPdf } from "../../utils/pdfExport";

const GiayXacNhanPhaiThuKH_DL_Gui_NH = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);

  // Editable fields
  const [tpHCM, setTpHCM] = useState("Tp Hồ Chí Minh");
  const [ngay, setNgay] = useState("");
  const [thang, setThang] = useState("");
  const [nam, setNam] = useState("");

  // Company info
  const [congTy, setCongTy] = useState("");
  const [diaChiTruSo, setDiaChiTruSo] = useState("");
  const [maSoDN, setMaSoDN] = useState("");
  const [daiDien, setDaiDien] = useState("");
  const [chucVu, setChucVu] = useState("");
  const [giayUyQuyen, setGiayUyQuyen] = useState("");

  // Contract info
  const [soHopDong, setSoHopDong] = useState("");
  const [ngayKyHopDong, setNgayKyHopDong] = useState("");
  const [giaTriHopDong, setGiaTriHopDong] = useState("");
  const [ongBa, setOngBa] = useState("");
  const [modelXe, setModelXe] = useState("");
  const [mucDichMuaBanXe, setMucDichMuaBanXe] = useState("");
  const [congTySauBangVan, setCongTySauBangVan] = useState("");
  const [congNoPhaiThanh, setCongNoPhaiThanh] = useState("");
  const [soTienConLai, setSoTienConLai] = useState("");
  const [soTienBangChu, setSoTienBangChu] = useState("");
  const [giaTriHopDongBangChu, setGiaTriHopDongBangChu] = useState("");
  const [soTienVay, setSoTienVay] = useState("");
  const [soTienVayBangChu, setSoTienVayBangChu] = useState("");

  // Bank info
  const [soTaiKhoan, setSoTaiKhoan] = useState("");
  const [nganHang, setNganHang] = useState("");
  const [chiNhanh, setChiNhanh] = useState("");
  const [chuTaiKhoan, setChuTaiKhoan] = useState("");
  const [congTyTaiKhoan, setCongTyTaiKhoan] = useState("");


  useEffect(() => {
    const loadData = async () => {
      let showroomName = location.state?.showroom || "";
      let contractData = null;
      let showroomLoadedFromContracts = false;

      // Set default date
      const today = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      setNgay(pad(today.getDate()));
      setThang(pad(today.getMonth() + 1));
      setNam(today.getFullYear().toString());

      // Nếu có firebaseKey, thử lấy showroom từ exportedContracts trước, sau đó mới từ contracts
      if (location.state?.firebaseKey) {
        try {
          const contractId = location.state.firebaseKey;

          // Thử load từ exportedContracts trước (dữ liệu mới nhất)
          const exportedContractsRef = ref(database, `exportedContracts/${contractId}`);
          const exportedSnapshot = await get(exportedContractsRef);

          if (exportedSnapshot.exists()) {
            contractData = exportedSnapshot.val();
            console.log("Loaded from exportedContracts:", contractData);        
            if (contractData.showroom) {
              showroomName = contractData.showroom;
              showroomLoadedFromContracts = true;
              console.log("Showroom loaded from exportedContracts:", showroomName);
            }
          } else {
            // Nếu không có trong exportedContracts, thử load từ contracts      
            const contractsRef = ref(database, `contracts/${contractId}`);      
            const snapshot = await get(contractsRef);
            if (snapshot.exists()) {
              contractData = snapshot.val();
              console.log("Loaded from contracts:", contractData);
              if (contractData.showroom) {
                showroomName = contractData.showroom;
                showroomLoadedFromContracts = true;
                console.log("Showroom loaded from contracts:", showroomName);   
              }
            } else {
              console.log("Contract not found in both exportedContracts and contracts paths");
            }
          }
        } catch (error) {
          console.error("Error loading contract data:", error);
        }
      }

      // Lấy thông tin chi nhánh chỉ khi có showroom
      let branchInfo = null;
      if (showroomName) {
        branchInfo = getBranchByShowroomName(showroomName);
        setBranch(branchInfo);
      } else {
        setBranch(null);
      }

      // Auto-fill thông tin công ty từ branch (chỉ khi có branch)
      if (branchInfo) {
        setCongTy(branchInfo.name.toUpperCase());
        setDiaChiTruSo(branchInfo.address);
        setMaSoDN(branchInfo.taxCode || "");
        setDaiDien(branchInfo.representativeName || "");
        setChucVu(branchInfo.position || "");

        // Auto-fill thông tin ngân hàng từ branch
        setSoTaiKhoan(branchInfo.bankAccount || "");
        setNganHang(branchInfo.bankName || "");
        setChiNhanh(branchInfo.bankBranch || "");
        setChuTaiKhoan(branchInfo.representativeName || "");
        setCongTyTaiKhoan(branchInfo.accountHolder || branchInfo.name || "");   
      } else {
        // Reset thông tin công ty khi không có branch
        setCongTy("");
        setDiaChiTruSo("");
        setMaSoDN("");
        setDaiDien("");
        setChucVu("");
        setSoTaiKhoan("");
        setNganHang("");
        setChiNhanh("");
        setChuTaiKhoan("");
        setCongTyTaiKhoan("");
      }

      // Sử dụng dữ liệu từ database hoặc location.state
      const dataSource = contractData || location.state || {};

      // Auto-fill từ dữ liệu hợp đồng
      if (dataSource && Object.keys(dataSource).length > 0) {
        setData(dataSource);

        // Thông tin khách hàng
        const customerName =
          dataSource.customerName ||
          dataSource["Tên KH"] ||
          dataSource["Tên Kh"] ||
          "";
        if (customerName) setOngBa(customerName);

        // Model xe
        const model =
          dataSource.model || dataSource.dongXe || dataSource["Dòng xe"] || ""; 
        if (model) setModelXe(model);

        // Số hợp đồng (mã hợp đồng)
        const contractNumber =
          dataSource.vso ||
          dataSource["VSO"] ||
          dataSource.soHopDong ||
          dataSource.contractNumber ||
          "";
        if (contractNumber) setSoHopDong(contractNumber);

        // Ngày ký hợp đồng
        const contractDate =
          dataSource.contractDate ||
          dataSource.createdAt ||
          dataSource.createdDate ||
          "";
        if (contractDate) {
          setNgayKyHopDong(formatDate(contractDate));
        }

        // Giá trị hợp đồng
        const contractPrice =
          dataSource.contractPrice ||
          dataSource.giaHD ||
          dataSource["Giá Hợp Đồng"] ||
          dataSource.totalPrice ||
          "";
        if (contractPrice) {
          const priceValue =
            typeof contractPrice === "string"
              ? contractPrice.replace(/\D/g, "")
              : String(contractPrice);
          setGiaTriHopDong(formatCurrency(priceValue));
          setGiaTriHopDongBangChu(vndToWords(priceValue));
        }

        // Số tiền còn lại (nếu có)
        const remainingAmount =
          dataSource.soTienConLai ||
          dataSource["Số Tiền Còn Lại"] ||
          dataSource.remainingAmount ||
          "";
        if (remainingAmount) {
          const amountValue =
            typeof remainingAmount === "string"
              ? remainingAmount.replace(/\D/g, "")
              : String(remainingAmount);
          setSoTienConLai(formatCurrency(amountValue));
          setSoTienBangChu(vndToWords(amountValue));
        }

        // Số tiền Khách Hàng vay Ngân hàng (nếu có)
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
          setSoTienVay(formatCurrency(loanValue));
          setSoTienVayBangChu(vndToWords(loanValue));
        }

        // Thông tin ngân hàng (nếu có)
        if (dataSource.bankAccount) setSoTaiKhoan(dataSource.bankAccount);      
        if (dataSource.bankName) setNganHang(dataSource.bankName);
        if (dataSource.bankBranch) setChiNhanh(dataSource.bankBranch);
      } else {
        setData({
          customerName: "",
          contractDate: "",
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
      className="min-h-screen bg-gray-50 p-8 print:p-0 print:m-0 print:bg-white print:min-h-0"
      style={{ fontFamily: "Times New Roman" }}
    >
      <PrintStyles />
      <div className="max-w-4xl mx-auto print:max-w-none print:mx-0">
        <div ref={printableRef} className="bg-white p-12 print:p-0 print:bg-white print:shadow-none text-[14px] print:text-[14px]" id="printable-content">
          {/* Header */}
          <div className="text-center mb-2">
            <p className="font-bold uppercase">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </p>
            <p className="font-bold">Độc lập – Tự do – Hạnh Phúc</p>
            <div className="border-b border-gray-800 w-40 mx-auto mt-1"></div>  
          </div>

          <div className="text-right mb-4 italic">
            <span className="print:hidden">
              <input
                type="text"
                value={tpHCM}
                onChange={(e) => setTpHCM(e.target.value)}
                className="border-b border-gray-400 px-1 w-40 text-center focus:outline-none focus:border-blue-500"
              />
            </span>
            <span className="hidden print:inline">{tpHCM}</span>, ngày{" "}     
            <span className="print:hidden">
              <input
                type="text"
                value={ngay}
                onChange={(e) => setNgay(e.target.value)}
                className="border-b border-gray-400 px-1 w-12 text-center focus:outline-none focus:border-blue-500"
              />
            </span>
            <span className="hidden print:inline">{ngay}</span> tháng{" "}      
            <span className="print:hidden">
              <input
                type="text"
                value={thang}
                onChange={(e) => setThang(e.target.value)}
                className="border-b border-gray-400 px-1 w-12 text-center focus:outline-none focus:border-blue-500"
              />
            </span>
            <span className="hidden print:inline">{thang}</span> năm{" "}       
            <span className="print:hidden">
              <input
                type="text"
                value={nam}
                onChange={(e) => setNam(e.target.value)}
                className="border-b border-gray-400 px-1 w-20 text-center focus:outline-none focus:border-blue-500"
              />
            </span>
            <span className="hidden print:inline">{nam}</span>
          </div>

          {/* Title */}
          <h1 className="text-center text-[20px] font-bold mb-8 uppercase">
            GIẤY XÁC NHẬN CÔNG NỢ
          </h1>

          {/* Company Info */}
          <div className="mb-3 space-y-1">
            {branch ? (
              <>
                <div className="flex">
                  <span className="hidden print:inline font-bold flex-grow uppercase">{congTy}</span>
                  <span className="print:hidden flex-grow uppercase">
                    <input
                      type="text"
                      value={congTy}
                      onChange={(e) => setCongTy(e.target.value)}
                      className="border-b border-gray-400 font-bold uppercase px-1 w-full focus:outline-none focus:border-blue-500"
                    />
                  </span>
                </div>
                <div className="info-row grid-cols-[150px_1fr]">
                  <span className="info-label w-[150px]">Địa chỉ trụ sở chính:</span>
                  <div className="info-value">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={diaChiTruSo}
                        onChange={(e) => setDiaChiTruSo(e.target.value)}
                        className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{diaChiTruSo}</span>
                  </div>
                </div>
                <div className="info-row grid-cols-[150px_1fr]">
                  <span className="info-label w-[150px]">Mã số doanh nghiệp:</span>
                  <div className="info-value">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={maSoDN}
                        onChange={(e) => setMaSoDN(e.target.value)}
                        className="border-b border-gray-400 px-1 w-64 focus:outline-none focus:border-blue-500 font-bold"
                      />
                    </span>
                    <span className="hidden print:inline font-bold">{maSoDN}</span>
                  </div>
                </div>
                <div className="info-row grid-cols-[150px_1fr]">
                  <span className="info-label w-[150px]">Đại diện:</span>        
                  <div className="info-value">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={daiDien}
                        onChange={(e) => setDaiDien(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{daiDien}</span>
                  </div>
                </div>
                <div className="info-row grid-cols-[150px_1fr]">
                  <span className="info-label w-[150px]">Chức vụ:</span>
                  <div className="info-value">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={chucVu}
                        onChange={(e) => setChucVu(e.target.value)}
                        className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{chucVu}</span>
                  </div>
                </div>
                <div className="info-row grid-cols-[150px_1fr]">
                  <span className="info-label w-[150px]">(Theo giấy ủy quyền số:</span>
                  <div className="info-value">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={giayUyQuyen}
                        onChange={(e) => setGiayUyQuyen(e.target.value)}
                        className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{giayUyQuyen}</span>)
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500 italic">[Chưa chọn showroom - Thông tin công ty sẽ hiển thị khi chọn showroom]</p>
            )}
          </div>

          {/* Content */}
          <div className="mb-6 space-y-3 text-left leading-relaxed">
            <p>Nội dung xác nhận:</p>

            <p>
              Căn cứ vào hợp đồng mua bán xe ô tô số{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={soHopDong}
                  onChange={(e) => setSoHopDong(e.target.value)}
                  className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="Nhập số hợp đồng"
                />
              </span>
              <span className="hidden print:inline font-bold">
                {soHopDong || "______"}
              </span>{" "}
              ký ngày{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={ngayKyHopDong}
                  onChange={(e) => setNgayKyHopDong(e.target.value)}
                  className="border-b border-gray-400 px-1 w-32 focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="Nhập ngày ký"
                />
              </span>
              <span className="hidden print:inline font-bold">
                {ngayKyHopDong || "______"}
              </span>{" "}
              giữa{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={congTy}
                  onChange={(e) => setCongTy(e.target.value)}
                  className="border-b border-gray-400 px-1 font-bold w-64 focus:outline-none focus:border-blue-500"
                  placeholder="Công ty"
                />
              </span>
              <span
                className="hidden print:inline font-bold uppercase"
              >
                {congTy || "[Chưa chọn showroom]"}
              </span>{" "}
              và{" "}
              <strong>Ông/Bà</strong>{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={ongBa}
                  onChange={(e) => setOngBa(e.target.value)}
                  className="border-b border-gray-400 px-1 w-64 focus:outline-none focus:border-blue-500 font-bold uppercase"
                />
              </span>
              <span className="hidden print:inline font-bold uppercase">{ongBa}</span> về việc mua  
              bán xe{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={modelXe}
                  onChange={(e) => setModelXe(e.target.value)}
                  className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500 font-bold uppercase"
                  placeholder="Nhập model xe"
                />
              </span>
              <span className="hidden print:inline font-bold uppercase">{modelXe || "______"}</span>{" "}
              với giá trị hợp đồng{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={giaTriHopDong}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setGiaTriHopDong(formatCurrency(val));
                    setGiaTriHopDongBangChu(vndToWords(val));
                  }}
                  className="border-b border-gray-400 font-bold px-1 w-48 focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline font-bold">{giaTriHopDong}</span>
              <strong>{" "}VNĐ</strong> <em className="font-bold">(Bằng chữ:</em>{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={giaTriHopDongBangChu}
                  onChange={(e) => setGiaTriHopDongBangChu(e.target.value)}     
                  className="border-b border-gray-400 px-1 w-full font-bold italic focus:outline-none focus:border-blue-500"
                  placeholder="Nhập bằng chữ"
                />
              </span>
              <span className="hidden print:inline font-bold italic">
                {giaTriHopDongBangChu || "______"}
              </span>
              <strong>)</strong>. Bằng văn bản này:{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={congTy}
                  onChange={(e) => setCongTy(e.target.value)}
                  className="border-b border-gray-400 px-1 font-bold w-auto focus:outline-none focus:border-blue-500 uppercase"
                  placeholder="Công ty"
                />
              </span>
              <span
                className="hidden print:inline font-bold uppercase"
              >
                {congTy || "[Chưa chọn showroom]"}
              </span>{" "}
              xác nhận <strong>Ông/Bà</strong>{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={ongBa}
                  onChange={(e) => setOngBa(e.target.value)}
                  className="border-b border-gray-400 px-1 w-auto focus:outline-none focus:border-blue-500 font-bold uppercase"
                />
              </span>
              <span className="hidden print:inline font-bold uppercase">{ongBa}</span> còn phải     
              thanh toán số tiền còn lại là{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={soTienConLai}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setSoTienConLai(formatCurrency(val));
                    setSoTienBangChu(vndToWords(val));
                  }}
                  className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="Nhập số tiền"
                />
              </span>
              <span className="hidden print:inline font-bold">
                {soTienConLai || "______"} VNĐ
              </span>{" "}
              <em className="font-bold">(Bằng chữ:</em>{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={soTienBangChu}
                  onChange={(e) => setSoTienBangChu(e.target.value)}
                  className="border-b border-gray-400 px-1 w-full font-bold italic focus:outline-none focus:border-blue-500"
                  placeholder="Nhập bằng chữ"
                />
              </span>
              <span className="hidden print:inline font-bold italic">
                {soTienBangChu || "______"}
              </span>
              <strong>)</strong>. Số tiền Khách Hàng vay Ngân hàng để thanh     
              toán:{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={soTienVay}
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const val = rawValue.replace(/\D/g, "");
                    setSoTienVay(formatCurrency(val));
                    // Tự động chuyển số tiền sang chữ khi nhập
                    if (val && val.length > 0) {
                      const numValue = parseInt(val, 10);
                      if (!isNaN(numValue) && numValue > 0) {
                        setSoTienVayBangChu(vndToWords(val));
                      } else {
                        setSoTienVayBangChu("");
                      }
                    } else {
                      setSoTienVayBangChu("");
                    }
                  }}
                  className="border-b border-gray-400 px-1 w-48 focus:outline-none focus:border-blue-500 font-bold"
                  placeholder="Nhập số tiền vay"
                />
              </span>
              <span className="hidden print:inline font-bold">
                {soTienVay || "______"} VNĐ
              </span>{" "}
              <em className="font-bold">(Bằng chữ:</em>{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={soTienVayBangChu}
                  onChange={(e) => setSoTienVayBangChu(e.target.value)}
                  className="border-b border-gray-400 px-1 w-full font-bold italic focus:outline-none focus:border-blue-500"
                  placeholder="Nhập bằng chữ"
                />
              </span>
              <span className="hidden print:inline font-bold italic">
                {soTienVayBangChu || "______"}
              </span>
              <strong>)</strong>. Dựa theo thông báo cho vay đã phê duyệt, kính 
              đề nghị quý ngân hàng giải ngân số tiền còn lại theo thông báo cho
              vay theo thông tin số tài khoản dưới đây
            </p>
          </div>

          {/* Bank Info */}
          <div className="mb-6 space-y-1">
            {branch ? (
              <>
                <div className="info-row grid-cols-[150px_1fr]">
                  <span className="info-label w-[150px]">Số tài khoản:</span>    
                  <div className="info-value font-bold">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={soTaiKhoan}
                        onChange={(e) => setSoTaiKhoan(e.target.value)}
                        className="border-b border-gray-400 px-1 w-64 focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{soTaiKhoan}</span>
                  </div>
                </div>
                <div className="info-row grid-cols-[150px_1fr]">
                  <span className="info-label w-[150px]">Ngân hàng:</span>        
                  <div className="info-value font-bold">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={nganHang}
                        onChange={(e) => setNganHang(e.target.value)}
                        className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{nganHang}</span>
                  </div>
                </div>
                <div className="info-row grid-cols-[150px_1fr]">
                  <span className="info-label w-[150px]">Chi nhánh:</span>       
                  <div className="info-value font-bold">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={chiNhanh}
                        onChange={(e) => setChiNhanh(e.target.value)}
                        className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500"
                      />
                    </span>
                    <span className="hidden print:inline">{chiNhanh}</span>
                  </div>
                </div>
                <div className="info-row grid-cols-[150px_1fr]">
                  <span className="info-label w-[150px]">Chủ tài khoản:</span>   
                  <div className="info-value font-bold uppercase">
                    <span className="print:hidden">
                      <input
                        type="text"
                        value={congTyTaiKhoan}
                        onChange={(e) => setCongTyTaiKhoan(e.target.value)}       
                        className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500 uppercase"
                      />
                    </span>
                    <span className="hidden print:inline">
                      {congTyTaiKhoan || "______"}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500 italic">[Thông tin ngân hàng sẽ hiển thị khi chọn showroom]</p>
            )}
          </div>

          <p className="mb-3">Xin chân thành cảm ơn!</p>

          {/* Signature */}
          <div className="flex w-full justify-between mt-12 signature-block">
            <div className="w-1/2 text-center">
              <p className="font-bold mb-1 signer-title uppercase">XÁC NHẬN CỦA NGÂN HÀNG</p>
              <p className="italic mb-20">(Ký tên, Đóng dấu)</p>
              <p className="font-bold uppercase">
                <span className="print:hidden">
                  <input
                    type="text"
                    value="" // This will be dynamic in a real app
                    className="border-b border-gray-800 px-1 w-64 text-center focus:outline-none focus:border-blue-500"
                    placeholder="[Tên Ngân hàng]"
                  />
                </span>
                <span className="hidden print:inline">[Tên Ngân hàng]</span>    
              </p>
            </div>
            <div className="w-1/2 text-center">
              <p className="font-bold mb-1 signer-title uppercase">ĐẠI DIỆN THEO PHÁP LUẬT CỦA CÔNG TY</p>
              <p className="italic mb-20">(Ký tên, Đóng dấu)</p>
              <p className="font-bold uppercase">
                <span className="print:hidden">
                  <input
                    type="text"
                    value={daiDien}
                    onChange={(e) => setDaiDien(e.target.value)}
                    className="border-b border-gray-800 px-1 w-64 text-center focus:outline-none focus:border-blue-500"
                    placeholder="[Họ và tên]"
                  />
                </span>
                <span className="hidden print:inline">{daiDien}</span>
              </p>
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
          In Giấy Xác Nhận
        </button>
        <button
          onClick={() => { setDownloadingPdf(true); downloadElementAsPdf(printableRef.current, "giay-xac-nhan-phai-thu-kh-dl-gui-nh").then(() => setDownloadingPdf(false)).catch(() => setDownloadingPdf(false)); }}
          disabled={downloadingPdf}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloadingPdf ? "Đang tạo PDF..." : "Tải PDF"}
        </button>
      </div>
    </div>
  );
};

export default GiayXacNhanPhaiThuKH_DL_Gui_NH;
