import { useState, useMemo } from 'react';
import { isValidInterestRate } from '../utils/validation';
import { lai_suat_vay_hang_nam } from '../data/calculatorData';

/**
 * Custom hook for loan calculations
 * @param {number} totalCost - Total vehicle cost after discounts and on-road costs
 * @param {number} giaXuatHoaDon - Invoice price for calculating matching payment
 * @returns {Object} Loan state and calculations
 */
export function useLoanCalculations(totalCost = 0, giaXuatHoaDon = 0) {
  const [loanToggle, setLoanToggle] = useState(true);
  const [loanRatio, setLoanRatio] = useState(70);
  const [loanTerm, setLoanTerm] = useState(60);
  const [customInterestRate, setCustomInterestRate] = useState('');

  const loanData = useMemo(() => {
    const safeTotalCost = (typeof totalCost === 'number' && Number.isFinite(totalCost) && totalCost >= 0) ? totalCost : 0;
    const safeGiaXuatHoaDon = (typeof giaXuatHoaDon === 'number' && Number.isFinite(giaXuatHoaDon) && giaXuatHoaDon >= 0) ? giaXuatHoaDon : 0;

    if (!loanToggle || safeTotalCost <= 0) {
      return {
        downPayment: 0,
        loanAmount: 0,
        totalInterest: 0,
        monthlyPayment: 0,
        tienVayTuGiaXHD: 0,
        soTienThanhToanDoiUng: safeTotalCost,
      };
    }

    const loanRatioDecimal = loanRatio / 100;
    let annualRate = lai_suat_vay_hang_nam;
    if (customInterestRate && isValidInterestRate(customInterestRate)) {
      annualRate = Number(customInterestRate) / 100;
    }
    const monthlyRate = annualRate / 12;

    // Calculate loan amount based on total cost
    const loanAmount = Math.round(safeTotalCost * loanRatioDecimal);
    const downPayment = safeTotalCost - loanAmount;

    // Calculate monthly payment using annuity formula
    let monthlyPayment = 0;
    if (monthlyRate > 0 && loanTerm > 0) {
      const numerator = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTerm));
      const denominator = Math.pow(1 + monthlyRate, loanTerm) - 1;
      monthlyPayment = numerator / denominator;
    } else if (loanTerm > 0) {
      monthlyPayment = loanAmount / loanTerm;
    }

    // Calculate total payment and interest
    const totalPayment = monthlyPayment * loanTerm;
    const totalInterest = totalPayment - loanAmount;

    // Số tiền thanh toán đối ứng = TỔNG CHI PHÍ - Tiền vay ngân hàng (Tiền vay tính theo % Giá XHD)
    const tienVayTuGiaXHD = Math.round(safeGiaXuatHoaDon * loanRatioDecimal);
    const soTienThanhToanDoiUng = Math.max(0, safeTotalCost - tienVayTuGiaXHD);

    return {
      downPayment: Math.round(downPayment),
      loanAmount,
      totalInterest: Math.round(totalInterest),
      monthlyPayment: Math.round(monthlyPayment),
      tienVayTuGiaXHD,
      soTienThanhToanDoiUng,
    };
  }, [totalCost, giaXuatHoaDon, loanToggle, loanRatio, loanTerm, customInterestRate]);

  return {
    // State
    loanToggle,
    setLoanToggle,
    loanRatio,
    setLoanRatio,
    loanTerm,
    setLoanTerm,
    customInterestRate,
    setCustomInterestRate,
    // Calculated data
    loanData,
  };
}
