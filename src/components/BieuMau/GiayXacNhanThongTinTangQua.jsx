import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import { downloadElementAsPdf } from "../../utils/pdfExport";

const GiayXacNhanThongTinTangQua = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editable fields for customer information
  const [customerName, setCustomerName] = useState("");
  const [vin, setVin] = useState("");

  // Editable fields for recipient information
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientCCCD, setRecipientCCCD] = useState("");
  const [recipientCity, setRecipientCity] = useState("");
  const [recipientWard, setRecipientWard] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [confirmInfo, setConfirmInfo] = useState(false);
  const [confirmConsent, setConfirmConsent] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (location.state?.firebaseKey) {
        try {
          // Thử exportedContracts trước (vì đây là từ trang hợp đồng đã xuất)
          let contractsRef = ref(database, `exportedContracts/${location.state.firebaseKey}`);
          let snapshot = await get(contractsRef);
          
          if (!snapshot.exists()) {
            // Nếu không có trong exportedContracts, thử contracts
            contractsRef = ref(database, `contracts/${location.state.firebaseKey}`);
            snapshot = await get(contractsRef);
          }
          
          if (snapshot.exists()) {
            setData(snapshot.val());
          }
        } catch (error) {
          console.error("Error loading contract data:", error);
        }
      }
      
      // Lấy dữ liệu từ location.state nếu có
      if (location.state) {
        const stateData = location.state;
        setData(stateData);
        
        // Set giá trị ban đầu cho các trường có thể chỉnh sửa
        setCustomerName(stateData.customerName || stateData.hoTen || "");
        setVin(stateData.vin || stateData.soKhung || "");
      }
      
      setLoading(false);
    };

    loadData();
  }, [location.state]);

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
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
          className="flex-1 bg-white p-8 print:pt-0 flex flex-col min-h-screen print:min-h-[calc(100vh-40mm)]"
          id="printable-content"
        >

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold mb-2">
              PHIẾU XÁC NHẬN THÔNG TIN NHẬN QUÀ VINFAST
            </h1>
            <p className="text-sm italic">
              (Áp dụng cho xe xuất hóa đơn từ 01/12/2025 đến 31/01/2026)
            </p>
          </div>

          <div className="mb-6">
            <p className="font-semibold">
              Kính gửi: Công ty TNHH Kinh Doanh Thương Mại và Dịch vụ VinFast (VinFast)
            </p>
          </div>

          {/* Section I - Customer Information */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-4">I. THÔNG TIN KHÁCH HÀNG</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-semibold w-40">Họ và tên khách hàng:</span>
                <span className="print:hidden flex-1">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline border-b border-dotted border-gray-400 flex-1 min-h-[24px] px-2">
                  {customerName}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-40">VIN:</span>
                <span className="print:hidden flex-1">
                  <input
                    type="text"
                    value={vin}
                    onChange={(e) => setVin(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline border-b border-dotted border-gray-400 flex-1 min-h-[24px] px-2">
                  {vin}
                </span>
              </div>
            </div>
          </div>

          {/* Section II - Gift Recipient Information */}
          <div className="mb-8">
            <h3 className="font-bold text-lg mb-2">II. THÔNG TIN NGƯỜI NHẬN QUÀ</h3>
            <p className="text-sm italic mb-4">
              (Khách hàng vui lòng điền đầy đủ thông tin để VinFast giao quà đúng đối tượng và địa chỉ)
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="font-semibold w-40">Họ và tên người nhận quà:</span>
                <span className="print:hidden flex-1">
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline border-b border-dotted border-gray-400 flex-1 min-h-[24px]">
                  {recipientName}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-40">Số điện thoại:</span>
                <span className="print:hidden flex-1">
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline border-b border-dotted border-gray-400 flex-1 min-h-[24px]">
                  {recipientPhone}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-40">Số CCCD:</span>
                <span className="print:hidden flex-1">
                  <input
                    type="text"
                    value={recipientCCCD}
                    onChange={(e) => setRecipientCCCD(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline border-b border-dotted border-gray-400 flex-1 min-h-[24px]">
                  {recipientCCCD}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-40">Thành phố/Tỉnh:</span>
                <span className="print:hidden flex-1">
                  <input
                    type="text"
                    value={recipientCity}
                    onChange={(e) => setRecipientCity(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline border-b border-dotted border-gray-400 flex-1 min-h-[24px]">
                  {recipientCity}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-40">Xã/Phường:</span>
                <span className="print:hidden flex-1">
                  <input
                    type="text"
                    value={recipientWard}
                    onChange={(e) => setRecipientWard(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline border-b border-dotted border-gray-400 flex-1 min-h-[24px]">
                  {recipientWard}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-semibold w-40">Địa chỉ:</span>
                <span className="print:hidden flex-1">
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm w-full focus:outline-none focus:border-blue-500"
                  />
                </span>
                <span className="hidden print:inline border-b border-dotted border-gray-400 flex-1 min-h-[24px]">
                  {recipientAddress}
                </span>
              </div>
            </div>
          </div>

          {/* Confirmation Section */}
          <div className="mb-8">
            <h3 className="font-bold mb-4">XÁC NHẬN: (Chọn ✓ hoặc X vào các ô bên dưới)</h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="print:hidden mr-3 mt-1 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={confirmInfo}
                    onChange={(e) => setConfirmInfo(e.target.checked)}
                    className="w-5 h-5"
                  />
                </div>
                <div className="hidden print:flex w-6 h-6 border-2 border-black mr-3 mt-1 flex-shrink-0 items-center justify-center">
                  {confirmInfo && <span className="text-lg font-bold">✓</span>}
                </div>
                <span>Tôi xác nhận toàn bộ thông tin trên là chính xác.</span>
              </div>
              
              <div className="flex items-start">
                <div className="print:hidden mr-3 mt-1 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={confirmConsent}
                    onChange={(e) => setConfirmConsent(e.target.checked)}
                    className="w-5 h-5"
                  />
                </div>
                <div className="hidden print:flex w-6 h-6 border-2 border-black mr-3 mt-1 flex-shrink-0 items-center justify-center">
                  {confirmConsent && <span className="text-lg font-bold">✓</span>}
                </div>
                <div>
                  <p className="mb-2">
                    Tôi đồng ý, và có đủ cơ sở, để cho phép VinFast (và các bên liên quan, như đại lý gần địa điểm cần 
                    giao quà) được xử lý dữ liệu cá nhân do tôi cung cấp tại đây cho mục đích giao quà và giải quyết các 
                    vấn đề phát sinh, theo Chính sách bảo vệ dữ liệu cá nhân do VinFast công bố tại{' '}
                    <a 
                      href="https://vinfastauto.com/vn_vi/privacy-policy" 
                      className="text-blue-600 underline print:text-black"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      https://vinfastauto.com/vn_vi/privacy-policy
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="text-right mt-12">
            <p className="mb-2">Ngày.........tháng.........năm......</p>
            <p className="font-bold mb-2">Khách hàng</p>
            <p className="text-sm italic">(Ký và ghi rõ họ tên)</p>
            <div className="h-20"></div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center mt-8 print:hidden flex flex-wrap justify-center gap-3">
        <button
          onClick={handleClose}
          className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
        >
          Quay lại
        </button>
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          In Phiếu
        </button>
        <button
          onClick={() => { setDownloadingPdf(true); downloadElementAsPdf(printableRef.current, "giay-xac-nhan-thong-tin-tang-qua").then(() => setDownloadingPdf(false)).catch(() => setDownloadingPdf(false)); }}
          disabled={downloadingPdf}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloadingPdf ? "Đang tạo PDF..." : "Tải PDF"}
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
          
          .border-b {
            border-bottom: 1px dotted #000 !important;
          }
          
          .border-2 {
            border: 2px solid #000 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GiayXacNhanThongTinTangQua;