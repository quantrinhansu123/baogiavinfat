import { describe, it, expect } from 'vitest';
import { vndToWords } from './vndToWords';

describe('vndToWords', () => {
  describe('basic numbers', () => {
    it('converts zero', () => {
      // Note: returns lowercase "không đồng" for zero
      expect(vndToWords(0)).toBe('không đồng');
    });

    it('converts single digits', () => {
      expect(vndToWords(1)).toBe('Một đồng');
      expect(vndToWords(5)).toBe('Năm đồng');
      expect(vndToWords(9)).toBe('Chín đồng');
    });

    it('converts teens (10-19)', () => {
      expect(vndToWords(10)).toBe('Mười đồng');
      expect(vndToWords(11)).toBe('Mười một đồng');
      expect(vndToWords(15)).toBe('Mười lăm đồng');
      expect(vndToWords(19)).toBe('Mười chín đồng');
    });

    it('converts tens with special cases', () => {
      expect(vndToWords(21)).toBe('Hai mươi mốt đồng');
      expect(vndToWords(25)).toBe('Hai mươi lăm đồng');
      expect(vndToWords(50)).toBe('Năm mươi đồng');
    });

    it('converts hundreds with "lẻ"', () => {
      expect(vndToWords(100)).toBe('Một trăm đồng');
      expect(vndToWords(105)).toBe('Một trăm lẻ năm đồng');
      expect(vndToWords(110)).toBe('Một trăm mười đồng');
      expect(vndToWords(115)).toBe('Một trăm mười lăm đồng');
      expect(vndToWords(500)).toBe('Năm trăm đồng');
    });
  });

  describe('thousands', () => {
    it('converts thousands', () => {
      expect(vndToWords(1000)).toBe('Một nghìn đồng');
      expect(vndToWords(5000)).toBe('Năm nghìn đồng');
      expect(vndToWords(10000)).toBe('Mười nghìn đồng');
      expect(vndToWords(50000)).toBe('Năm mươi nghìn đồng');
    });

    it('converts complex thousands', () => {
      expect(vndToWords(1500)).toBe('Một nghìn năm trăm đồng');
      expect(vndToWords(12345)).toContain('nghìn');
    });
  });

  describe('millions', () => {
    it('converts millions', () => {
      expect(vndToWords(1000000)).toBe('Một triệu đồng');
      expect(vndToWords(5000000)).toBe('Năm triệu đồng');
      expect(vndToWords(50000000)).toBe('Năm mươi triệu đồng');
    });

    it('converts hundreds of millions (car prices)', () => {
      const result = vndToWords(850000000);
      expect(result).toContain('trăm');
      expect(result).toContain('triệu');
      expect(result).toBe('Tám trăm năm mươi triệu đồng');
    });

    it('converts complex millions', () => {
      const result = vndToWords(1234567);
      expect(result).toContain('triệu');
      expect(result).toContain('nghìn');
    });
  });

  describe('billions', () => {
    it('converts billions', () => {
      expect(vndToWords(1000000000)).toBe('Một tỷ đồng');
      expect(vndToWords(2000000000)).toBe('Hai tỷ đồng');
    });

    it('converts complex billions', () => {
      const result = vndToWords(2500000000);
      expect(result).toContain('tỷ');
      expect(result).toContain('triệu');
    });
  });

  describe('string input', () => {
    it('handles string numbers', () => {
      expect(vndToWords('850000000')).toBe('Tám trăm năm mươi triệu đồng');
      expect(vndToWords('1000000')).toBe('Một triệu đồng');
    });

    it('handles formatted string with separators', () => {
      expect(vndToWords('1.000.000')).toBe('Một triệu đồng');
      expect(vndToWords('850,000,000')).toBe('Tám trăm năm mươi triệu đồng');
    });

    it('handles string with currency suffix', () => {
      expect(vndToWords('1.000.000 VNĐ')).toBe('Một triệu đồng');
    });
  });

  describe('edge cases', () => {
    it('handles negative numbers', () => {
      // Negative numbers result in "Đồng" (empty groups + suffix)
      expect(vndToWords(-100)).toBe('Đồng');
    });

    it('handles invalid input', () => {
      // Invalid inputs return lowercase "không đồng"
      expect(vndToWords(null)).toBe('không đồng');
      expect(vndToWords(undefined)).toBe('không đồng');
      expect(vndToWords('abc')).toBe('không đồng');
      expect(vndToWords('')).toBe('không đồng');
    });

    it('handles decimal numbers by flooring', () => {
      expect(vndToWords(100.99)).toBe('Một trăm đồng');
    });
  });

  describe('real car prices', () => {
    // Common VinFast car prices
    it('formats VF 3 price', () => {
      const result = vndToWords(315000000);
      expect(result.toLowerCase()).toContain('triệu');
    });

    it('formats VF 5 price', () => {
      const result = vndToWords(468000000);
      expect(result.toLowerCase()).toContain('triệu');
    });

    it('formats VF 7 price', () => {
      const result = vndToWords(850000000);
      expect(result).toBe('Tám trăm năm mươi triệu đồng');
    });

    it('formats VF 9 price', () => {
      const result = vndToWords(1559000000);
      expect(result.toLowerCase()).toContain('tỷ');
    });
  });
});
