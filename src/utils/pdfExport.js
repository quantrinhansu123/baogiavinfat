import html2pdf from 'html2pdf.js';

/**
 * In nhanh: dùng cùng quy trình in với nút "In" (API in trình duyệt):
 * - Nội dung in: phần tử #printable-content (hoặc ref printableRef).
 * - PrintStyles @media print: ẩn body *, chỉ hiện #printable-content, khổ A4, margin 15mm 20mm.
 * - Các nút có print:hidden nên không in.
 * Trình duyệt không cho gọi window.print() mà không mở cửa sổ in, nên ta tạo PDF từ
 * chính phần tử #printable-content (cùng nội dung, cùng layout) bằng html2pdf và tải về,
 * không mở hộp thoại in.
 */
const defaultOpts = {
  margin: [15, 20, 15, 20], // Khớp @page { margin: 15mm 20mm; } trong PrintStyles
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { scale: 2, useCORS: true, logging: false },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  pagebreak: { mode: ['css', 'legacy'], before: '.page-break-before', after: '.page-break-after', avoid: 'tr' },
};

/**
 * In nhanh: xuất PDF từ đúng nội dung in (#printable-content / printableRef), cùng layout
 * với quy trình in (PrintStyles), không mở cửa sổ in.
 * @param {HTMLElement | null} element - Phần tử mẫu in (printableRef hoặc #printable-content)
 * @param {string} filename - Tên file (không cần .pdf)
 * @returns {Promise<void>}
 */
export function downloadElementAsPdf(element, filename = 'document') {
  const el = element || document.getElementById('printable-content');
  if (!el) return Promise.reject(new Error('Không tìm thấy nội dung để xuất PDF'));

  const safeName = (filename || 'document').replace(/[^a-z0-9_\-\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi, '') || 'document';
  const pdfFilename = safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`;

  return html2pdf()
    .set(defaultOpts)
    .from(el)
    .outputPdf('blob')
    .then((blob) => {
      if (!blob || !(blob instanceof Blob)) return Promise.reject(new Error('Tạo PDF thất bại'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfFilename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
}
