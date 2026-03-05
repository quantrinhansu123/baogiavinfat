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
import logoImage from "../../assets/images/logo.svg";

const PhuLucHopDong = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState(null);
  const [quaTang, setQuaTang] = useState("Áo trùm, bao tay lái, sáp thơm, bình chữa cháy.");
  const [giamGia, setGiamGia] = useState("");
  const [bangChu, setBangChu] = useState("");
  const [ngayHopDong, setNgayHopDong] = useState("");

  // Auto-generate bangChu when giamGia changes
  const handleGiamGiaChange = (value) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue) {
      const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      setGiamGia(formatted);
      setBangChu(vndToWords(numericValue));
    } else {
      setGiamGia("");
      setBangChu("");
    }
  };

  useEffect(() => {
    const loadShowroom = async () => {
      let showroomName = location.state?.showroom || "";
      
      // Nếu có firebaseKey, thử lấy showroom từ contracts
      if (location.state?.firebaseKey) {
        try {
          const contractId = location.state.firebaseKey;
          const contractsRef = ref(database, `contracts/${contractId}`);
          const snapshot = await get(contractsRef);
          if (snapshot.exists()) {
            const contractData = snapshot.val();
            if (contractData.showroom) {
              showroomName = contractData.showroom;
            }
          }
        } catch (err) {
          console.error("Error loading showroom from contracts:", err);
        }
      }
      
      // Lấy thông tin chi nhánh - không dùng default
      const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
      setBranch(branchInfo);

    if (location.state) {
      const incoming = location.state;
      const formatDateString = (val) => {
        if (!val) return null;
        // if already dd/mm/yyyy
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) return val;
        const d = new Date(val);
        if (isNaN(d)) return val;
        const pad = (n) => String(n).padStart(2, "0");
        return `${pad(d.getDate())}/${pad(
          d.getMonth() + 1
        )}/${d.getFullYear()}`;
      };

      const processedData = {
        contractNumber:
          incoming.vso || incoming.contractNumber || "S00901-VSO-25-09-0039",
        contractDate:
          formatDateString(incoming.createdAt || incoming.ngayXhd) ||
          formatDateString(new Date()),
        customerName:
          incoming.customerName || incoming.tenKh || incoming["Tên Kh"] || "",
        customerAddress:
          incoming.address || incoming.diaChi || incoming["Địa Chỉ"] || "",
        cccd: incoming.cccd || incoming.CCCD || "",
        cccdIssueDate:
          formatDateString(
            incoming.issueDate || incoming.ngayCap || incoming["Ngày Cấp"]
          ) || "",
        cccdIssuePlace:
          incoming.issuePlace ||
          incoming.noiCap ||
          incoming["Nơi Cấp"] ||
          "Bộ Công An",
        phone:
          incoming.phone ||
          incoming.soDienThoai ||
          incoming["Số Điện Thoại"] ||
          "",
        email: incoming.email || incoming.Email || "",
        deposit:
          incoming.deposit || incoming.giaGiam || incoming["Giá Giảm"] || "",
        counterpart:
          incoming.counterpartImage || incoming["Ảnh chụp đối ứng"] || "",
        depositImage:
          incoming.depositImage || incoming["Ảnh chụp hình đặt cọc"] || "",
        showroom: incoming.showroom || branchInfo?.shortName || "",
      };
      setData(processedData);
      setNgayHopDong(processedData.contractDate);
      
      // Load values for agreement section
      setQuaTang(incoming.quaTang || incoming["Quà tặng"] || "Áo trùm, bao tay lái, sáp thơm, bình chữa cháy.");
      
      // Format giamGia and auto-generate bangChu
      const giamGiaValue = incoming.soTienPhaiThu || incoming.giamGia || incoming["Giảm giá"] || "";
      if (giamGiaValue) {
        const numericValue = String(giamGiaValue).replace(/\D/g, "");
        if (numericValue) {
          setGiamGia(numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
          // Auto-generate bangChu
          setBangChu(incoming.bangChu || vndToWords(numericValue));
        } else {
          setGiamGia(giamGiaValue);
          setBangChu(incoming.bangChu || "");
        }
      } else {
        setGiamGia("");
        setBangChu(incoming.bangChu || "");
      }
    } else {
      // Dữ liệu mẫu - không set branch mặc định
      setBranch(null);
      const today = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const todayStr = `${pad(today.getDate())}/${pad(
        today.getMonth() + 1
      )}/${today.getFullYear()}`;

      setData({
        contractNumber: "S00901-VSO-25-09-0039",
        contractDate: todayStr,
        customerName: "NGÔ NGUYỄN HOÀI NAM",
        customerAddress:
          "Số 72/14 Đường tỉnh lộ 7, Ấp Bình Hạ, Thái Mỹ, Củ Chi, Tp Hồ Chí Minh",
        cccd: "079 099 014 151",
        cccdIssueDate: "18/12/2024",
        cccdIssuePlace: "Bộ Công An",
        phone: "093 412 2178",
        email: "hoainam191099@gmail.com",
        deposit: "",
        counterpart: "",
        depositImage: "",
        showroom: defaultBranch.shortName,
      });
    }
    };
    
    loadShowroom().then(() => {
      setLoading(false);
    });
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

  if (!data) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        style={{ fontFamily: "Times New Roman" }}
      >
        <div className="text-center">
          <p className="text-gray-600 mb-4">Không có dữ liệu hợp đồng</p>
          <button
            onClick={handleBack}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
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
      <div className="flex gap-6 max-w-4xl mx-auto print:max-w-4xl print:mx-auto">
        <div
          ref={printableRef}
          className="flex-1 bg-white pt-2 pb-8 px-8 print:pt-0"
          id="printable-content"
        >
          {/* Header with Logo */}
          <div className="">
            <div className="grid grid-cols-2 gap-4 items-start">
              {/* Logo VinFast - Column 1 (Left) */}
              <div className="flex items-center gap-3">
                <div className="w-32 h-32 flex items-center justify-center">
                  <img
                    src={logoImage}
                    alt="VinFast Logo"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              </div>

              {/* Quốc hiệu - Column 2 (Right, Centered) */}
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="font-bold text-sm mb-1">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </p>
                  <p className="font-bold text-sm mb-1">
                    Độc lập - Tự do - Hạnh phúc
                  </p>
                  <p className="font-bold text-sm mb-1">----o0o----</p>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-3">
            <h1 className="text-xl font-bold uppercase mb-2">PHỤ LỤC</h1>
            <h2 className="text-xl font-bold uppercase mb-2">
              CHO HỢP ĐỒNG MUA BÁN XE
            </h2>
            {data.contractNumber && (
              <p className="text-xl font-semibold">SỐ: {data.contractNumber}</p>
            )}
          </div>

          {/* Parties Section */}
          <div className="mb-3">
            <p className="text-sm italic mb-2">
              Hôm nay, ngày{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={ngayHopDong}
                  onChange={(e) => setNgayHopDong(e.target.value)}
                  className="border-b border-gray-400 px-1 w-28 focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">{ngayHopDong}</span>
              , tại Thành Phố Hồ Chí Minh, Chúng tôi gồm :
            </p>
            {/* Bên Bán */}
            <div className="mb-4">
              <div className="flex items-start mb-2">
                <span
                  className="font-bold text-sm underline inline-block"
                  style={{ minWidth: "100px" }}
                >
                  BÊN BÁN
                </span>
                <span className="font-bold text-sm">
                  : {branch?.name || "CHI NHÁNH TRƯỜNG CHINH - CÔNG TY CỔ PHẦN ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI GÒN"}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex items-start">
                  <span
                    className="font-semibold inline-block"
                    style={{ minWidth: "100px" }}
                  >
                    Địa chỉ
                  </span>
                  <span>: {branch?.address || "682A Trường Chinh, Phường Tân Bình, Tp Hồ Chí Minh"}</span>
                </div>
                <div className="flex items-start">
                  <span
                    className="font-semibold inline-block"
                    style={{ minWidth: "100px" }}
                  >
                    Đại diện bởi
                  </span>
                  <span>
                    : Ông {branch?.representativeName || "Nguyễn Thành Trai"}
                  </span>
                </div>
                <div className="flex items-start">
                  <span
                    className="font-semibold inline-block"
                    style={{ minWidth: "100px" }}
                  >
                    Chức vụ
                  </span>
                  <span>: {branch?.position || "Tổng Giám đốc"}</span>
                </div>
                <div className="flex items-start">
                  <span
                    className="font-semibold inline-block"
                    style={{ minWidth: "100px" }}
                  >
                    Tài khoản
                  </span>
                  <span>
                    : {branch?.bankAccount || "288999"} – tại{" "}
                    {branch?.bankName || "VP Bank"}
                  </span>
                </div>
                <div className="flex items-start">
                  <span
                    className="font-semibold inline-block"
                    style={{ minWidth: "100px" }}
                  >
                    Mã số thuế
                  </span>
                  <span>: {branch?.taxCode || "0316801817-002"}</span>
                </div>
                <p className="text-sm mt-1">
                  (Sau đây gọi là "<strong>Bên A</strong>")
                </p>
              </div>
            </div>

            {/* Bên Mua */}
            <div className="mb-4">
              <div className="flex items-start mb-2">
                <span
                  className="font-bold text-sm underline inline-block"
                  style={{ minWidth: "100px" }}
                >
                  BÊN MUA
                </span>
                <span className="font-bold text-sm">
                  : {data.customerName || ""}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex items-start">
                  <span
                    className="font-semibold inline-block"
                    style={{ minWidth: "100px" }}
                  >
                    Địa chỉ
                  </span>
                  <span>: {data.customerAddress || ""}</span>
                </div>
                <div className="flex items-start">
                  <span
                    className="font-semibold inline-block"
                    style={{ minWidth: "100px" }}
                  >
                    CCCD
                  </span>
                  <span>
                    : Số {data.cccd || ""}
                    {data.cccdIssueDate && <>, cấp ngày {data.cccdIssueDate}</>}
                    {data.cccdIssuePlace && <> bởi Bộ Công An</>}
                  </span>
                </div>
                {data.phone && (
                  <div className="flex items-start">
                    <span
                      className="font-semibold inline-block"
                      style={{ minWidth: "100px" }}
                    >
                      Số điện thoại
                    </span>
                    <span>: {data.phone}</span>
                  </div>
                )}
                {data.email && (
                  <div className="flex items-start">
                    <span
                      className="font-semibold inline-block"
                      style={{ minWidth: "100px" }}
                    >
                      Email
                    </span>
                    <span>: {data.email}</span>
                  </div>
                )}
                <p className="text-sm mt-1">
                  (Sau đây gọi là "<strong>Bên B</strong>")
                </p>
              </div>
            </div>
          </div>

          {/* Agreement Section */}
          <div className="mb-3">
            <p className="font-bold text-sm mb-3">
              Nay hai bên cùng thỏa thuận như sau:
            </p>
            <div className="pl-4 space-y-3 text-sm">
              {/* Quà tặng theo xe */}
              <div>
                <p className="font-semibold mb-1">
                  <span className="mr-2">•</span>
                  Quà tặng theo xe:{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={quaTang}
                      onChange={(e) => setQuaTang(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-bold w-full max-w-md focus:outline-none focus:border-blue-500"
                      placeholder="Áo trùm, bao tay lái, sáp thơm, bình chữa cháy."
                    />
                  </span>
                  <span className="hidden print:inline">{quaTang}</span>
                </p>
              </div>

              {/* Bên A đồng ý giảm cho Bên B */}
              <div>
                <span className="font-semibold mb-1 italic">
                  <span className="mr-2">•</span>
                  Bên A đồng ý giảm cho Bên B số tiền:{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={giamGia}
                      onChange={(e) => handleGiamGiaChange(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-bold italic w-full max-w-md focus:outline-none focus:border-blue-500"
                      placeholder="Nhập số tiền giảm"
                    />
                  </span>
                  <span className="hidden print:inline italic">{giamGia}</span>
                </span>
              </div>
              {/* Bằng chữ */}
              <div className="text-sm">
                <p className="font-bold italic">
                  Bằng chữ :{" "}
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={bangChu}
                      onChange={(e) => setBangChu(e.target.value)}
                      className="border-b border-gray-400 px-2 py-1 text-sm font-normal italic w-full max-w-md focus:outline-none focus:border-blue-500"
                      placeholder="Nhập bằng chữ"
                    />
                  </span>
                  <span className="hidden print:inline italic">{bangChu}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Closing */}
          <div className="mb-3 text-sm">
            <div className="flex items-start">
              <span>
                Phụ lục này không thể tách rời cho hợp đồng số:{" "}
                <span className="font-semibold">
                  {data.contractNumber || ""}
                </span>
              </span>
              <span className="ml-2">và được lập thành 2 bản.</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between">
            <div className="flex-1 text-center">
              <p className="font-bold mb-8">ĐẠI DIỆN BÊN BÁN</p>
            </div>
            <div className="flex-1 text-center">
              <p className="font-bold mb-32">ĐẠI DIỆN BÊN MUA</p>
              <p className="text-sm font-semibold">VINFAST ĐÔNG SÀI GÒN</p>
            </div>
          </div>

          {/* Footer */}
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
          In Phụ Lục
        </button>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 8mm;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: 297mm !important;
            overflow: hidden !important;
          }
          
          body * {
            visibility: hidden;
          }
          
          #printable-content,
          #printable-content * {
            visibility: visible;
          }
          
          .min-h-screen {
            min-height: 0 !important;
            height: auto !important;
          }
          
          #printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 194mm !important;
            min-height: 0 !important;
            height: auto !important;
            max-height: 281mm !important;
            overflow: hidden !important;
            padding: 5mm !important;
            margin: 0 !important;
            background: white !important;
            font-family: 'Times New Roman', Times, serif !important;
            font-size: 11pt !important;
            line-height: 1.3 !important;
            box-sizing: border-box !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PhuLucHopDong;
