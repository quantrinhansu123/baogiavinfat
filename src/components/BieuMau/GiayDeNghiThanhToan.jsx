import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getBranchByShowroomName,
  getDefaultBranch,
} from "../../data/branchData";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/config";
import { uniqueNgoaiThatColors } from "../../data/calculatorData";
import { vndToWords } from "../../utils/vndToWords";
import { formatCurrency, formatDate } from "../../utils/formatting";

const GiayDeNghiThanhToan = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printableRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipientInfo, setRecipientInfo] = useState(
    "Trung Tâm Thế Chấp Vùng 9"
  );
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [branch, setBranch] = useState(null);

  // Editable fields
  const [companyName, setCompanyName] = useState(
    "CÔNG TY CỔ PHẦN ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI GÒN"
  );
  const [branchName, setBranchName] = useState("");
  const [bankName, setBankName] = useState(
    "NGÂN HÀNG TMCP VIỆT NAM THỊNH VƯỢNG-VP BANK"
  );
  const [accountHolder, setAccountHolder] = useState("");

  // Editable date field - default to current date
  const today = new Date();
  const [headerDate, setHeaderDate] = useState(
    `TP.HCM, Ngày ${today.getDate()} Tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`
  );

  // Helper function to get shortName from showroom (similar to GiayXacNhanThongTin.jsx)
  const getShowroomShortName = (showroomValue) => {
    if (!showroomValue) return "Trường Chinh";
    // Try to find branch by showroom name
    const foundBranch = getBranchByShowroomName(showroomValue);
    if (foundBranch) {
      return foundBranch.shortName;
    }
    return "Trường Chinh"; // Default fallback
  };

  // Helper function to get color name from color code
  const getColorName = (colorCode) => {
    if (!colorCode) return colorCode || "";
    const found = uniqueNgoaiThatColors.find(
      (color) =>
        color.code === colorCode ||
        color.name.toLowerCase() === colorCode.toLowerCase()
    );
    return found ? found.name : colorCode; // Return name if found, otherwise return original value
  };

  // Helper function to calculate advance payment (giaXuatHoaDon - soTienVay)
  const calculateAdvancePayment = (giaXuatHoaDon, soTienVay) => {
    const giaXuatHoaDonNum =
      typeof giaXuatHoaDon === "string"
        ? giaXuatHoaDon.replace(/\D/g, "")
        : String(giaXuatHoaDon);
    const soTienVayNum =
      typeof soTienVay === "string"
        ? soTienVay.replace(/\D/g, "")
        : String(soTienVay);

    const giaXuat = parseInt(giaXuatHoaDonNum, 10) || 0;
    const tienVay = parseInt(soTienVayNum, 10) || 0;
    const advancePayment = giaXuat - tienVay;

    return advancePayment > 0 ? advancePayment.toString() : "0";
  };

  useEffect(() => {
    const loadData = async () => {
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

        // Lấy thông tin chi nhánh
        let showroomName = incoming.showroom || "";

        // Nếu có firebaseKey, thử lấy showroom từ contracts
        if (incoming.firebaseKey) {
          try {
            const contractId = incoming.firebaseKey;
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

        const branchInfo = showroomName ? getBranchByShowroomName(showroomName) : null;
        setBranch(branchInfo);

        // Logic mới: Giá bán = Giá xuất hóa đơn
        // Số tiền trả trước = Giá xuất hóa đơn - Số tiền vay
        // Số tiền còn thiếu (ngân hàng thanh toán) = Số tiền vay
        const giaXuatHoaDon = incoming.giaXuatHoaDon || incoming.contractPrice || "230.400.000";
        const soTienVay = incoming.soTienVay || "";

        // Tính số tiền trả trước: Giá xuất hóa đơn - Số tiền vay
        const calculatedAdvancePayment = soTienVay
          ? calculateAdvancePayment(giaXuatHoaDon, soTienVay)
          : (incoming.deposit || "0");

        const processedData = {
          customerName:
            incoming.customerName || incoming.tenKh || incoming["Tên KH"] || "Trần Thị B",
          contractNumber: incoming.vso || "S00901-VSO-25-01-0041",
          createdAt: formatDateString(incoming.createdAt) || "28/06/2024",
          model: incoming.model || "VF8",
          salePrice: giaXuatHoaDon,
          advancePayment: calculatedAdvancePayment,
          remainingAmount: soTienVay || "0",
          bankAccount: incoming.bankAccount || branchInfo?.bankAccount || "",
          bankBranch:
            incoming.bankBranch ||
            (branchInfo ? `${branchInfo.bankName} - ${branchInfo.bankBranch}` : ""),
          exterior: incoming.exterior || "Đỏ",
          showroom: incoming.showroom || branchInfo?.shortName || "",
        };
        setData(processedData);
        // Initialize vehicleInfo from data
        const defaultVehicleInfo = `Mua 01 chiếc xe ô tô con, chỗ, Nhãn hiệu: ${processedData.model
          }, màu ${getColorName(processedData.exterior)}, số tự động, mới 100%.`;
        setVehicleInfo(incoming.vehicleInfo || defaultVehicleInfo);
        if (incoming.recipientInfo) {
          setRecipientInfo(incoming.recipientInfo);
        }

        // Set branch name for editable field
        const shortName = getShowroomShortName(showroomName).toUpperCase();
        setBranchName(`CHI NHÁNH ${shortName}`);
        
        // Set account holder from branch data
        setAccountHolder(branchInfo?.accountHolder || "");
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

  if (!data) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        style={{ fontFamily: "Times New Roman" }}
      >
        <div className="text-center">
          <p className="text-red-600 mb-4">Không có dữ liệu</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
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
      <div className="flex gap-6 max-w-7xl mx-auto print:max-w-4xl print:mx-auto">
        <div ref={printableRef} className="flex-1 bg-white p-8" id="printable-content">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-bold w-[300px] text-sm mb-1">
                  <span className="print:hidden">
                    <textarea
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="border border-gray-300 px-1 w-full focus:outline-none focus:border-blue-500 resize-none overflow-hidden bg-transparent"
                      rows={2}
                    />
                  </span>
                  <span className="hidden print:inline">{companyName}</span>
                </div>
                <div className="font-bold w-[300px] text-sm mb-1">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      className="border-b border-gray-400 px-1 w-full focus:outline-none focus:border-blue-500 font-bold text-sm"
                    />
                  </span>
                  <span className="hidden print:inline">{branchName}</span>
                </div>
              </div>

              <div className="flex-1 text-center">
                <p className="font-bold text-sm mb-1">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="font-bold text-sm mb-1">
                  Độc lập - Tự do - Hạnh phúc
                </p>
                <p className="italic text-sm mt-4">
                  <span className="print:hidden">
                    <input
                      type="text"
                      value={headerDate}
                      onChange={(e) => setHeaderDate(e.target.value)}
                      className="border-b border-gray-400 px-1 text-center focus:outline-none focus:border-blue-500 italic text-sm bg-transparent"
                      style={{ minWidth: '200px' }}
                    />
                  </span>
                  <span className="hidden print:inline">{headerDate}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-center mb-8 uppercase">
            GIẤY ĐỀ NGHỊ THANH TOÁN
          </h1>

          {/* Recipient */}
          <div className="mb-6 text-center">
            <p className="font-bold mb-1">
              Kính gửi:{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="border-b border-gray-400 px-2 py-1 text-sm font-bold w-full max-w-md focus:outline-none focus:border-blue-500"
                  placeholder="NGÂN HÀNG TMCP VIỆT NAM THỊNH VƯỢNG-VP BANK"
                />
              </span>
              <span className="hidden print:inline">{bankName}</span>
            </p>
            <p className="font-bold">
              -
              <span className="print:hidden">
                <input
                  type="text"
                  value={recipientInfo}
                  onChange={(e) => setRecipientInfo(e.target.value)}
                  className="border-b border-gray-400 px-2 py-1 text-sm font-bold w-full max-w-md focus:outline-none focus:border-blue-500"
                  placeholder="Trung Tâm Thế Chấp Vùng 9"
                />
              </span>
              <span className="hidden print:inline">{recipientInfo}</span>
            </p>
          </div>

          {/* Căn cứ */}
          <div className="text-sm">
            <p className="mb-2">
              <em>Căn cứ Hợp đồng mua bán xe ô tô số:</em>{" "}
              <strong>{data.contractNumber}</strong>,{" "}
              <em>
                ngày <strong>{data.createdAt}</strong> giữa Ông/Bà{" "}
                <strong>{data.customerName}</strong> và{" "}
                <strong>
                  CHI NHÁNH {getShowroomShortName(data?.showroom).toUpperCase()}{" "}
                  - CÔNG TY CP ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI GÒN
                </strong>
              </em>
            </p>
            <p className="mb-1">
              <em>- Căn cứ vào tình hình thực tế.</em>
            </p>

            <p className="mb-1">
              Nay{" "}
              <strong>
                CHI NHÁNH {getShowroomShortName(data?.showroom).toUpperCase()} -
                CÔNG TY CP ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI GÒN
              </strong>{" "}
              đề nghị{" "}
              <strong>
                NGÂN HÀNG TMCP VIỆT NAM THỊNH VƯỢNG VP BANK-
                {recipientInfo.toUpperCase()}
              </strong>{" "}
              thanh toán số tiền khách hàng vay mua xe tại Công ty như sau:
            </p>
          </div>

          {/* Thông tin thanh toán */}
          <div className="mb-8 text-sm space-y-3">
            <div>
              - Tên khách hàng vay: <strong>{data.customerName}</strong>
              <em className="ml-4">
                Loại xe mua:{" "}
                <span className="print:hidden ">
                  <input
                    type="text"
                    value={vehicleInfo}
                    onChange={(e) => setVehicleInfo(e.target.value)}
                    className="border-b border-gray-400 px-2 py-1 text-sm font-normal italic w-full max-w-lg focus:outline-none focus:border-blue-500"
                    placeholder={`Mua 01 chiếc xe ô tô con, chỗ, Nhãn hiệu: ${data.model
                      }, màu ${getColorName(data.exterior)} mới 100%.`}
                  />
                </span>
              </em>
            </div>

            <div>
              - Giá bán:<strong> {formatCurrency(data.salePrice)}</strong> (Bằng
              chữ: <strong>{vndToWords(data.salePrice)}</strong>)
            </div>

            <div>
              - Số tiền khách hàng đã trả trước:{" "}
              <strong>{formatCurrency(data.advancePayment)}</strong>
            </div>

            <div>
              - Số tiền khách hàng còn thiếu để thanh toán:{" "}
              <strong>{formatCurrency(data.remainingAmount)}</strong>
            </div>

            <div>
              - Đề nghị thanh toán số tiền trên vào tài khoản số:{" "}
              {data.bankAccount} {data.bankBranch}
            </div>

            <div>
              - Chủ TK:{" "}
              <span className="print:hidden">
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="border-b border-gray-400 px-1 w-full max-w-lg font-bold focus:outline-none focus:border-blue-500"
                />
              </span>
              <span className="hidden print:inline">
                <strong>{accountHolder}</strong>
              </span>
            </div>
          </div>

          {/* Phần chữ ký - BẢNG VỚI 2 CỘT TỶ LỆ 1:3 */}
          <div className="mt-8 flex justify-end">
            <table className="border-collapse border border-gray-800 w-full">
              <tbody>
                <tr>
                  <td
                    colSpan="2"
                    className="border border-gray-800 px-4 py-3 text-center"
                  >
                    <strong>
                      CHI NHÁNH{" "}
                      {getShowroomShortName(data?.showroom).toUpperCase()} -
                      CÔNG TY CỔ PHẦN ĐẦU TƯ THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ ĐÔNG SÀI
                      GÒN
                    </strong>
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-800 px-4 py-2 w-1/4 text-center">
                    <em>
                      <br />
                      Ký tên
                      <br />
                      <br />
                    </em>
                  </td>
                  <td className="border border-gray-800 px-4 py-2 w-3/4">
                    {/* Ô trống để ký tên */}
                  </td>
                </tr>
                <tr>
                  <td className="border border-gray-800 px-4 py-2 w-1/4 text-center">
                    Họ và tên
                    <br />
                    Chức vụ
                  </td>
                  <td className="border border-gray-800 px-4 py-2 w-3/4"></td>
                </tr>
                <tr>
                  <td className="border border-gray-800 px-4 py-2 w-1/4 text-center">
                    Ngày
                  </td>
                  <td className="border border-gray-800 px-4 py-2 w-3/4 text-center font-semibold"></td>
                </tr>
              </tbody>
            </table>
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
            In Giấy Đề Nghị
          </button>
        </div>
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

export default GiayDeNghiThanhToan;
