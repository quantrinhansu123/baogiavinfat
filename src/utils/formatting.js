/**
 * Formatting utilities for currency and dates
 */

/**
 * Format number as Vietnamese currency
 * @param {number|string} value - Amount to format
 * @param {boolean} withSuffix - Include "VNĐ" suffix
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, withSuffix = false) => {
  if (value === undefined || value === null || value === '' || value === 0) return '';

  const num = typeof value === 'string'
    ? parseInt(value.replace(/\D/g, ''), 10)
    : value;

  if (isNaN(num) || num === 0) return '';

  const formatted = new Intl.NumberFormat('vi-VN').format(num);
  return withSuffix ? `${formatted} VNĐ` : formatted;
};

/**
 * Format date for display
 * @param {string|Date} dateStr - Date to format
 * @returns {string} DD/MM/YYYY format
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
      return dateStr;
    }
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString('vi-VN');
  } catch {
    return '';
  }
};

/**
 * Format date with blank placeholder for print
 * @param {string|Date} dateStr - Date to format
 * @param {string} placeholder - Placeholder if date is empty
 * @returns {string} Formatted date or placeholder
 */
export const formatDateOrPlaceholder = (dateStr, placeholder = '___/___/______') => {
  const formatted = formatDate(dateStr);
  return formatted || placeholder;
};

/** Tách chuỗi ưu đãi theo dấu phẩy (có hoặc không có khoảng trắng sau dấu phẩy). */
const splitUuDaiByComma = (text) => {
  const trimmed = String(text).trim();
  if (!trimmed) return [];
  if (!trimmed.includes(',')) return [trimmed];
  return trimmed.split(/,\s*/).map((part) => part.trim()).filter(Boolean);
};

/**
 * Chuyển uuDai (mảng / chuỗi / JSON) thành danh sách dòng — mỗi mục sau dấu phẩy một dòng.
 * @param {string|string[]|null|undefined} value
 * @returns {string[]}
 */
export const uuDaiToLines = (value) => {
  if (value == null || value === '') return [];

  const toLines = (raw) => {
    const str = String(raw).trim();
    if (!str) return [];
    if (str.includes('\n')) {
      return str
        .split('\n')
        .flatMap((line) => splitUuDaiByComma(line));
    }
    return splitUuDaiByComma(str);
  };

  if (Array.isArray(value)) {
    return value.flatMap((item) => toLines(item));
  }

  const str = String(value).trim();
  if (!str) return [];

  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) {
      return parsed.flatMap((item) => toLines(item));
    }
  } catch {
    // not JSON
  }

  return toLines(str);
};

/**
 * @param {string|string[]|null|undefined} value
 * @returns {string}
 */
export const uuDaiToMultilineString = (value) => uuDaiToLines(value).join('\n');
