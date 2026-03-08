import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  thong_tin_ky_thuat_xe,
  danh_sach_xe,
  formatCurrency,
  uu_dai_vin_club,
  getDataByKey,
} from "../data/calculatorData";

import logoImage from "../assets/images/logo.svg";

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Chuẩn hóa số từ localStorage (tránh string/formatted gây sai hiển thị)
const toNum = (v) => {
  if (v === undefined || v === null) return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).replace(/\D/g, "");
  return s ? parseInt(s, 10) : 0;
};

// Các key chứa giá trị số trên invoice
const NUMERIC_KEYS = [
  "depositAmount", "carBasePrice", "carPriceAfterPromotions", "carTotal", "priceFinalPayment",
  "vinClubDiscount", "convertSupportDiscount", "premiumColorDiscount", "bhvc2Discount",
  "plateFee", "liabilityInsurance", "inspectionFee", "roadFee", "registrationFee",
  "bodyInsurance", "bodyInsuranceFee", "totalOnRoadCost",
  "giaXuatHoaDon", "giaThanhToanThucTe", "tongChiPhiLanBanh",
  "tienVayTuGiaXHD", "soTienThanhToanDoiUng",
  "loanRatio", "loanAmount", "downPayment",
];

const normalizeInvoiceData = (data) => {
  if (!data || typeof data !== "object") return data;
  const out = { ...data };
  NUMERIC_KEYS.forEach((key) => {
    if (key in out && (typeof out[key] !== "number" || !Number.isFinite(out[key]))) {
      out[key] = toNum(out[key]);
    }
  });
  if (out.promotionDetails && typeof out.promotionDetails === "object") {
    const pd = { ...out.promotionDetails };
    ["basicDiscount", "vinClubDiscount", "bhvc2Discount", "premiumColorDiscount", "convertSupportDiscount"].forEach((k) => {
      if (k in pd) pd[k] = toNum(pd[k]);
    });
    out.promotionDetails = pd;
  }
  return out;
};

