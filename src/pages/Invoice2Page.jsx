import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, Copy, Check } from "lucide-react";
import html2pdf from "html2pdf.js";
import { formatCurrency } from "../data/calculatorData";

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
  "vinClubDiscount", "convertSupportDiscount", "quanDoiCongAnDiscount", "premiumColorDiscount", "bhvc2Discount",
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
    ["basicDiscount", "vinClubDiscount", "bhvc2Discount", "premiumColorDiscount", "convertSupportDiscount", "quanDoiCongAnDiscount"].forEach((k) => {
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

  // Calculate payment schedule: Lần 1 = Giá thanh toán thực tế - Đặt cọc - Tiền vay; Lần 2 = Tổng chi phí lăn bánh
  const deposit = Number(invoiceData.depositAmount || 0);
  const giaThanhToanThucTe = Number(invoiceData.giaThanhToanThucTe || invoiceData.priceFinalPayment || invoiceData.carTotal || 0);
  const tienVayNganHang = Number(invoiceData.loanAmount || invoiceData.tienVayTuGiaXHD || 0);
  const tongChiPhiLanBanh = Number(invoiceData.totalOnRoadCost || 0);
  const payment1 = Math.max(0, Math.round(giaThanhToanThucTe - deposit - tienVayNganHang)); // Lần 1: Xuất hóa đơn
  const payment2 = tongChiPhiLanBanh; // Lần 2: Đăng ký = Tổng chi phí lăn bánh

  // Get current date for footer
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();

  const extraOnRoadTotal = Array.isArray(invoiceData.extraOnRoadRows)
    ? invoiceData.extraOnRoadRows.reduce(
        (sum, row) => sum + (Number(row.amount) || 0),
        0
      )
    : 0;

  const totalOnRoadFees =
    (Number(invoiceData.liabilityInsurance) || 0) +
    (Number(invoiceData.plateFee) || 0) +
    (Number(invoiceData.inspectionFee) || 0) +
    (Number(invoiceData.roadFee) || 0) +
    (Number(invoiceData.registrationFee) || 0) +
    (Number(invoiceData.isBodyInsuranceManual ? invoiceData.bodyInsuranceFee : invoiceData.bodyInsurance) || 0) +
    extraOnRoadTotal;

  // TỔNG CHI PHÍ LĂN BÁNH (thanh màu xanh) = Giá thanh toán thực tế + Tổng chi phí lăn bánh (phí)
  const basePaymentAmount =
    Number(invoiceData.giaThanhToanThucTe) ||
    Number(invoiceData.priceFinalPayment) ||
    Number(invoiceData.carTotal) ||
    0;
  const grandTotal = basePaymentAmount + totalOnRoadFees;
  const cashDiscount = (Number(invoiceData.giaXuatHoaDon) || Number(invoiceData.priceFinalPayment) || Number(invoiceData.carTotal) || 0) -
    (Number(invoiceData.giaThanhToanThucTe) || Number(invoiceData.priceFinalPayment) || Number(invoiceData.carTotal) || 0);

  return (
    <div className="bao-gia-page min-h-screen bg-white p-4 print:p-0 print:min-h-0" ref={invoiceRef}>
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
        /* ========== SCREEN STYLES ========== */
        .bao-gia-page {
          font-family: 'Roboto', 'Arial', 'Helvetica', sans-serif;
        }
        .bao-gia-wrap {
          max-width: 210mm;
          margin: 0 auto;
          padding: 8mm 10mm;
        }
        .section-bar {
          background: #1a365d;
          color: #fff;
          padding: 6px 10px;
          font-weight: 700;
          font-size: 10pt;
          text-transform: uppercase;
          margin-top: 10px;
          margin-bottom: 0;
        }
        .row-highlight-yellow { background: #fef9c3; }
        .row-highlight-orange { background: #fed7aa; }
        .total-bar {
          background: #1a365d;
          color: #fff;
          padding: 8px 10px;
          font-weight: 700;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .total-bar .amount { font-size: 14pt; }
        table.bao-gia-table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 6px;
          border: 1px solid #333;
        }
        .bao-gia-table td, .bao-gia-table th {
          border: 0.5px solid #333;
          padding: 5px 8px;
          vertical-align: middle;
          font-size: 10pt;
        }
        .bao-gia-table thead tr { background: #e2e8f0; }
        .text-right-num { text-align: right; }
        .header-logo-img { height: 40px; }
        .header-title-txt { font-size: 16px; font-weight: 700; }
        /* Khu vực ký tên: không có đường kẻ, khoảng trống lớn để ký, không bị ngắt trang */
        .signature-block {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .signature-instruction {
          margin-top: 3rem;
          padding-top: 0.25rem;
        }

        /* ========== PRINT STYLES ========== */
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          /* Bỏ cột mờ hai bên lề: ép nền trắng toàn trang */
          html, body {
            background: #fff !important;
            background-color: #fff !important;
          }
          /* Buộc trình duyệt giữ màu nền khi in */
          body, .bao-gia-page, .bao-gia-wrap,
          .section-bar, .row-highlight-yellow, .row-highlight-orange, .total-bar,
          .bao-gia-table thead tr {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            padding: 0 !important;
            margin: 0 !important;
            font-family: 'Arial', 'Helvetica', sans-serif !important;
            font-size: 9pt !important;
            line-height: 1.25 !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
          .bao-gia-page {
            min-height: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .bao-gia-wrap {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Thanh tiêu đề section - xanh đậm, giữ màu */
          .section-bar {
            background: #1a365d !important;
            color: #fff !important;
            padding: 4px 8px !important;
            font-weight: 700 !important;
            font-size: 9pt !important;
            text-transform: uppercase !important;
            margin-top: 6px !important;
            margin-bottom: 0 !important;
          }
          /* Dòng giá xuất hóa đơn - vàng */
          .row-highlight-yellow {
            background: #fef9c3 !important;
          }
          /* Dòng giá thanh toán thực tế - cam */
          .row-highlight-orange {
            background: #fed7aa !important;
          }
          /* Thanh tổng chi phí - xanh đậm */
          .total-bar {
            background: #1a365d !important;
            color: #fff !important;
            padding: 5px 8px !important;
            font-weight: 700 !important;
          }
          .total-bar .amount { font-size: 11pt !important; }
          /* Bảng: giữ border khi in */
          table.bao-gia-table {
            border-collapse: collapse !important;
            width: 100% !important;
            margin-bottom: 3px !important;
            page-break-inside: avoid !important;
            border: 1px solid #000 !important;
          }
          .bao-gia-table td, .bao-gia-table th {
            border: 0.5px solid #000 !important;
            padding: 2px 5px !important;
            font-size: 8pt !important;
            vertical-align: middle !important;
          }
          .bao-gia-table thead tr {
            background: #1a365d !important;
            color: #fff !important;
          }
          .bao-gia-table thead th {
            color: #fff !important;
            font-weight: 700 !important;
          }
          .text-right-num { text-align: right !important; }
          .header-row { border-bottom: none !important; }
          .header-logo-img { height: 28px !important; }
          .header-title-txt { font-size: 11pt !important; font-weight: 700 !important; }
          .invoice-footer {
            margin-top: 6px !important;
            padding-top: 4px !important;
            border-top: 1px solid #333 !important;
          }
          .signature-block {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .signature-instruction {
            margin-top: 2.5rem !important;
            padding-top: 0.25rem !important;
          }
          /* Thu nhỏ khoảng cách để fit 1 trang A4 */
          .bao-gia-wrap .mb-4 { margin-bottom: 6px !important; }
          .bao-gia-wrap .mt-4 { margin-top: 6px !important; }
          .bao-gia-wrap .mt-6 { margin-top: 8px !important; }
          .bao-gia-wrap .mt-1 { margin-top: 2px !important; }
        }
      `}</style>

      <div className="bao-gia-wrap">
        {/* Header: logo trái, tiêu đề giữa, ngày phải */}
        <div className="flex items-center justify-between gap-4 mb-4 header-row">
          <div className="flex-shrink-0">
            <img src={logoImage} alt="VinFast" className="header-logo-img w-auto object-contain" />
          </div>
          <h1 className="header-title-txt uppercase text-center flex-1 mx-2" style={{ margin: 0 }}>
            BẢNG BÁO GIÁ CHI PHÍ MUA XE TẠM TÍNH
          </h1>
          <div className="flex-shrink-0 text-right font-semibold text-gray-800">
            {formatDate(invoiceData?.savedAt || new Date().toISOString())}
          </div>
        </div>

        {/* Thông tin khách hàng - 2 cột */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mb-4 text-sm">
          <div>
            <p className="mb-1"><strong>Kính gửi:</strong> {(invoiceData.customerName || "Quý khách hàng").trim() || "—"}</p>
            <p className="mb-0"><strong>Địa chỉ:</strong> {invoiceData.customerAddress || "—"}</p>
          </div>
          <div>
            <p className="mb-1"><strong>Nhu cầu:</strong> {getBusinessTypeLabel()}</p>
            <p className="mb-0"><strong>Loại khách:</strong> {invoiceData.customerType === "ca_nhan" ? "Cá nhân" : "Kinh doanh"}</p>
          </div>
        </div>

        {/* THÔNG TIN SẢN PHẨM */}
        <div className="section-bar">Thông tin sản phẩm</div>
        <table className="bao-gia-table">
          <tbody>
            <tr><td style={{ width: "28%" }}><strong>Dòng xe</strong></td><td>{invoiceData.carModel || "—"}</td></tr>
            <tr><td><strong>Phiên bản</strong></td><td>{invoiceData.carVersion || "—"}</td></tr>
            <tr><td><strong>Ngoại thất</strong></td><td>{getExteriorColorName() || "—"}</td></tr>
            <tr><td><strong>Nội thất</strong></td><td>{getInteriorColorName() || "—"}</td></tr>
          </tbody>
        </table>

        {/* GIÁ XE & CHƯƠNG TRÌNH KHUYẾN MÃI */}
        <div className="section-bar">Giá xe & Chương trình khuyến mãi</div>
        <table className="bao-gia-table">
          <tbody>
            <tr>
              <td style={{ width: "50%" }}><strong>Giá xe đã bao gồm VAT</strong> — Kèm Pin</td>
              <td className="text-right-num">{formatCurrency(invoiceData.carBasePrice || 0)}</td>
            </tr>
            {invoiceData.selectedPromotions && invoiceData.selectedPromotions.length > 0 &&
              invoiceData.selectedPromotions.map((promo, index) => {
                const key = `selectedPromo_${index}`;
                return (
                  <tr key={promo.id || index}>
                    <td>{promo.name || promo.ten_chuong_trinh}</td>
                    <td className="text-right-num">
                      {formatCurrency(
                        typeof promo.calculatedDiscount === "number"
                          ? promo.calculatedDiscount
                          : promo.type === "percentage"
                            ? Math.round((Number(invoiceData.carBasePrice) || 0) * (Number(promo.value) || 0) / 100)
                            : promo.value || 0
                      )}
                    </td>
                  </tr>
                );
              })}
            {invoiceData.promotionCheckboxes?.discountBhvc2 && (
              <tr>
                <td>Quy đổi 2 năm bảo hiểm</td>
                <td className="text-right-num">{formatCurrency(invoiceData.bhvc2Discount || 0)}</td>
              </tr>
            )}
            {invoiceData.promotionCheckboxes?.discountPremiumColor && (
              <tr>
                <td>Miễn phí màu nâng cao</td>
                <td className="text-right-num">{formatCurrency(invoiceData.premiumColorDiscount || 0)}</td>
              </tr>
            )}
            {invoiceData.promotionCheckboxes?.convertCheckbox && (
              <tr>
                <td>Xăng đổi điện</td>
                <td className="text-right-num">{formatCurrency(invoiceData.convertSupportDiscount || 0)}</td>
              </tr>
            )}
            {invoiceData.promotionCheckboxes?.quanDoiCongAnCheckbox && (
              <tr>
                <td>Quân Đội & Công An</td>
                <td className="text-right-num">{formatCurrency(invoiceData.quanDoiCongAnDiscount || 0)}</td>
              </tr>
            )}
            {invoiceData.promotionCheckboxes?.vinClubVoucher && invoiceData.promotionCheckboxes.vinClubVoucher !== "none" && !invoiceData.promotionCheckboxes?.hoTroLaiSuat && (
              <tr>
                <td>Hạng thành viên VinClub</td>
                <td className="text-right-num">{formatCurrency(invoiceData.vinClubDiscount || 0)}</td>
              </tr>
            )}
            {Array.isArray(invoiceData.customBenefits) &&
              invoiceData.customBenefits.map((b, index) => (
                <tr key={b.id || `custom_${index}`}>
                  <td>{b.label || "Ưu đãi khác"}</td>
                  <td className="text-right-num">
                    {formatCurrency(b.amount || 0)}
                  </td>
                </tr>
              ))}
            <tr className="row-highlight-yellow">
              <td><strong>Giá xuất hóa đơn</strong></td>
              <td className="text-right-num"><strong>{formatCurrency(invoiceData.giaXuatHoaDon || invoiceData.priceFinalPayment || invoiceData.carTotal || 0)}</strong></td>
            </tr>
            {cashDiscount !== 0 && (
              <tr>
                <td>Ưu đãi tiền mặt</td>
                <td className="text-right-num">{formatCurrency(Math.abs(cashDiscount))}</td>
              </tr>
            )}
            <tr className="row-highlight-orange">
              <td><strong>Giá thanh toán thực tế</strong></td>
              <td className="text-right-num"><strong>{formatCurrency(invoiceData.giaThanhToanThucTe || invoiceData.priceFinalPayment || invoiceData.carTotal || 0)}</strong></td>
            </tr>
            {invoiceData.hasLoan && (
              <>
                <tr>
                  <td>Tiền vay ngân hàng {invoiceData.loanRatio ? `(${invoiceData.loanRatio}%)` : ""}</td>
                  <td className="text-right-num">{formatCurrency(Math.abs(invoiceData.tienVayTuGiaXHD || 0))}</td>
                </tr>
                <tr>
                  <td><strong>Số tiền thanh toán (đối ứng)</strong></td>
                  <td className="text-right-num"><strong>{formatCurrency(invoiceData.soTienThanhToanDoiUng || 0)}</strong></td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        {/* CHI PHÍ LĂN BÁNH - bảng STT, Tên phí, Ghi chú, Số tiền */}
        <div className="section-bar">Chi phí lăn bánh</div>
        <table className="bao-gia-table">
          <thead>
            <tr className="bg-slate-100">
              <th style={{ width: "8%" }}>STT</th>
              <th style={{ width: "38%" }}>Tên phí</th>
              <th style={{ width: "26%" }}>Ghi chú</th>
              <th style={{ width: "28%" }} className="text-right-num">Số tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Lệ phí trước bạ</td>
              <td>
                {invoiceData.onRoadNotes?.beforeTax ||
                  (invoiceData.carModel &&
                  String(invoiceData.carModel).includes("VF")
                    ? "0%"
                    : "10%")}
              </td>
              <td className="text-right-num">Miễn phí</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Phí 01 năm BH Dân sự</td>
              <td>{invoiceData.onRoadNotes?.liability || ""}</td>
              <td className="text-right-num">
                {formatCurrency(invoiceData.liabilityInsurance || 0)}
              </td>
            </tr>
            <tr>
              <td>3</td>
              <td>Phí cấp biển số</td>
              <td>
                {invoiceData.onRoadNotes?.plate || getRegistrationLocationLabel()}
              </td>
              <td className="text-right-num">
                {formatCurrency(invoiceData.plateFee || 0)}
              </td>
            </tr>
            <tr>
              <td>4</td>
              <td>Phí kiểm định</td>
              <td>{invoiceData.onRoadNotes?.inspection || ""}</td>
              <td className="text-right-num">
                {formatCurrency(invoiceData.inspectionFee || 0)}
              </td>
            </tr>
            <tr>
              <td>5</td>
              <td>Phí bảo trì đường bộ</td>
              <td>
                {invoiceData.onRoadNotes?.road || getCustomerTypeLabel()}
              </td>
              <td className="text-right-num">
                {formatCurrency(invoiceData.roadFee || 0)}
              </td>
            </tr>
            <tr>
              <td>6</td>
              <td>Phí dịch vụ</td>
              <td>{invoiceData.onRoadNotes?.service || ""}</td>
              <td className="text-right-num">
                {formatCurrency(invoiceData.registrationFee || 0)}
              </td>
            </tr>
            <tr>
              <td>7</td>
              <td>BHVC bao gồm Pin</td>
              <td>
                {invoiceData.onRoadNotes?.bodyInsurance || getBusinessTypeLabel()}
              </td>
              <td className="text-right-num">
                {formatCurrency(
                  invoiceData.isBodyInsuranceManual
                    ? invoiceData.bodyInsuranceFee
                    : invoiceData.bodyInsurance || 0
                )}
              </td>
            </tr>
            {Array.isArray(invoiceData.extraOnRoadRows) &&
              invoiceData.extraOnRoadRows.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td>{8 + idx}</td>
                  <td>{row.name || "Chi phí khác"}</td>
                  <td>{row.note || ""}</td>
                  <td className="text-right-num">
                    {formatCurrency(row.amount || 0)}
                  </td>
                </tr>
              ))}
            <tr className="bg-slate-100 font-semibold">
              <td colSpan="3">Tổng chi phí lăn bánh (phí)</td>
              <td className="text-right-num">
                {formatCurrency(totalOnRoadFees)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="total-bar">
          <span>TỔNG CHI PHÍ</span>
          <span className="amount">{formatCurrency(grandTotal)}</span>
        </div>
        {invoiceData.hasLoan && (
          <table className="bao-gia-table mt-1">
            <tbody>
              <tr>
                <td style={{ width: "50%" }}>1 Ngân hàng ({invoiceData.loanRatio || 0}%)</td>
                <td className="text-right-num">{formatCurrency(invoiceData.loanAmount || 0)}</td>
              </tr>
              <tr>
                <td>2 Đối ứng</td>
                <td className="text-right-num">{formatCurrency(invoiceData.soTienThanhToanDoiUng || 0)}</td>
              </tr>
            </tbody>
          </table>
        )}

        {/* PHƯƠNG THỨC THANH TOÁN */}
        <div className="section-bar">Phương thức thanh toán</div>
        <table className="bao-gia-table">
          <thead>
            <tr className="bg-slate-100">
              <th style={{ width: "25%" }}>Hình thức</th>
              <th style={{ width: "25%" }} className="text-right-num">Đặt cọc</th>
              <th style={{ width: "25%" }} className="text-right-num">Lần 1: Xuất hóa đơn</th>
              <th style={{ width: "25%" }} className="text-right-num">Lần 2: Đăng ký</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Trả góp</td>
              <td className="text-right-num">{formatCurrency(deposit)}</td>
              <td className="text-right-num">{formatCurrency(payment1)}</td>
              <td className="text-right-num">{formatCurrency(payment2)}</td>
            </tr>
          </tbody>
        </table>

        {/* QUÀ TẶNG */}
        {(invoiceData.gifts && invoiceData.gifts.length > 0) && (
          <>
            <div className="section-bar">Quà tặng</div>
            <table className="bao-gia-table">
              <thead>
                <tr className="bg-slate-100">
                  <th style={{ width: "85%" }}>Nội dung</th>
                  <th style={{ width: "15%" }} className="text-right-num">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.gifts.map((gift, index) => (
                  <tr key={index}>
                    <td>{index + 1}. {gift.name}</td>
                    <td className="text-right-num">{gift.price || "Tặng"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <p className="text-sm mt-4 mb-1">
          Lưu ý: Báo giá có hiệu lực đến hết ngày 31/03/2026.
        </p>
        <p className="text-sm text-right mb-2">
          <strong>Tp. Hồ Chí Minh, Ngày {day} Tháng {month} Năm {year}</strong>
        </p>
        <footer className="invoice-footer signature-block flex justify-between text-sm">
          <div className="text-center signature-field" style={{ width: "40%" }}>
            <strong>Khách hàng</strong>
            <p className="signature-instruction">(Ký và ghi rõ họ tên)</p>
          </div>
          <div className="text-center signature-field" style={{ width: "40%" }}>
            <strong>Người báo giá</strong>
            <p className="signature-instruction">(Ký và ghi rõ họ tên)</p>
          </div>
        </footer>

        <div className="text-center mt-6 pt-4 border-t-2 border-blue-900 no-print">
          <div className="flex flex-col gap-4 items-center">
            <button
              onClick={handlePrint}
              className="px-8 py-3 bg-blue-900 text-white font-bold rounded cursor-pointer hover:bg-blue-700"
            >
              IN BÁO GIÁ
            </button>
            {shareLink && (
              <div className="w-full max-w-2xl mt-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Link tự động tải PDF:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded bg-white text-sm"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 text-sm"
                  >
                    {linkCopied ? <><Check className="w-4 h-4" /> Đã copy</> : <><Copy className="w-4 h-4" /> Copy</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
