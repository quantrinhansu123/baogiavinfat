import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateVSO, previewNextVSO, isFullVSOFormat, extractMaDmsFromVSO } from './vsoGenerator';

// Mock Firebase
vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mockRef'),
  get: vi.fn(),
  set: vi.fn(),
  runTransaction: vi.fn()
}));

vi.mock('../firebase/config', () => ({
  database: {}
}));

describe('vsoGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-20'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateVSO', () => {
    it('generates VSO with correct format when transaction succeeds', async () => {
      const { runTransaction } = await import('firebase/database');
      runTransaction.mockResolvedValue({
        committed: true,
        snapshot: { val: () => 1 }
      });

      const vso = await generateVSO('S00901');
      expect(vso).toBe('S00901-VSO-25-01-0001');
    });

    it('pads sequence to 4 digits', async () => {
      const { runTransaction } = await import('firebase/database');
      runTransaction.mockResolvedValue({
        committed: true,
        snapshot: { val: () => 35 }
      });

      const vso = await generateVSO('S00901');
      expect(vso).toBe('S00901-VSO-25-01-0035');
    });

    it('handles high sequence numbers', async () => {
      const { runTransaction } = await import('firebase/database');
      runTransaction.mockResolvedValue({
        committed: true,
        snapshot: { val: () => 9999 }
      });

      const vso = await generateVSO('S00901');
      expect(vso).toBe('S00901-VSO-25-01-9999');
    });

    it('uses fallback when transaction fails', async () => {
      const { runTransaction } = await import('firebase/database');
      runTransaction.mockRejectedValue(new Error('Transaction failed'));

      const vso = await generateVSO('S00901');
      // Should still return valid format with fallback sequence
      expect(vso).toMatch(/^S00901-VSO-25-01-\d{4}$/);
    });

    it('throws error when maDms is missing', async () => {
      await expect(generateVSO('')).rejects.toThrow('maDms is required');
      await expect(generateVSO(null)).rejects.toThrow('maDms is required');
      await expect(generateVSO(undefined)).rejects.toThrow('maDms is required');
    });

    it('throws error when maDms format is invalid', async () => {
      await expect(generateVSO('INVALID')).rejects.toThrow('Invalid maDms format');
      await expect(generateVSO('S001')).rejects.toThrow('Invalid maDms format');
      await expect(generateVSO('A00901')).rejects.toThrow('Invalid maDms format');
    });

    it('uses different showroom codes correctly', async () => {
      const { runTransaction } = await import('firebase/database');
      runTransaction.mockResolvedValue({
        committed: true,
        snapshot: { val: () => 5 }
      });

      const vso1 = await generateVSO('S00501');
      expect(vso1).toBe('S00501-VSO-25-01-0005');

      const vso2 = await generateVSO('S41501');
      expect(vso2).toBe('S41501-VSO-25-01-0005');
    });
  });

  describe('previewNextVSO', () => {
    it('returns preview of next VSO number', async () => {
      const { get } = await import('firebase/database');
      get.mockResolvedValue({
        exists: () => true,
        val: () => 10
      });

      const preview = await previewNextVSO('S00901');
      expect(preview).toBe('S00901-VSO-25-01-0011');
    });

    it('returns 0001 when counter does not exist', async () => {
      const { get } = await import('firebase/database');
      get.mockResolvedValue({
        exists: () => false,
        val: () => null
      });

      const preview = await previewNextVSO('S00901');
      expect(preview).toBe('S00901-VSO-25-01-0001');
    });

    it('returns empty string when maDms is empty', async () => {
      const preview = await previewNextVSO('');
      expect(preview).toBe('');
    });

    it('returns placeholder when get fails', async () => {
      const { get } = await import('firebase/database');
      get.mockRejectedValue(new Error('Network error'));

      const preview = await previewNextVSO('S00901');
      expect(preview).toBe('S00901-VSO-25-01-????');
    });
  });

  describe('isFullVSOFormat', () => {
    it('returns true for valid VSO format', () => {
      expect(isFullVSOFormat('S00901-VSO-25-01-0035')).toBe(true);
      expect(isFullVSOFormat('S00501-VSO-24-12-0001')).toBe(true);
      expect(isFullVSOFormat('S41501-VSO-25-06-9999')).toBe(true);
    });

    it('returns false for invalid VSO format', () => {
      expect(isFullVSOFormat('S00901-VSO-25-01-035')).toBe(false); // 3 digits
      expect(isFullVSOFormat('S00901-VSO-2025-01-0035')).toBe(false); // 4 digit year
      expect(isFullVSOFormat('00901-VSO-25-01-0035')).toBe(false); // missing S
      expect(isFullVSOFormat('S00901-25-01-0035')).toBe(false); // missing VSO
      expect(isFullVSOFormat('')).toBe(false);
      expect(isFullVSOFormat(null)).toBe(false);
    });
  });

  describe('extractMaDmsFromVSO', () => {
    it('extracts maDms from valid VSO', () => {
      expect(extractMaDmsFromVSO('S00901-VSO-25-01-0035')).toBe('S00901');
      expect(extractMaDmsFromVSO('S00501-VSO-24-12-0001')).toBe('S00501');
      expect(extractMaDmsFromVSO('S41501-VSO-25-06-9999')).toBe('S41501');
    });

    it('returns null for invalid input', () => {
      expect(extractMaDmsFromVSO('')).toBeNull();
      expect(extractMaDmsFromVSO(null)).toBeNull();
      expect(extractMaDmsFromVSO('INVALID')).toBeNull();
      expect(extractMaDmsFromVSO('00901-VSO-25-01-0035')).toBeNull();
    });
  });
});
