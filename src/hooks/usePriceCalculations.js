import { useMemo } from 'react';
import {
  phi_duong_bo,
  phi_cap_bien_so,
  phi_kiem_dinh,
  uu_dai_vin_club,
  ho_tro_doi_xe,
  quy_doi_2_nam_bhvc,
  thong_tin_ky_thuat_xe,
  uniqueNgoaiThatColors,
  getDataByKey,
} from '../data/calculatorData';
import { clampDiscount } from '../utils/validation';

// Default insurance values for fallback
const DEFAULT_INSURANCE = {
  phi_tnds_ca_nhan: 500000,
  phi_tnds_kinh_doanh: 800000,
};

const locationMap = {
  hcm: "ho_chi_minh",
  hanoi: "ha_noi",
  danang: "da_nang",
  cantho: "can_tho",
  haiphong: "hai_phong",
  other: "tinh_khac",
};

const enhancedExteriorColors = uniqueNgoaiThatColors;

/**
 * Custom hook for all price calculations
 * @param {Object} params - Calculation parameters
 */
export function usePriceCalculations({
  getCarPrice,
  selectedDongXe,
  exteriorColor,
  discount2,
  discount3,
  discountBhvc2,
  discountPremiumColor,
  convertCheckbox,
  vinClubVoucher,
  hoTroLaiSuat,
  registrationLocation,
  customerType,
  businessType,
  registrationFee,
  bodyInsuranceFee,
  isBodyInsuranceManual,
  liabilityInsuranceValue,
  isLiabilityInsuranceManual,
  plateFeeValue,
  isPlateFeeManual,
  inspectionFeeValue,
  isInspectionFeeManual,
  roadFeeValue,
  isRoadFeeManual,
  calculatePromotionDiscounts,
}) {
  const calculations = useMemo(() => {
    const rawBasePrice = getCarPrice();
    const basePrice = (typeof rawBasePrice === 'number' && Number.isFinite(rawBasePrice) && rawBasePrice >= 0)
      ? rawBasePrice
      : 0;

    // Discounts
    const discount2Potential = discount2 ? 50000000 : 0;
    const discount3Potential = discount3 ? Math.round(basePrice * 0.04) : 0;

    // BHVC 2-year
    let bhvc2Potential = 0;
    if (selectedDongXe) {
      const entry = quy_doi_2_nam_bhvc.find(e => e.dong_xe === selectedDongXe);
      if (entry?.gia_tri) bhvc2Potential = Number(entry.gia_tri) || 0;
    }
    const bhvc2 = discountBhvc2 ? bhvc2Potential : 0;

    // Premium color
    let premiumColorPotential = 0;
    if (selectedDongXe) {
      const exteriorColorObj = enhancedExteriorColors.find(c => c.code === exteriorColor);
      const exteriorText = exteriorColorObj?.name || '';

      if (selectedDongXe === 'vf_3') {
        if (/Vàng Nóc Trắng|Xanh Lá Nhạt|Hồng Nóc Trắng|Xanh Nóc Trắng/i.test(exteriorText)) {
          premiumColorPotential = 8000000;
        }
      } else if (selectedDongXe === 'vf_5') {
        if (/Vàng Nóc Trắng|Xanh Lá Nhạt|Xanh Nóc Trắng/i.test(exteriorText)) {
          premiumColorPotential = 12000000;
        }
      }
    }
    const premiumColor = discountPremiumColor ? premiumColorPotential : 0;

    // Convert support
    let convertSupportDiscount = 0;
    if (convertCheckbox && selectedDongXe) {
      const supportEntry = ho_tro_doi_xe.find(h => h.dong_xe === selectedDongXe);
      if (supportEntry?.gia_tri) convertSupportDiscount = Number(supportEntry.gia_tri) || 0;
    }

    // Legacy discounts
    const legacyPromotionDiscount = discount2Potential + discount3Potential;

    // Calculate promotion discounts
    let promotionDiscounts = 0;
    try {
      const result = calculatePromotionDiscounts(basePrice);
      promotionDiscounts = (typeof result === 'number' && Number.isFinite(result)) ? result : 0;
    } catch {
      promotionDiscounts = 0;
    }

    // Total promotion discounts
    const rawTotalDiscount = (promotionDiscounts || 0) + (legacyPromotionDiscount || 0);
    const totalPromotionDiscounts = clampDiscount(rawTotalDiscount, basePrice);

    const priceAfterBasicPromotions = Math.max(0, basePrice - totalPromotionDiscounts);

    // VinClub discount
    let vinClubDiscount = 0;
    if (vinClubVoucher !== 'none' && !hoTroLaiSuat) {
      const vinClubData = getDataByKey(uu_dai_vin_club, 'hang', vinClubVoucher);
      if (vinClubData) {
        vinClubDiscount = Math.round(priceAfterBasicPromotions * vinClubData.ty_le);
      }
    }

    // Giá XHD
    const giaXuatHoaDon = Math.max(0, priceAfterBasicPromotions - vinClubDiscount);

    // Amount before VinClub (for compatibility)
    const amountBeforeVinClub = Math.max(0, priceAfterBasicPromotions - convertSupportDiscount - bhvc2 - premiumColor);

    // Final payable
    const finalPayable = Math.max(0, giaXuatHoaDon - convertSupportDiscount);
    const totalDiscount = totalPromotionDiscounts + (vinClubDiscount || 0) + (convertSupportDiscount || 0);
    const priceAfterDiscount = Math.max(0, basePrice - totalDiscount);

    // On-road costs
    const locationKey = locationMap[registrationLocation] || 'tinh_khac';
    const plateFeeData = getDataByKey(phi_cap_bien_so, 'khu_vuc', locationKey);
    const plateFeeAuto = plateFeeData ? plateFeeData.gia_tri : getDataByKey(phi_cap_bien_so, 'khu_vuc', 'tinh_khac').gia_tri;
    const plateFee = isPlateFeeManual ? plateFeeValue : plateFeeAuto;

    const roadFeeData = getDataByKey(phi_duong_bo, 'loai', customerType);
    const roadFeeAuto = roadFeeData ? roadFeeData.gia_tri : getDataByKey(phi_duong_bo, 'loai', 'ca_nhan').gia_tri;
    const roadFee = isRoadFeeManual ? roadFeeValue : roadFeeAuto;

    const carInfo = getDataByKey(thong_tin_ky_thuat_xe, 'dong_xe', selectedDongXe);
    const fallbackCarInfo = getDataByKey(thong_tin_ky_thuat_xe, 'dong_xe', 'vf_7') || DEFAULT_INSURANCE;
    const liabilityInsuranceAuto = carInfo
      ? (businessType === 'khong_kinh_doanh' ? carInfo.phi_tnds_ca_nhan : carInfo.phi_tnds_kinh_doanh)
      : (fallbackCarInfo.phi_tnds_ca_nhan ?? DEFAULT_INSURANCE.phi_tnds_ca_nhan);
    const liabilityInsurance = isLiabilityInsuranceManual ? liabilityInsuranceValue : liabilityInsuranceAuto;

    const inspectionFeeAuto = phi_kiem_dinh;
    const inspectionFee = isInspectionFeeManual ? inspectionFeeValue : inspectionFeeAuto;

    // BHVC bao gồm Pin = Giá XHD × 1,45%
    const bhvcRate = 0.0145;
    const bodyInsurance = isBodyInsuranceManual ? bodyInsuranceFee : Math.round(giaXuatHoaDon * bhvcRate);
    const registrationFeeValue = Number(registrationFee) || 0;

    const totalOnRoadCost = plateFee + roadFee + liabilityInsurance + inspectionFee + bodyInsurance + registrationFeeValue;
    const totalCost = finalPayable + totalOnRoadCost;

    return {
      basePrice,
      discount2Potential,
      discount3Potential,
      promotionDiscounts: totalPromotionDiscounts,
      promotionDiscountTotal: totalPromotionDiscounts,
      priceAfterBasicPromotions,
      convertSupportDiscount,
      bhvc2,
      bhvc2Potential,
      premiumColor,
      premiumColorPotential,
      vinClubDiscount,
      amountBeforeVinClub,
      giaXuatHoaDon,
      finalPayable,
      totalDiscount,
      priceAfterDiscount,
      plateFee,
      plateFeeData,
      plateFeeAuto,
      roadFee,
      roadFeeAuto,
      liabilityInsurance,
      liabilityInsuranceAuto,
      inspectionFee,
      inspectionFeeAuto,
      bodyInsurance,
      registrationFee: registrationFeeValue,
      totalOnRoadCost,
      totalCost,
    };
  }, [
    getCarPrice,
    selectedDongXe,
    exteriorColor,
    discount2,
    discount3,
    discountBhvc2,
    discountPremiumColor,
    convertCheckbox,
    vinClubVoucher,
    hoTroLaiSuat,
    registrationLocation,
    customerType,
    businessType,
    registrationFee,
    bodyInsuranceFee,
    isBodyInsuranceManual,
    liabilityInsuranceValue,
    isLiabilityInsuranceManual,
    plateFeeValue,
    isPlateFeeManual,
    inspectionFeeValue,
    isInspectionFeeManual,
    roadFeeValue,
    isRoadFeeManual,
    calculatePromotionDiscounts,
  ]);

  return calculations;
}
