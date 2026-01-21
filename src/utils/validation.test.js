/**
 * Unit tests for validation utilities
 */
import { describe, it, expect } from 'vitest';
import {
  isValidCCCD,
  isValidPhone,
  isValidVSO,
  isValidMaDms,
  isValidInterestRate,
  isSafeCurrency,
  normalizeVietnamese,
  validateRequiredFields,
  validateContractForPrint,
  clampDiscount,
  parseCurrency,
} from './validation';

describe('isValidCCCD', () => {
  it('accepts valid 12-digit CCCD', () => {
    expect(isValidCCCD('012345678901')).toBe(true);
    expect(isValidCCCD('079123456789')).toBe(true);
  });

  it('rejects invalid CCCD', () => {
    expect(isValidCCCD('12345')).toBe(false); // too short
    expect(isValidCCCD('1234567890123')).toBe(false); // too long
    expect(isValidCCCD('01234567890a')).toBe(false); // contains letter
    expect(isValidCCCD('')).toBe(false);
    expect(isValidCCCD(null)).toBe(false);
  });

  it('handles whitespace', () => {
    expect(isValidCCCD('012 345 678 901')).toBe(true);
  });
});

describe('isValidPhone', () => {
  it('accepts valid VN phone formats', () => {
    expect(isValidPhone('0912345678')).toBe(true);
    expect(isValidPhone('0356789012')).toBe(true);
    expect(isValidPhone('+84912345678')).toBe(true);
  });

  it('rejects invalid phones', () => {
    expect(isValidPhone('091234567')).toBe(false); // too short
    expect(isValidPhone('0112345678')).toBe(false); // invalid prefix
    expect(isValidPhone('12345678901')).toBe(false); // no leading 0
    expect(isValidPhone('')).toBe(false);
  });

  it('handles formatting characters', () => {
    expect(isValidPhone('091-234-5678')).toBe(true);
    expect(isValidPhone('091.234.5678')).toBe(true);
  });
});

describe('isValidVSO', () => {
  it('accepts valid VSO format', () => {
    expect(isValidVSO('S00901-VSO-25-12-0035')).toBe(true);
    expect(isValidVSO('S00501-VSO-26-01-0001')).toBe(true);
  });

  it('rejects invalid VSO', () => {
    expect(isValidVSO('S0901-VSO-25-12-0035')).toBe(false); // wrong digits
    expect(isValidVSO('S00901-VSO-25-12-035')).toBe(false); // sequence too short
    expect(isValidVSO('VSO-25-12-0035')).toBe(false); // missing prefix
    expect(isValidVSO('')).toBe(false);
  });
});

describe('isValidMaDms', () => {
  it('accepts valid maDms', () => {
    expect(isValidMaDms('S00501')).toBe(true);
    expect(isValidMaDms('S00901')).toBe(true);
    expect(isValidMaDms('S41501')).toBe(true);
  });

  it('rejects invalid maDms', () => {
    expect(isValidMaDms('S0501')).toBe(false); // too short
    expect(isValidMaDms('00901')).toBe(false); // missing S
    expect(isValidMaDms('S009011')).toBe(false); // too long
    expect(isValidMaDms('')).toBe(false);
  });
});

describe('isValidInterestRate', () => {
  it('accepts valid rates', () => {
    expect(isValidInterestRate(0)).toBe(true);
    expect(isValidInterestRate(50)).toBe(true);
    expect(isValidInterestRate(100)).toBe(true);
    expect(isValidInterestRate('7.5')).toBe(true);
  });

  it('rejects invalid rates', () => {
    expect(isValidInterestRate(-1)).toBe(false);
    expect(isValidInterestRate(101)).toBe(false);
    expect(isValidInterestRate('abc')).toBe(false);
  });
});

