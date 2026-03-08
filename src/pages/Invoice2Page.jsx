import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Copy, Check } from "lucide-react";
import html2pdf from "html2pdf.js";
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [invoiceData, setInvoiceData] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const invoiceRef = useRef(null);
  // Checkbox "hiện trong bản in" cho từng dòng khuyến mãi (key => boolean)
  const [printPromoChecked, setPrintPromoChecked] = useState({});

  useEffect(() => {
    // Get data from localStorage
    const savedData = localStorage.getItem("invoiceData");
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        const normalizedData = normalizeInvoiceData(data);
        setInvoiceData(normalizedData);
        setPrintPromoChecked({}); // Mặc định mọi checkbox = hiện trong bản in (true)
        
        // Tạo hoặc lấy invoiceId
        let invoiceId = localStorage.getItem("currentInvoiceId");
        if (!invoiceId) {
          invoiceId = `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem("currentInvoiceId", invoiceId);
        }
        
        // Lưu invoice data với ID để có thể share
        localStorage.setItem(`invoice_${invoiceId}`, savedData);
        
        // Tạo share link
        const baseUrl = window.location.origin;
        const shareUrl = `${baseUrl}/in-bao-gia-2?invoiceId=${invoiceId}&download=true`;
        setShareLink(shareUrl);
      } catch (e) {
        console.error("Error loading saved invoice data:", e);
        navigate("/bao-gia");
      }
    } else {
      // Kiểm tra nếu có invoiceId trong URL
      const invoiceId = searchParams.get("invoiceId");
      if (invoiceId) {
        const savedInvoiceData = localStorage.getItem(`invoice_${invoiceId}`);
        if (savedInvoiceData) {
          try {
            const data = JSON.parse(savedInvoiceData);
            setInvoiceData(normalizeInvoiceData(data));
            setPrintPromoChecked({});
            // Tạo share link
            const baseUrl = window.location.origin;
            const shareUrl = `${baseUrl}/in-bao-gia-2?invoiceId=${invoiceId}&download=true`;
            setShareLink(shareUrl);
          } catch (e) {
            console.error("Error loading invoice data:", e);
            navigate("/bao-gia");
          }
        } else {
          navigate("/bao-gia");
        }
      } else {
        // No data, redirect back to calculator
        navigate("/bao-gia");
      }
    }
  }, [navigate, searchParams]);
  
  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownloadPDF = useCallback(async () => {
    if (!invoiceRef.current) {
      alert('Không tìm thấy nội dung để tạo PDF. Vui lòng thử lại.');
      return;
    }
    
    setIsGeneratingPDF(true);
    const element = invoiceRef.current;
    const noPrintElements = element.querySelectorAll('.no-print');
    const originalDisplay = [];
    
    try {
      // Validate element
      if (!element || !element.offsetHeight || !element.offsetWidth) {
        throw new Error('Element không hợp lệ');
      }
      
      // Tạm thời ẩn các phần tử no-print trước khi tạo PDF
      noPrintElements.forEach((el, index) => {
        originalDisplay[index] = el.style.display;
        el.style.display = 'none';
      });
      
      // Đợi một chút để đảm bảo DOM đã update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Đảm bảo tất cả hình ảnh được load trước khi tạo PDF (với timeout)
      const images = element.querySelectorAll('img');
      await Promise.race([
        Promise.all(
          Array.from(images).map(img => {
            if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
            return new Promise((resolve) => {
              const timeout = setTimeout(() => {
                console.warn('Image load timeout:', img.src);
                resolve(); // Continue even if timeout
              }, 3000);
              img.onload = () => {
                clearTimeout(timeout);
                resolve();
              };
              img.onerror = () => {
                clearTimeout(timeout);
                console.warn('Image load error:', img.src);
                resolve(); // Continue even if image fails
              };
            });
          })
        ),
        new Promise(resolve => setTimeout(resolve, 5000)) // Max 5s for all images
      ]);
      
      // Tính toán scale để PDF sắc nét và fit 1 trang A4
      const a4Height = 297; // mm
      const a4Width = 210; // mm
      const marginTop = 5;
      const marginBottom = 5;
      const marginLeft = 7;
      const marginRight = 7;
      const availableHeight = a4Height - marginTop - marginBottom;
      const availableWidth = a4Width - marginLeft - marginRight;
      
      // Tính scale dựa trên cả chiều cao và chiều rộng
      const pixelsPerMm = 3.779527559; // pixels per mm at 96 DPI
      const maxHeightPx = availableHeight * pixelsPerMm;
      const maxWidthPx = availableWidth * pixelsPerMm;
      
      // Tính scale để fit 1 trang, nhưng vẫn đảm bảo sắc nét (tối thiểu 1.5, tối đa 2.0)
      const elementHeight = element.scrollHeight || element.offsetHeight || 1000;
      const elementWidth = element.scrollWidth || element.offsetWidth || 800;
      
      if (elementHeight <= 0 || elementWidth <= 0) {
        throw new Error('Kích thước element không hợp lệ');
      }
      
      const heightScale = maxHeightPx / elementHeight;
      const widthScale = maxWidthPx / elementWidth;
      const fitScale = Math.min(heightScale, widthScale);
      
      // Đảm bảo scale đủ cao để PDF sắc nét nhưng không vượt quá để tránh tràn trang
      const calculatedScale = Math.max(1.5, Math.min(fitScale, 2.0));
      
      if (!isFinite(calculatedScale) || calculatedScale <= 0) {
        throw new Error('Scale không hợp lệ');
      }
      
      // Helper function để convert SVG sang base64
      const convertSvgToBase64 = async (img) => {
        if (!img.src || !img.src.includes('.svg')) return;
        
        try {
          // Nếu đã là data URI thì không cần convert
          if (img.src.startsWith('data:')) return;
          
          const response = await fetch(img.src);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const svgText = await response.text();
          const base64 = btoa(unescape(encodeURIComponent(svgText)));
          img.src = `data:image/svg+xml;base64,${base64}`;
        } catch (error) {
          console.warn('Failed to convert SVG to base64:', error);
          // Continue without converting - html2canvas might still work
        }
      };
      
      // Convert tất cả SVG logo sang base64 trước khi tạo PDF (với timeout)
      const logoImages = element.querySelectorAll('img[src*="logo"]');
      await Promise.race([
        Promise.all(Array.from(logoImages).map(convertSvgToBase64)),
        new Promise(resolve => setTimeout(resolve, 3000)) // Max 3s for SVG conversion
      ]);
      
      const opt = {
        margin: [marginTop, marginRight, marginBottom, marginLeft], // 6mm 8mm
        filename: `Bao-gia-${invoiceData.carModel || 'xe'}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 }, // Tăng quality
        html2canvas: { 
          scale: calculatedScale,
          useCORS: true,
          allowTaint: true,
          logging: false,
          letterRendering: true,
          backgroundColor: '#ffffff',
          windowWidth: elementWidth,
          windowHeight: elementHeight,
          foreignObjectRendering: true, // Hỗ trợ SVG tốt hơn
          onclone: async (clonedDoc) => {
            try {
              // Đảm bảo logo và hình ảnh được hiển thị trong clone
              const clonedImages = clonedDoc.querySelectorAll('img');
              for (const img of clonedImages) {
                try {
                  if (img.src) {
                    img.style.display = 'block';
                    img.style.visibility = 'visible';
                    img.style.opacity = '1';
                    img.style.maxWidth = '100%';
                    img.style.height = 'auto';
                    
                    // Convert SVG sang base64 trong clone nếu cần
                    if (img.src.includes('.svg') && !img.src.startsWith('data:')) {
                      try {
                        const response = await fetch(img.src);
                        if (response.ok) {
                          const svgText = await response.text();
                          const base64 = btoa(unescape(encodeURIComponent(svgText)));
                          img.src = `data:image/svg+xml;base64,${base64}`;
                          // Đợi image load với timeout
                          await Promise.race([
                            new Promise((resolve) => {
                              img.onload = resolve;
                              img.onerror = resolve;
                            }),
                            new Promise(resolve => setTimeout(resolve, 2000))
                          ]);
                        }
                      } catch (error) {
                        console.warn('Failed to convert SVG in clone:', error);
                        // Continue without conversion
                      }
                    }
                  }
                } catch (imgError) {
                  console.warn('Error processing image in clone:', imgError);
                  // Continue with next image
                }
              }
              
              // Giảm border width trong clone
              try {
                const clonedTables = clonedDoc.querySelectorAll('table, td, th');
                clonedTables.forEach(el => {
                  try {
                    const computedStyle = window.getComputedStyle(el);
                    if (computedStyle && computedStyle.borderWidth) {
                      el.style.borderWidth = '0.5px';
                      el.style.borderColor = '#333';
                      el.style.borderStyle = 'solid';
                    }
                  } catch (borderError) {
                    // Skip this element
                  }
                });
              } catch (tableError) {
                console.warn('Error processing tables in clone:', tableError);
              }
            } catch (cloneError) {
              console.warn('Error in onclone:', cloneError);
              // Continue anyway - html2canvas might still work
            }
          }
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css'], avoid: '.no-break' }
      };

      // Tạo PDF với timeout
      const pdfPromise = html2pdf().set(opt).from(element).save();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF generation timeout (30s)')), 30000)
      );
      
      await Promise.race([pdfPromise, timeoutPromise]);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Khôi phục lại display cho các phần tử no-print ngay cả khi có lỗi
      noPrintElements.forEach((el, index) => {
        el.style.display = originalDisplay[index] || '';
      });
      
      // Hiển thị thông báo lỗi chi tiết hơn
      let errorMessage = 'Có lỗi xảy ra khi tạo PDF.';
      if (error.message) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Tạo PDF mất quá nhiều thời gian. Vui lòng thử lại hoặc giảm nội dung.';
        } else if (error.message.includes('Element')) {
          errorMessage = 'Không tìm thấy nội dung để tạo PDF. Vui lòng refresh trang và thử lại.';
        } else {
          errorMessage = `Lỗi: ${error.message}. Vui lòng thử lại.`;
        }
      }
      alert(errorMessage);
    } finally {
      // Đảm bảo luôn restore UI state
      try {
        noPrintElements.forEach((el, index) => {
          if (el && originalDisplay[index] !== undefined) {
            el.style.display = originalDisplay[index] || '';
          }
        });
      } catch (restoreError) {
        console.warn('Error restoring UI state:', restoreError);
      }
      setIsGeneratingPDF(false);
    }
  }, [invoiceData]);
  
  // Tự động tải PDF nếu có query parameter download=true
  useEffect(() => {
    const shouldAutoDownload = searchParams.get("download") === "true";
    if (shouldAutoDownload && invoiceData && invoiceRef.current && !isGeneratingPDF) {
      // Đợi một chút để đảm bảo page đã render xong
      const timer = setTimeout(() => {
        handleDownloadPDF();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [invoiceData, searchParams, isGeneratingPDF, handleDownloadPDF]);

  const setPromoPrintChecked = (key, value) => {
    setPrintPromoChecked((prev) => ({ ...prev, [key]: value }));
  };
  const getPromoPrintChecked = (key) => printPromoChecked[key] !== false;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      // Fallback: select text
      const textArea = document.createElement("textarea");
      textArea.value = shareLink;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

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
    <div className="min-h-screen bg-white p-4 print:p-0 print:min-h-0" ref={invoiceRef}>
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
            margin: 6mm 8mm;
          }
          body {
            padding: 0;
            margin: 0;
            font-size: 9pt !important;
            line-height: 1.3 !important;
            font-family: 'Arial', 'Helvetica', sans-serif !important;
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
            margin-bottom: 3px !important;
            padding: 3px 4px !important;
            background-color: #f0f7ff !important;
            border-left: 3px solid #1e40af !important;
          }
          .max-w-4xl {
            max-width: 100% !important;
            padding: 0 !important;
          }
          td, th {
            padding: 3px 5px !important;
            font-size: 9pt !important;
            line-height: 1.3 !important;
            vertical-align: middle !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-bottom: 4px !important;
          }
          .table-bordered {
            border: 1px solid #4a5568 !important;
          }
          .table-bordered td,
          .table-bordered th {
            border: 0.5px solid #718096 !important;
          }
          .p-1 {
            padding: 3px 5px !important;
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
          img {
            max-width: 100% !important;
            height: auto !important;
          }
          .mt-2, .mt-4, .mt-5 {
            margin-top: 3px !important;
          }
          h2 {
            font-size: 11pt !important;
            padding: 2px !important;
            margin-bottom: 3px !important;
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
            margin-top: 6px !important;
            padding-top: 4px !important;
            border-top: 1px solid #cbd5e0 !important;
          }
          input[type="checkbox"] {
            width: 10px !important;
            height: 10px !important;
          }
          .mb-3 {
            margin-bottom: 3px !important;
          }
          strong {
            font-weight: 600 !important;
            color: #1a202c !important;
          }
          .header-logo {
            height: 35px !important;
            filter: brightness(0) invert(1) !important;
          }
          .header-title {
            font-size: 13pt !important;
            letter-spacing: 0.8px !important;
            font-weight: 700 !important;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
          }
          .header-container {
            background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%) !important;
            border-bottom: 3px solid #1e3a8a !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
          }
          .header-date {
            color: #ffffff !important;
            font-weight: 600 !important;
            font-size: 9pt !important;
          }
        }
        /* Screen styles */
        .table-bordered {
          border: 1px solid #cbd5e0;
        }
        .table-bordered td,
        .table-bordered th {
          border: 0.5px solid #e2e8f0;
        }
        .section-title {
          background-color: #eff6ff;
          border-left: 3px solid #3b82f6;
          padding: 6px 8px;
          margin-top: 12px;
          margin-bottom: 6px;
          font-weight: 600;
          color: #1e40af;
        }
        table {
          border-collapse: collapse;
          margin-bottom: 8px;
        }
        td, th {
          padding: 6px 8px;
          vertical-align: middle;
        }
        .header-container {
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%);
          border-bottom: 3px solid #1e3a8a;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 4px 4px 0 0;
        }
        .header-logo {
          height: 40px;
          filter: brightness(0) invert(1);
        }
        .header-title {
          font-size: 18px;
          letter-spacing: 1px;
          font-weight: 700;
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .header-date {
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        {/* Header: logo trái, tiêu đề căn giữa, ngày phải */}
        <div className="header-container mb-4">
          <table className="w-full border-collapse mb-0">
            <tbody>
              <tr className="align-middle">
                <td className="p-3 align-middle" style={{ width: "18%" }}>
                  <img
                    src={logoImage}
                    alt="VinFast"
                    className="header-logo w-auto object-contain object-left"
                  />
                </td>
                <td className="p-3 align-middle text-center" style={{ width: "64%" }}>
                  <span className="header-title uppercase">
                    BẢNG BÁO GIÁ CHI PHÍ MUA XE TẠM TÍNH
                  </span>
                </td>
                <td className="p-3 align-middle text-right" style={{ width: "18%" }}>
                  <span className="header-date">
                    {formatDate(invoiceData?.savedAt || new Date().toISOString())}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Thông tin khách hàng */}
        <table className="w-full border-collapse mb-3 text-sm bg-white">
          <tbody>
            <tr>
              <td className="p-2" style={{ width: "15%" }}>
                <strong>Kính Gửi:</strong>
              </td>
              <td className="p-2 font-semibold text-gray-800" style={{ width: "50%" }}>
                {(invoiceData.customerName || "QUÝ KHÁCH HÀNG").toUpperCase()}
              </td>
              <td className="p-2" style={{ width: "15%" }}>
                <strong>Nhu cầu:</strong>
              </td>
              <td className="p-2" style={{ width: "20%" }}>
                {getBusinessTypeLabel()}
              </td>
            </tr>
            <tr>
              <td className="p-2" style={{ width: "15%" }}>
                <strong>Địa Chỉ:</strong>
              </td>
              <td className="p-2" colSpan="3">
                {invoiceData.customerAddress || "Thành phố Hồ Chí Minh"}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section: Thông tin sản phẩm */}
        <div className="section-title text-blue-900 font-bold uppercase text-sm">
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

        {/* Section: Giá xe & Chương trình khuyến mãi */}
        <div className="section-title text-blue-900 font-bold uppercase text-sm">
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
                <tr className="bg-blue-50">
                  <td className="p-1" colSpan="2">
                    Tiền vay ngân hàng {invoiceData.loanRatio ? `(${invoiceData.loanRatio}%)` : ''}
                  </td>
                  <td className="p-1 text-right text-blue-600" colSpan="2">
                    <strong>{formatCurrency(Math.abs(invoiceData.tienVayTuGiaXHD || 0))}</strong>
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

        {/* Section: Chi phí lăn bánh */}
        <div className="section-title text-blue-900 font-bold uppercase text-sm">
          Chi phí lăn bánh
        </div>
        <table className="w-full border-collapse mb-0 text-sm bg-white table-bordered">
          <thead>
            <tr className="bg-blue-50">
              <td className="p-2 font-semibold text-gray-800" style={{ width: "8%" }}>STT</td>
              <td className="p-2 font-semibold text-gray-800" style={{ width: "32%" }}>Hạng mục</td>
              <td className="p-2 font-semibold text-gray-800" style={{ width: "15%" }}>Chi tiết</td>
              <td className="p-2 text-right font-semibold text-gray-800" style={{ width: "18%" }}>Số tiền</td>
              <td className="p-2 text-right font-semibold text-gray-800" style={{ width: "27%" }}>Loại chứng từ</td>
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

        {/* Section: Tổng chi phí lăn bánh */}
        <div className="section-title text-blue-900 font-bold uppercase text-sm">
          Tổng chi phí lăn bánh
        </div>
        <table className="w-full border-collapse mb-0 text-sm bg-white table-bordered">
          <tbody>
            <tr className="bg-blue-50">
              <td
                className="p-2 font-semibold text-gray-800"
                style={{ width: "8%" }}
              >
                STT
              </td>
              <td
                className="p-2 font-semibold text-gray-800"
                style={{ width: "40%" }}
              >
                Hạng mục
              </td>
              <td
                className="p-2 text-center font-semibold text-gray-800"
                style={{ width: "15%" }}
              >
                Chi tiết
              </td>
              <td
                className="p-2 text-right font-semibold text-gray-800"
                style={{ width: "37%" }}
              >
                Số tiền
              </td>
            </tr>
            {invoiceData.hasLoan ? (
              <>
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
                    Tiền ngân hàng
                  </td>
                  <td
                    className="p-1 text-center"
                    style={{ width: "15%" }}
                  >
                    {invoiceData.loanRatio ? `${invoiceData.loanRatio}%` : ''}
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
                    Đối ứng
                  </td>
                  <td
                    className="p-1 text-center"
                    style={{ width: "15%" }}
                  ></td>
                  <td
                    className="p-1 text-right"
                    style={{ width: "37%" }}
                  >
                    {formatCurrency(invoiceData.soTienThanhToanDoiUng || 0)}
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
                    style={{ width: "40%" }}
                  >
                    Tổng chi phí lăn bánh
                  </td>
                  <td
                    className="p-1 text-center"
                    style={{ width: "15%" }}
                  ></td>
                  <td
                    className="p-1 text-right"
                    style={{ width: "37%" }}
                  >
                    {formatCurrency(
                      (Number(invoiceData.liabilityInsurance) || 0) +
                      (Number(invoiceData.plateFee) || 0) +
                      (Number(invoiceData.inspectionFee) || 0) +
                      (Number(invoiceData.roadFee) || 0) +
                      (Number(invoiceData.registrationFee) || 0) +
                      (Number(invoiceData.isBodyInsuranceManual ? invoiceData.bodyInsuranceFee : invoiceData.bodyInsurance) || 0)
                    )}
                  </td>
                </tr>
              </>
            ) : (
              <>
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
                    Giá thanh toán thực tế
                  </td>
                  <td
                    className="p-1 text-center"
                    style={{ width: "15%" }}
                  ></td>
                  <td
                    className="p-1 text-right"
                    style={{ width: "37%" }}
                  >
                    {formatCurrency(invoiceData.giaThanhToanThucTe || invoiceData.priceFinalPayment || invoiceData.carTotal || 0)}
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
                    Tổng chi phí lăn bánh
                  </td>
                  <td
                    className="p-1 text-center"
                    style={{ width: "15%" }}
                  ></td>
                  <td
                    className="p-1 text-right"
                    style={{ width: "37%" }}
                  >
                    {formatCurrency(
                      (Number(invoiceData.liabilityInsurance) || 0) +
                      (Number(invoiceData.plateFee) || 0) +
                      (Number(invoiceData.inspectionFee) || 0) +
                      (Number(invoiceData.roadFee) || 0) +
                      (Number(invoiceData.registrationFee) || 0) +
                      (Number(invoiceData.isBodyInsuranceManual ? invoiceData.bodyInsuranceFee : invoiceData.bodyInsurance) || 0)
                    )}
                  </td>
                </tr>
              </>
            )}
            <tr className="bg-blue-50">
              <td className="p-1" colSpan="3">
                <strong>Tổng</strong>
              </td>
              <td className="p-1 text-right">
                <strong>
                  {(() => {
                    if (!invoiceData) return formatCurrency(0);
                    
                    // Tính tổng chi phí lăn bánh (các phí)
                    const totalOnRoadCost = 
                      (Number(invoiceData.liabilityInsurance) || 0) +
                      (Number(invoiceData.plateFee) || 0) +
                      (Number(invoiceData.inspectionFee) || 0) +
                      (Number(invoiceData.roadFee) || 0) +
                      (Number(invoiceData.registrationFee) || 0) +
                      (Number(invoiceData.isBodyInsuranceManual ? invoiceData.bodyInsuranceFee : invoiceData.bodyInsurance) || 0);
                    
                    if (invoiceData.hasLoan) {
                      // Nếu có vay: Tổng = Tiền ngân hàng + Đối ứng + Tổng chi phí lăn bánh
                      const loanAmount = Number(invoiceData.loanAmount) || 0;
                      const soTienThanhToanDoiUng = Number(invoiceData.soTienThanhToanDoiUng) || 0;
                      const tongChiPhiLanBanh = loanAmount + soTienThanhToanDoiUng + totalOnRoadCost;
                      return formatCurrency(tongChiPhiLanBanh);
                    } else {
                      // Nếu không vay: Tổng = Giá thanh toán thực tế + Tổng chi phí lăn bánh
                      const giaThanhToanThucTe = 
                        Number(invoiceData.giaThanhToanThucTe) || 
                        Number(invoiceData.priceFinalPayment) || 
                        Number(invoiceData.carTotal) || 0;
                      const tongChiPhiLanBanh = giaThanhToanThucTe + totalOnRoadCost;
                      return formatCurrency(tongChiPhiLanBanh);
                    }
                  })()}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Section: Phương thức thanh toán */}
        <div className="section-title text-blue-900 font-bold uppercase text-sm">
          Phương thức thanh toán
        </div>
        <table className="w-full border-collapse mb-0 text-sm bg-white table-bordered">
          <tbody>
            <tr className="bg-blue-50">
              <td
                className="p-2 font-semibold text-gray-800"
                style={{ width: "25%" }}
              >
                Hình thức
              </td>
              <td
                className="p-2 text-right font-semibold text-gray-800"
                style={{ width: "25%" }}
              >
                Đặt cọc
              </td>
              <td
                className="p-2 text-right font-semibold text-gray-800"
                style={{ width: "25%" }}
              >
                Lần 1: Xuất hóa đơn
              </td>
              <td
                className="p-2 text-right font-semibold text-gray-800"
                style={{ width: "25%" }}
              >
                Lần 2: Đăng ký
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
            {/* Section: Quà tặng */}
            <div className="section-title text-blue-900 font-bold uppercase text-sm">
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
          <div className="flex flex-col gap-4 items-center">
            <div className="flex gap-4 justify-center">
              <button
                onClick={handlePrint}
                className="px-8 py-3 bg-blue-900 text-white font-bold rounded cursor-pointer transition-all hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg flex items-center gap-2"
              >
                IN BÁO GIÁ
              </button>
            </div>
            
            {/* Share Link Section */}
            {shareLink && (
              <div className="w-full max-w-2xl mt-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Link tự động tải PDF:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                    title="Copy link"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Đã copy
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Copy link này và gửi cho khách hàng. Khi mở link, PDF sẽ tự động tải về.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