export default function Invoice2Page() {
  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState(null);
  // Checkbox "hiện trong bản in" cho từng dòng khuyến mãi (key => boolean)
  const [printPromoChecked, setPrintPromoChecked] = useState({});

  useEffect(() => {
    // Get data from localStorage
    const savedData = localStorage.getItem("invoiceData");
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setInvoiceData(normalizeInvoiceData(data));
        setPrintPromoChecked({}); // Mặc định mọi checkbox = hiện trong bản in (true)
      } catch (e) {
        console.error("Error loading saved invoice data:", e);
        navigate("/bao-gia");
      }
    } else {
      // No data, redirect back to calculator
      navigate("/bao-gia");
    }
  }, [navigate]);

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const setPromoPrintChecked = (key, value) => {
    setPrintPromoChecked((prev) => ({ ...prev, [key]: value }));
  };
  const getPromoPrintChecked = (key) => printPromoChecked[key] !== false;

  if (!invoiceData) {
    return <div className="p-4">Đang tải dữ liệu...</div>;
  }

  // Helper functions to get display values
  const getCustomerTypeLabel = () => {
    return invoiceData.customerType === "ca_nhan" ? "Cá nhân" : "Công ty";
  };

  const getBusinessTypeLabel = () => {
    if (invoiceData.businessType) {
      return invoiceData.businessType === "khong_kinh_doanh"
        ? "Không Kinh Doanh"
        : "Kinh Doanh";
    }
    return invoiceData.customerType === "ca_nhan"
      ? "Không Kinh Doanh"
      : "Kinh Doanh";
  };

  const getExteriorColorName = () => {
    // Try to get color name from data, fallback to code
    return invoiceData.exteriorColorName || invoiceData.exteriorColor || "";
  };

  const getInteriorColorName = () => {
    // Try to get color name from data, fallback to code
    return invoiceData.interiorColorName || invoiceData.interiorColor || "";
  };

  const getRegistrationLocationLabel = () => {
    // If registrationLocation is already a label (string), return it
    if (
      invoiceData.registrationLocation &&
      !["hcm", "hanoi", "danang", "cantho", "haiphong", "other"].includes(
        invoiceData.registrationLocation
      )
    ) {
      return invoiceData.registrationLocation;
    }

    const locationMap = {
      hcm: "TP. Hồ Chí Minh",
      hanoi: "Hà Nội",
      danang: "Đà Nẵng",
      cantho: "Cần Thơ",
      haiphong: "Hải Phòng",
      other: "Tỉnh thành khác",
    };
    return (
      locationMap[invoiceData.registrationLocation] ||
      invoiceData.registrationLocation ||
      "TP. Hồ Chí Minh"
    );
  };

  // Calculate payment schedule (ensure numbers from localStorage)
  const totalAmount =
    Number(invoiceData.carTotal || 0) + Number(invoiceData.totalOnRoadCost || 0);
  const deposit = Number(invoiceData.depositAmount || 0);
  const remaining = totalAmount - deposit;
  const payment1 = Math.round(remaining * 0.4); // 40% khi xuất hóa đơn
  const payment2 = remaining - payment1; // Còn lại khi đăng ký

  // Get current date for footer
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  return (
    <div className="min-h-screen bg-white p-4 print:p-0 print:min-h-0">
      {/* Back Button - Hidden when printing */}
      <div className="no-print mb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </button>
      </div>
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 8mm 10mm;
          }
          body {
            padding: 0;
            margin: 0;
            font-size: 9pt !important;
            line-height: 1.2 !important;
          }
          .no-print {
            display: none !important;
          }
          h2, .section-title {
            page-break-after: avoid;
          }
          table {
            page-break-inside: avoid;
          }
          .section-title {
            margin-top: 4px !important;
          }
          .max-w-4xl {
            max-width: 100% !important;
            padding: 0 !important;
          }
          td, th {
            padding: 2px 4px !important;
            font-size: 9pt !important;
          }
          table {
            width: calc(100% - 1px) !important;
          }
          .p-1 {
            padding: 2px 4px !important;
          }
          .p-2 {
            padding: 4px !important;
          }
          .mb-0, .mb-3, .mt-3 {
            margin: 2px 0 !important;
          }
          .my-4 {
            margin: 4px 0 !important;
          }
          .mt-2, .mt-4, .mt-5 {
            margin-top: 4px !important;
          }
          h2 {
            font-size: 11pt !important;
            padding: 4px !important;
            margin-bottom: 4px !important;
          }
          .text-sm {
            font-size: 9pt !important;
          }
          .text-xs {
            font-size: 8pt !important;
          }
          .text-base {
            font-size: 10pt !important;
          }
          footer {
            margin-top: 8px !important;
          }
          input[type="checkbox"] {
            width: 10px !important;
            height: 10px !important;
          }
        }
        .table-bordered td,
        .table-bordered th {
          border: 1px solid #111827;
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Header giống mẫu: logo trái, tiêu đề căn giữa, ngày phải - cùng một dòng */}
        <table className="w-full border-collapse mb-3 text-sm bg-white">
          <tbody>
            <tr className="align-middle">
              <td className="p-0 align-middle" style={{ width: "18%" }}>
                <img
                  src={logoImage}
                  alt="VinFast"
                  className="h-10 w-auto object-contain object-left print:h-9"
                />
              </td>
              <td className="p-0 align-middle text-center" style={{ width: "64%" }}>
                <span className="text-lg font-bold text-black uppercase print:text-base">
                  BẢNG BÁO GIÁ CHI PHÍ MUA XE TẠM TÍNH
                </span>
              </td>
              <td className="p-0 align-middle text-right text-gray-800" style={{ width: "18%" }}>
                <span className="text-sm font-normal">
                  {formatDate(invoiceData?.savedAt || new Date().toISOString())}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse mb-0 text-sm bg-white">
          <tbody>
            <tr>
              <td className="p-1" style={{ width: "15%" }}>
                <strong>Kính Gửi:</strong>
              </td>
              <td className="p-1" style={{ width: "50%" }}>
                {(invoiceData.customerName || "QUÝ KHÁCH HÀNG").toUpperCase()}
              </td>
              <td className="p-1" style={{ width: "15%" }}>
                <strong>Nhu cầu:</strong>
              </td>
              <td className="p-1" style={{ width: "20%" }}>
                {getBusinessTypeLabel()}
              </td>
            </tr>
            <tr>
              <td className="p-1" style={{ width: "15%" }}>
                <strong>Địa Chỉ:</strong>
              </td>
              <td className="p-1" colSpan="3">
                {invoiceData.customerAddress || "Thành phố Hồ Chí Minh"}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="text-blue-900 font-bold uppercase p-1 mt-3 mb-0 text-xs">
          Thông tin sản phẩm
        </div>
        <table className="w-full border-collapse mb-0 text-sm bg-white table-bordered">
          <tbody>
            <tr>
              <td
                className="p-1"
                style={{ width: "33%" }}
              >
                <strong>Dòng xe</strong>
              </td>
              <td className="p-1">
                {invoiceData.carModel || "VF 3"}
              </td>
            </tr>
            <tr>
              <td
                className="p-1"
                style={{ width: "33%" }}
              >
                <strong>Phiên bản</strong>
              </td>
              <td className="p-1">
                {invoiceData.carVersion || "Base"}
              </td>
            </tr>
            <tr>
              <td
                className="p-1"
                style={{ width: "33%" }}
              >
                <strong>Ngoại thất</strong>
              </td>
              <td className="p-1">
                {getExteriorColorName()}
              </td>
            </tr>
            <tr>
              <td
                className="p-1"
                style={{ width: "33%" }}
              >
                <strong>Nội thất</strong>
              </td>
              <td className="p-1">
                {getInteriorColorName()}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="text-blue-900 font-bold uppercase p-1 mt-3 mb-0 text-xs">
          Giá xe & Chương trình khuyến mãi
        </div>
        <table className="w-full border-collapse mb-0 text-sm bg-white table-bordered">
          <tbody>
            <tr>
              <td className="p-1" style={{ width: "48%" }}>
                <strong>Giá Xe Đã Bao Gồm VAT</strong>
              </td>
              <td className="p-1 text-center align-middle" style={{ width: "8%" }}>
                <span className={getPromoPrintChecked("basePrice") ? "" : "print:hidden"}>
                  <input
                    type="checkbox"
                    checked={getPromoPrintChecked("basePrice")}
                    onChange={() => setPromoPrintChecked("basePrice", !getPromoPrintChecked("basePrice"))}
                    className="w-3 h-3"
                  />
                </span>
              </td>
              <td className="p-1 text-center" style={{ width: "12%" }}>
                Kèm Pin
              </td>
              <td className="p-1 text-right" style={{ width: "32%" }}>
                <strong>{formatCurrency(invoiceData.carBasePrice || 0)}</strong>
              </td>
            </tr>
            {/* Selected promotions from Firebase */}
            {invoiceData.selectedPromotions && invoiceData.selectedPromotions.length > 0 && 
              invoiceData.selectedPromotions.map((promo, index) => {
                const key = `selectedPromo_${index}`;
                return (
                  <tr key={promo.id || index}>
                    <td className="p-1">{promo.name || promo.ten_chuong_trinh}</td>
                    <td className="p-1 text-center align-middle">
                      <span className={getPromoPrintChecked(key) ? "" : "print:hidden"}>
                        <input
                          type="checkbox"
                          checked={getPromoPrintChecked(key)}
                          onChange={() => setPromoPrintChecked(key, !getPromoPrintChecked(key))}
                          className="w-3 h-3"
                        />
                      </span>
                    </td>
                    <td className="p-1 text-center">
                      {promo.type === 'percentage' ? `${promo.value || 0}%` : ''}
                    </td>
                    <td className="p-1 text-right">
                      {formatCurrency(
                        typeof promo.calculatedDiscount === 'number'
                          ? promo.calculatedDiscount
                          : promo.type === 'percentage'
                            ? Math.round((Number(invoiceData.carBasePrice) || 0) * (Number(promo.value) || 0) / 100)
                            : (promo.value || 0)
                      )}
                    </td>
                  </tr>
                );
              })
            }
            {/* CS QDND&CAND - chỉ hiện nếu được chọn */}
            {invoiceData.promotionCheckboxes?.discount2 && (
              <tr>
                <td className="p-1">CS QDND& CAND</td>
                <td className="p-1 text-center align-middle">
                  <span className={getPromoPrintChecked("discount2") ? "" : "print:hidden"}>
                    <input
                      type="checkbox"
                      checked={getPromoPrintChecked("discount2")}
                      onChange={() => setPromoPrintChecked("discount2", !getPromoPrintChecked("discount2"))}
                      className="w-3 h-3"
                    />
                  </span>
                </td>
                <td className="p-1 text-center">0,00%</td>
                <td className="p-1 text-right">0</td>
              </tr>
            )}
            {/* Vin 2024 - chỉ hiện nếu được chọn */}
            {invoiceData.promotionCheckboxes?.discount3 && (
              <tr>
                <td className="p-1">Vin 2024</td>
                <td className="p-1 text-center align-middle">
                  <span className={getPromoPrintChecked("discount3") ? "" : "print:hidden"}>
                    <input
                      type="checkbox"
                      checked={getPromoPrintChecked("discount3")}
                      onChange={() => setPromoPrintChecked("discount3", !getPromoPrintChecked("discount3"))}
                      className="w-3 h-3"
                    />
                  </span>
                </td>
                <td className="p-1 text-center"></td>
                <td className="p-1 text-right">0</td>
              </tr>
            )}
            {/* Hỗ trợ lãi Suất - chỉ hiện nếu được chọn */}
            {invoiceData.promotionCheckboxes?.hoTroLaiSuat && (
              <tr>
                <td className="p-1">Hỗ trợ lãi Suất</td>
                <td className="p-1 text-center align-middle">
                  <span className={getPromoPrintChecked("hoTroLaiSuat") ? "" : "print:hidden"}>
                    <input
                      type="checkbox"
                      checked={getPromoPrintChecked("hoTroLaiSuat")}
                      onChange={() => setPromoPrintChecked("hoTroLaiSuat", !getPromoPrintChecked("hoTroLaiSuat"))}
                      className="w-3 h-3"
                    />
                  </span>
                </td>
                <td className="p-1 text-center"></td>
                <td className="p-1 text-right"></td>
              </tr>
            )}
            {/* Quy đổi 2 năm bảo hiểm - chỉ hiện nếu được chọn */}
            {invoiceData.promotionCheckboxes?.discountBhvc2 && (
              <tr>
                <td className="p-1">Quy đổi 2 năm bảo hiểm</td>
                <td className="p-1 text-center align-middle">
                  <span className={getPromoPrintChecked("discountBhvc2") ? "" : "print:hidden"}>
                    <input
                      type="checkbox"
                      checked={getPromoPrintChecked("discountBhvc2")}
                      onChange={() => setPromoPrintChecked("discountBhvc2", !getPromoPrintChecked("discountBhvc2"))}
                      className="w-3 h-3"
                    />
                  </span>
                </td>
                <td className="p-1 text-center"></td>
                <td className="p-1 text-right">
                  {formatCurrency(invoiceData.bhvc2Discount || 0)}
                </td>
              </tr>
            )}
            {/* Miễn Phí Màu Nâng Cao - chỉ hiện nếu được chọn */}
            {invoiceData.promotionCheckboxes?.discountPremiumColor && (
              <tr>
                <td className="p-1">Miễn Phí Màu Nâng Cao</td>
                <td className="p-1 text-center align-middle">
                  <span className={getPromoPrintChecked("discountPremiumColor") ? "" : "print:hidden"}>
                    <input
                      type="checkbox"
                      checked={getPromoPrintChecked("discountPremiumColor")}
                      onChange={() => setPromoPrintChecked("discountPremiumColor", !getPromoPrintChecked("discountPremiumColor"))}
                      className="w-3 h-3"
                    />
                  </span>
                </td>
                <td className="p-1 text-center"></td>
                <td className="p-1 text-right">
                  {formatCurrency(invoiceData.premiumColorDiscount || 0)}
                </td>
              </tr>
            )}
            {/* Xăng Đổi Điện - chỉ hiện nếu được chọn */}
            {invoiceData.promotionCheckboxes?.convertCheckbox && (
              <tr>
                <td className="p-1">Xăng Đổi Điện</td>
                <td className="p-1 text-center align-middle">
                  <span className={getPromoPrintChecked("convertCheckbox") ? "" : "print:hidden"}>
                    <input
                      type="checkbox"
                      checked={getPromoPrintChecked("convertCheckbox")}
                      onChange={() => setPromoPrintChecked("convertCheckbox", !getPromoPrintChecked("convertCheckbox"))}
                      className="w-3 h-3"
                    />
                  </span>
                </td>
                <td className="p-1 text-center"></td>
                <td className="p-1 text-right">
                  {formatCurrency(invoiceData.convertSupportDiscount || 0)}
                </td>
              </tr>
            )}
            {/* Hạng thành viên VinClub - chỉ hiện nếu có chọn và không có hỗ trợ lãi suất */}
            {invoiceData.promotionCheckboxes?.vinClubVoucher && invoiceData.promotionCheckboxes.vinClubVoucher !== 'none' && !invoiceData.promotionCheckboxes?.hoTroLaiSuat && (
              <tr>
                <td className="p-1">
                  Hạng thành viên VinClub - {invoiceData.promotionCheckboxes.vinClubVoucher.charAt(0).toUpperCase() + invoiceData.promotionCheckboxes.vinClubVoucher.slice(1)}
                </td>
                <td className="p-1 text-center align-middle">
                  <span className={getPromoPrintChecked("vinClubVoucher") ? "" : "print:hidden"}>
                    <input
                      type="checkbox"
                      checked={getPromoPrintChecked("vinClubVoucher")}
                      onChange={() => setPromoPrintChecked("vinClubVoucher", !getPromoPrintChecked("vinClubVoucher"))}
                      className="w-3 h-3"
                    />
                  </span>
                </td>
                <td className="p-1 text-center">
                  {(() => {
                    const vinClubData = getDataByKey(uu_dai_vin_club, 'hang', invoiceData.promotionCheckboxes.vinClubVoucher);
                    const tyLe = vinClubData?.ty_le;
                    if (vinClubData && typeof tyLe === 'number' && invoiceData.vinClubDiscount > 0) {
                      const percent = tyLe * 100;
                      return percent % 1 === 0 ? `${percent}%` : `${percent.toFixed(1).replace('.', ',')}%`;
                    }
                    return invoiceData.vinClubDiscount > 0 ? '0,5%' : '';
                  })()}
                </td>
                <td className="p-1 text-right">
                  {formatCurrency(invoiceData.vinClubDiscount || 0)}
                </td>
              </tr>
            )}
            {/* Giá Xuất Hóa Đơn */}
            <tr className="bg-yellow-100">
              <td className="p-1" colSpan="2">
                <strong>Giá Xuất Hóa Đơn</strong>
              </td>
              <td className="p-1 text-right" colSpan="2">
                <strong>{formatCurrency(invoiceData.giaXuatHoaDon || invoiceData.priceFinalPayment || invoiceData.carTotal || 0)}</strong>
              </td>
            </tr>
            {/* Giá Thanh toán thực tế */}
            <tr className="bg-yellow-100">
              <td className="p-1" colSpan="2">
                <strong>Giá Thanh toán thực tế</strong>
              </td>
              <td className="p-1 text-right" colSpan="2">
                <strong>{formatCurrency(invoiceData.giaThanhToanThucTe || invoiceData.priceFinalPayment || invoiceData.carTotal || 0)}</strong>
              </td>
            </tr>
            {/* Phase 7: Số tiền thanh toán đối ứng (khi có vay) */}
            {invoiceData.hasLoan && (
              <>
                <tr className="bg-red-50">
                  <td className="p-1" colSpan="2">
                    Tiền vay ngân hàng
                  </td>
                  <td className="p-1 text-right text-red-600" colSpan="2">
                    <strong>-{formatCurrency(invoiceData.tienVayTuGiaXHD || 0)}</strong>
                  </td>
                </tr>
                <tr className="bg-green-100">
                  <td className="p-1" colSpan="2">
                    <strong>Số tiền thanh toán (đối ứng)</strong>
                  </td>
                  <td className="p-1 text-right text-green-700" colSpan="2">
                    <strong>{formatCurrency(invoiceData.soTienThanhToanDoiUng || 0)}</strong>
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        <div className="text-blue-900 font-bold uppercase p-1 mt-3 mb-0 text-xs">
          Chi phí lăn bánh
        </div>
        <table className="w-full border-collapse mb-0 text-sm bg-white table-bordered">
          <thead>
            <tr className="bg-gray-100">
              <td className="p-1" style={{ width: "8%" }}><strong>STT</strong></td>
              <td className="p-1" style={{ width: "32%" }}><strong>Hạng mục</strong></td>
              <td className="p-1" style={{ width: "15%" }}><strong>Chi tiết</strong></td>
              <td className="p-1 text-right" style={{ width: "18%" }}><strong>Số tiền</strong></td>
              <td className="p-1 text-right" style={{ width: "27%" }}><strong>Loại chứng từ</strong></td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                className="p-1"
                style={{ width: "8%" }}
              >
                1
              </td>
              <td
                className="p-1"
                style={{ width: "32%" }}
              >
                Lệ phí trước bạ
              </td>
              <td
                className="p-1"
                style={{ width: "15%" }}
              >
                {invoiceData.carModel && invoiceData.carModel.includes("VF")
                  ? "0%"
                  : "10%"}
              </td>
              <td
                className="p-1 text-right"
                style={{ width: "18%" }}
              >
                Miễn Phí
              </td>
              <td
                className="p-1 text-right"
                style={{ width: "15%" }}
              >
                Hóa đơn
              </td>
            </tr>
            <tr>
              <td
                className="p-1"
                style={{ width: "8%" }}
              >
                2
              </td>
              <td
                className="p-1"
                style={{ width: "32%" }}
              >
                Phí 01 năm BH Dân sự
              </td>
              <td
                className="p-1"
                style={{ width: "15%" }}
              ></td>
              <td
                className="p-1 text-right"
                style={{ width: "18%" }}
              >
                {formatCurrency(invoiceData.liabilityInsurance || 0)}
              </td>
              <td
                className="p-1 text-right"
                style={{ width: "15%" }}
              >
                Hóa đơn
              </td>
            </tr>
            <tr>
              <td
                className="p-1"
                style={{ width: "8%" }}
              >
                3
              </td>
              <td
                className="p-1"
                style={{ width: "32%" }}
              >
                Phí cấp biển số
              </td>
              <td
                className="p-1"
                style={{ width: "15%" }}
              >
                {getRegistrationLocationLabel()}
              </td>
              <td
                className="p-1 text-right"
                style={{ width: "18%" }}
              >
                {formatCurrency(invoiceData.plateFee || 0)}
              </td>
              <td
                className="p-1 text-right"
                style={{ width: "15%" }}
              >
                Biên Lai
              </td>
            </tr>
            <tr>
              <td
                className="p-1"
                style={{ width: "8%" }}
              >
                4
              </td>
              <td
                className="p-1"
                style={{ width: "32%" }}
              >
                Phí kiểm định
              </td>
              <td
                className="p-1"
                style={{ width: "15%" }}
              ></td>
              <td
                className="p-1 text-right"
                style={{ width: "18%" }}
              >
                {formatCurrency(invoiceData.inspectionFee || 0)}
              </td>
              <td
                className="p-1 text-right"
                style={{ width: "15%" }}
              >
                Biên Lai
              </td>
            </tr>
            <tr>
              <td
                className="p-1"
                style={{ width: "8%" }}
              >
                5
              </td>
              <td
                className="p-1"
                style={{ width: "32%" }}
              >
                Phí bảo trì đường bộ
              </td>
              <td
                className="p-1"
                style={{ width: "15%" }}
              >
                {getCustomerTypeLabel()}
              </td>
              <td
                className="p-1 text-right"
                style={{ width: "18%" }}
              >
                {formatCurrency(invoiceData.roadFee || 0)}
              </td>
              <td
                className="p-1 text-right"
                style={{ width: "15%" }}
              >
                Biên Lai
              </td>
            </tr>
            <tr>
              <td
                className="p-1"
                style={{ width: "8%" }}
              >
                6
              </td>
              <td
                className="p-1"
                style={{ width: "32%" }}
              >
                Phí dịch vụ
              </td>
              <td
                className="p-1"
                style={{ width: "15%" }}
              ></td>
              <td
                className="p-1 text-right"
                style={{ width: "18%" }}
              >
                {formatCurrency(invoiceData.registrationFee || 0)}
              </td>
              <td
                className="p-1"
                style={{ width: "15%" }}
              ></td>
            </tr>
            <tr>
              <td
                className="p-1"
                style={{ width: "8%" }}
              >
                7
              </td>
              <td
                className="p-1"
                style={{ width: "32%" }}
              >
                BHVC bao gồm Pin
              </td>
              <td
                className="p-1"
                style={{ width: "15%" }}
              >
                {getBusinessTypeLabel()}
              </td>
              <td
                className="p-1 text-right"
                style={{ width: "18%" }}
              >
                {formatCurrency(
                  invoiceData.isBodyInsuranceManual 
                    ? invoiceData.bodyInsuranceFee 
                    : invoiceData.bodyInsurance
                ) || formatCurrency(invoiceData.bodyInsurance || 0)}
              </td>
              <td
                className="p-1 text-right"
                style={{ width: "15%" }}
              >
                Hóa Đơn
              </td>
            </tr>
            <tr className="bg-blue-50 font-semibold">
              <td className="p-1" colSpan="3">
                Tổng
              </td>
              <td className="p-1 text-right">
                {formatCurrency(
                  (Number(invoiceData.liabilityInsurance) || 0) +
                  (Number(invoiceData.plateFee) || 0) +
                  (Number(invoiceData.inspectionFee) || 0) +
                  (Number(invoiceData.roadFee) || 0) +
                  (Number(invoiceData.registrationFee) || 0) +
                  (Number(invoiceData.isBodyInsuranceManual ? invoiceData.bodyInsuranceFee : invoiceData.bodyInsurance) || 0)
                )}
              </td>
              <td className="p-1"></td>
            </tr>
          </tbody>
        </table>

        <div className="text-blue-900 font-bold uppercase p-1 mt-3 mb-0 text-xs">
          Tổng chi phí lăn bánh
        </div>
        <table className="w-full border-collapse mb-0 text-sm bg-white table-bordered">
          <tbody>
            <tr className="bg-blue-50">
              <td
                className="p-1"
                style={{ width: "8%" }}
              >
                <strong>STT</strong>
              </td>
              <td
                className="p-1"
                style={{ width: "40%" }}
              >
                <strong>Hình thức</strong>
              </td>
              <td
                className="p-1 text-center"
                style={{ width: "15%" }}
              >
                <strong>%</strong>
              </td>
              <td
                className="p-1 text-right"
                style={{ width: "37%" }}
              >
                <strong>Số tiền</strong>
              </td>
            </tr>
            <tr>
              <td
                className="p-1"
                style={{ width: "8%" }}
              >
                1
              </td>
              <td
                className="p-1"
                style={{ width: "40%" }}
              >
                Ngân hàng
              </td>
              <td
                className="p-1 text-center"
                style={{ width: "15%" }}
              >
                {invoiceData.hasLoan && invoiceData.loanRatio
                  ? `${invoiceData.loanRatio}%`
                  : "0%"}
              </td>
              <td
                className="p-1 text-right"
                style={{ width: "37%" }}
              >
                {formatCurrency(invoiceData.loanAmount || 0)}
              </td>
            </tr>
            <tr>
              <td
                className="p-1"
                style={{ width: "8%" }}
              >
                2
              </td>
              <td
                className="p-1"
                style={{ width: "40%" }}
              >
                Đối Ứng
              </td>
              <td
                className="p-1 text-center"
                style={{ width: "15%" }}
              ></td>
              <td
                className="p-1 text-right"
                style={{ width: "37%" }}
              >
                {formatCurrency(invoiceData.downPayment || 0)}
              </td>
            </tr>
            <tr className="bg-blue-50">
              <td className="p-1" colSpan="3">
                <strong>Tổng</strong>
              </td>
              <td className="p-1 text-right">
                <strong>
                  {formatCurrency(invoiceData.totalOnRoadCost || 0)}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="text-blue-900 font-bold uppercase p-1 mt-3 mb-0 text-xs">
          Phương thức thanh toán
        </div>
        <table className="w-full border-collapse mb-0 text-sm bg-white table-bordered">
          <tbody>
            <tr className="bg-blue-50">
              <td
                className="p-1"
                style={{ width: "25%" }}
              >
                <strong>Hình thức</strong>
              </td>
              <td
                className="p-1 text-right"
                style={{ width: "25%" }}
              >
                <strong>Đặt cọc</strong>
              </td>
              <td
                className="p-1 text-right"
                style={{ width: "25%" }}
              >
                <strong>Lần 1: Xuất hóa đơn</strong>
              </td>
              <td
                className="p-1 text-right"
                style={{ width: "25%" }}
              >
                <strong>Lần 2: Đăng ký</strong>
              </td>
            </tr>
            <tr>
              <td className="p-1">Ngân hàng</td>
              <td className="p-1 text-right">
                {formatCurrency(deposit)}
              </td>
              <td className="p-1 text-right">
                {formatCurrency(payment1)}
              </td>
              <td className="p-1 text-right">
                {formatCurrency(payment2)}
              </td>
            </tr>
          </tbody>
        </table>

        {invoiceData.gifts && invoiceData.gifts.length > 0 && (
          <>
            <div className="text-blue-900 font-bold uppercase p-1 mt-3 mb-0 text-xs">
              Quà tặng
            </div>
            <table className="w-full border-collapse mb-0 text-sm bg-white table-bordered">
              <tbody>
                {invoiceData.gifts.map((gift, index) => (
                  <tr key={index}>
                    <td
                      className="p-1"
                      style={{ width: "33%" }}
                    >
                      {gift.name}
                    </td>
                    <td className="p-1 text-right">
                      {gift.price || "Tặng"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <p className="text-xs italic mt-2 text-right text-gray-700">
          Báo giá có hiệu lực đến hết ngày 30/11/2025
        </p>

        <div className="text-right mt-2 text-xs italic font-medium">
          <strong>
            Thành phố Hồ Chí Minh, Ngày {day} tháng {month} năm {year}
          </strong>
        </div>

        <footer className="mt-4 flex justify-between text-sm">
          <div className="w-[45%] text-center">
            <strong className="block mb-1">Khách hàng</strong>
            <p>(Ký và ghi rõ họ tên)</p>
          </div>
          <div className="w-[45%] text-center">
            <strong className="block mb-1">Người báo giá</strong>
            <p>(Ký và ghi rõ họ tên)</p>
          </div>
        </footer>

        {/* Action Buttons */}
        <div className="text-center mt-5 pt-4 border-t-2 border-blue-900 no-print">
          <button
            onClick={handlePrint}
            className="px-8 py-3 bg-blue-900 text-white font-bold rounded cursor-pointer transition-all hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg"
          >
            IN BÁO GIÁ
          </button>
        </div>
      </div>
    </div>
  );
}
