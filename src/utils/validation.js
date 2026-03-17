/**
 * Validation utilities for VinFast Dealer Management System
 * Centralized validation functions for reuse across components
 */

// ============================================
// REGEX PATTERNS
// ============================================

/** CCCD: 12 digits exactly */
const CCCD_REGEX = /^\d{12}$/;

/** Vietnamese phone: (0|+84)(3|5|7|8|9)XXXXXXXX */
const VN_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

/** VSO format: S00XXX-VSO-YY-MM-NNNN or S00XXX-VSO-YY-MM-NNNNN */
const VSO_REGEX = /^S\d{5}-VSO-\d{2}-\d{2}-\d{4,5}$/;

/** maDms format: S followed by 5 digits */
const MA_DMS_REGEX = /^S\d{5}$/;

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate Vietnamese Citizen ID (CCCD)
 * @param {string} cccd - CCCD number to validate
 * @returns {boolean} true if valid 12-digit CCCD
 */
export const isValidCCCD = (cccd) => {
  if (!cccd || typeof cccd !== 'string') return false;
  const cleaned = cccd.replace(/\s/g, '');
  return CCCD_REGEX.test(cleaned);
};

/**
 * Validate Vietnamese phone number
 * Accepts: 0912345678, +84912345678
 * @param {string} phone - Phone number to validate
 * @returns {boolean} true if valid VN phone format
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-\.]/g, '');
  return VN_PHONE_REGEX.test(cleaned);
};

/** Default Vietnam country code for storage and display */
export const VN_PHONE_PREFIX = '+84';

/**
 * Normalize phone number to Vietnam format (+84...).
 * Use for storage and display so all numbers are consistently +84.
 * @param {string} phone - Raw input (e.g. 0912345678, 84912345678, +84912345678)
 * @returns {string} Normalized e.g. +84912345678, or '' if empty/invalid
 */
export const normalizePhoneToVn = (phone) => {
  if (phone === null || phone === undefined) return '';
  const s = String(phone).trim();
  if (!s) return '';
  const cleaned = s.replace(/[\s\-\.]/g, '');
  if (cleaned.startsWith('+84')) return cleaned;
  if (cleaned.startsWith('84') && cleaned.length >= 10) return '+' + cleaned;
  if (cleaned.startsWith('0') && cleaned.length >= 10) return '+84' + cleaned.slice(1);
  // 9 digits without leading 0: 912345678 -> +84912345678
  if (/^[35789]\d{8}$/.test(cleaned)) return '+84' + cleaned;
  return '';
};

/**
 * Validate VSO format
 * @param {string} vso - VSO string to validate
 * @returns {boolean} true if matches S00XXX-VSO-YY-MM-NNNN
 */
export const isValidVSO = (vso) => {
  if (!vso || typeof vso !== 'string') return false;
  return VSO_REGEX.test(vso);
};

/**
 * Validate maDms format (branch code)
 * @param {string} maDms - Branch code to validate
 * @returns {boolean} true if matches S followed by 5 digits
 */
export const isValidMaDms = (maDms) => {
  if (!maDms || typeof maDms !== 'string') return false;
  return MA_DMS_REGEX.test(maDms);
};

/**
 * Validate interest rate is within bounds
 * @param {number|string} rate - Interest rate (0-100)
 * @returns {boolean} true if rate is between 0 and 100 inclusive
 */
export const isValidInterestRate = (rate) => {
  const num = typeof rate === 'string' ? parseFloat(rate) : rate;
  if (isNaN(num)) return false;
  return num >= 0 && num <= 100;
};

/**
 * Check if currency amount is within safe integer bounds
 * @param {number|string} amount - Currency amount in VND
 * @returns {boolean} true if amount is safe integer and non-negative
 */
export const isSafeCurrency = (amount) => {
  const num = typeof amount === 'string'
    ? parseInt(amount.replace(/\D/g, ''), 10)
    : amount;
  if (isNaN(num)) return false;
  return num >= 0 && Number.isSafeInteger(num);
};

/**
 * Normalize Vietnamese text for comparison
 * Handles Unicode normalization (NFC) and lowercase
 * @param {string} str - String to normalize
 * @returns {string} Normalized lowercase string
 */
export const normalizeVietnamese = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.normalize('NFC').toLowerCase().trim();
};

/**
 * Validate required fields in an object
 * @param {Object} data - Data object to validate
 * @param {Array<string>} fields - Array of required field names
 * @returns {{ valid: boolean, missing: string[] }} Validation result with missing fields
 */
export const validateRequiredFields = (data, fields) => {
  if (!data || typeof data !== 'object') {
    return { valid: false, missing: fields };
  }

  const missing = fields.filter(field => {
    const value = data[field];
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    return false;
  });

  return {
    valid: missing.length === 0,
    missing
  };
};

/**
 * Validate contract data has all required fields for print
 * @param {Object} contract - Contract data object
 * @returns {{ valid: boolean, missing: string[] }} Validation result
 */
export const validateContractForPrint = (contract) => {
  const requiredFields = [
    'tenKh',      // Customer name
    'cccd',       // Citizen ID
    'soDienThoai', // Phone
    'diaChi',     // Address
    'dongXe',     // Vehicle model
    'ngoaiThat'   // Exterior color
  ];
  return validateRequiredFields(contract, requiredFields);
};

/**
 * Validate discount doesn't exceed price
 * @param {number} discount - Total discount amount
 * @param {number} price - Base price
 * @returns {number} Clamped discount (0 to price)
 */
export const clampDiscount = (discount, price) => {
  const d = typeof discount === 'number' ? discount : 0;
  const p = typeof price === 'number' ? price : 0;
  return Math.max(0, Math.min(d, p));
};

/**
 * Parse currency string to safe number
 * @param {string|number} value - Currency value
 * @returns {number} Parsed number or 0 if invalid
 */
export const parseCurrency = (value) => {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  }
  if (typeof value === 'string') {
    const num = parseInt(value.replace(/\D/g, ''), 10);
    return !isNaN(num) && num >= 0 ? num : 0;
  }
  return 0;
};

// ============================================
// EXPORTS
// ============================================

export default {
  isValidCCCD,
  isValidPhone,
  normalizePhoneToVn,
  VN_PHONE_PREFIX,
  isValidVSO,
  isValidMaDms,
  isValidInterestRate,
  isSafeCurrency,
  normalizeVietnamese,
  validateRequiredFields,
  validateContractForPrint,
  clampDiscount,
  parseCurrency,
  // Regex patterns for external use
  CCCD_REGEX,
  VN_PHONE_REGEX,
  VSO_REGEX,
  MA_DMS_REGEX,
};
