import html2pdf from 'html2pdf.js';

const defaultOpts = {
  margin: [8, 8, 8, 8],
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { scale: 2, useCORS: true },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
};

/**
 * Xuất nội dung một phần tử HTML thành file PDF và tải xuống.
 * @param {HTMLElement | null} element - Phần tử cần xuất (hoặc null để dùng id)
 * @param {string} filename - Tên file (không cần .pdf)
 * @returns {Promise<void>}
 */
export function downloadElementAsPdf(element, filename = 'document') {
  const el = element || document.getElementById('printable-content');
  if (!el) return Promise.reject(new Error('Không tìm thấy nội dung để xuất PDF'));

  const safeName = (filename || 'document').replace(/[^a-z0-9_\-\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi, '') || 'document';
  const pdfFilename = safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`;

  return html2pdf()
    .set({ ...defaultOpts, filename: pdfFilename })
    .from(el)
    .save();
}