describe('isSafeCurrency', () => {
  it('accepts safe amounts', () => {
    expect(isSafeCurrency(0)).toBe(true);
    expect(isSafeCurrency(1000000000)).toBe(true);
    expect(isSafeCurrency('500,000,000')).toBe(true);
  });

  it('rejects unsafe amounts', () => {
    expect(isSafeCurrency(-1000)).toBe(false);
    expect(isSafeCurrency(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
    expect(isSafeCurrency('abc')).toBe(false);
  });
});

describe('normalizeVietnamese', () => {
  it('normalizes Vietnamese text', () => {
    expect(normalizeVietnamese('Âu Cơ')).toBe('âu cơ');
    expect(normalizeVietnamese('TRƯỜNG CHINH')).toBe('trường chinh');
    expect(normalizeVietnamese('  Thủ Đức  ')).toBe('thủ đức');
  });

  it('handles null/undefined', () => {
    expect(normalizeVietnamese(null)).toBe('');
    expect(normalizeVietnamese(undefined)).toBe('');
  });
});

describe('validateRequiredFields', () => {
  it('validates all fields present', () => {
    const data = { name: 'Test', phone: '0912345678' };
    const result = validateRequiredFields(data, ['name', 'phone']);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('detects missing fields', () => {
    const data = { name: 'Test' };
    const result = validateRequiredFields(data, ['name', 'phone', 'email']);
    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(['phone', 'email']);
  });

  it('treats empty strings as missing', () => {
    const data = { name: '', phone: '0912345678' };
    const result = validateRequiredFields(data, ['name', 'phone']);
    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(['name']);
  });
});

describe('validateContractForPrint', () => {
  it('validates complete contract', () => {
    const contract = {
      tenKh: 'Nguyễn Văn A',
      cccd: '012345678901',
      soDienThoai: '0912345678',
      diaChi: 'TP.HCM',
      dongXe: 'VF 5',
      ngoaiThat: 'Trắng',
    };
    const result = validateContractForPrint(contract);
    expect(result.valid).toBe(true);
  });

  it('detects incomplete contract', () => {
    const contract = { tenKh: 'Test' };
    const result = validateContractForPrint(contract);
    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });
});

describe('clampDiscount', () => {
  it('clamps discount to price', () => {
    expect(clampDiscount(50000000, 100000000)).toBe(50000000);
    expect(clampDiscount(150000000, 100000000)).toBe(100000000);
    expect(clampDiscount(-10000, 100000000)).toBe(0);
  });
});

describe('parseCurrency', () => {
  it('parses currency strings', () => {
    expect(parseCurrency('500,000,000')).toBe(500000000);
    expect(parseCurrency('1.234.567')).toBe(1234567);
    expect(parseCurrency(1000000)).toBe(1000000);
  });

  it('handles invalid input', () => {
    expect(parseCurrency('abc')).toBe(0);
    expect(parseCurrency(-1000)).toBe(0);
    expect(parseCurrency(null)).toBe(0);
  });
});

// Additional edge case tests
describe('validateContractForPrint - edge cases', () => {
  it('handles whitespace-only values as missing', () => {
    const contract = {
      tenKh: '   ',
      cccd: '012345678901',
      soDienThoai: '\t\n',
      diaChi: '123 ABC',
      dongXe: 'VF 7',
      ngoaiThat: 'Đỏ'
    };
    const result = validateContractForPrint(contract);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('tenKh');
    expect(result.missing).toContain('soDienThoai');
  });

  it('handles null/undefined object fields', () => {
    const contract = {
      tenKh: 'Nguyen Van A',
      cccd: null,
      soDienThoai: undefined,
      diaChi: '123 ABC',
      dongXe: 'VF 7',
      ngoaiThat: ''
    };
    const result = validateContractForPrint(contract);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('cccd');
    expect(result.missing).toContain('soDienThoai');
    expect(result.missing).toContain('ngoaiThat');
  });

  it('passes with all valid fields', () => {
    const contract = {
      tenKh: 'Nguyễn Văn A',
      cccd: '079123456789',
      soDienThoai: '0912345678',
      diaChi: '123 ABC Street, TP.HCM',
      dongXe: 'VF 7',
      ngoaiThat: 'Trắng Ngọc Trai'
    };
    const result = validateContractForPrint(contract);
    expect(result.valid).toBe(true);
    expect(result.missing).toHaveLength(0);
  });
});

describe('isValidCCCD - additional edge cases', () => {
  it('handles leading zeros correctly', () => {
    expect(isValidCCCD('001234567890')).toBe(true);
    expect(isValidCCCD('000000000000')).toBe(true);
  });

  it('handles mixed whitespace', () => {
    expect(isValidCCCD('012 345\t678 901')).toBe(true);
  });
});

describe('isValidPhone - additional edge cases', () => {
  it('accepts all valid prefixes', () => {
    // Test various valid prefixes
    expect(isValidPhone('0312345678')).toBe(true); // 03x
    expect(isValidPhone('0512345678')).toBe(true); // 05x
    expect(isValidPhone('0712345678')).toBe(true); // 07x
    expect(isValidPhone('0812345678')).toBe(true); // 08x
    expect(isValidPhone('0912345678')).toBe(true); // 09x
  });

  it('rejects invalid prefixes', () => {
    expect(isValidPhone('0012345678')).toBe(false);
    expect(isValidPhone('0112345678')).toBe(false);
    expect(isValidPhone('0212345678')).toBe(false);
    expect(isValidPhone('0412345678')).toBe(false);
    expect(isValidPhone('0612345678')).toBe(false);
  });
});
