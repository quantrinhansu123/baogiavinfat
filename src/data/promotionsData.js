// Promotions data management
// This file exports a function to get promotions from Firebase
// and can be used by components that need the promotions list

import { ref, get, set } from 'firebase/database';
import { database } from '../firebase/config';

/**
 * Tạo bảng promotions nếu chưa có: ghi danh sách ưu đãi mặc định lên Firebase.
 * Gọi khi load về rỗng để luôn có dữ liệu khởi tạo.
 */
const seedDefaultPromotionsToFirebase = async () => {
  try {
    const promotionsRef = ref(database, 'promotions');
    for (const promo of defaultPromotions) {
      const itemRef = ref(database, `promotions/${promo.id}`);
      await set(itemRef, {
        name: promo.name,
        type: promo.type,
        value: promo.value ?? 0,
        maxDiscount: promo.maxDiscount ?? 0,
        minPurchase: promo.minPurchase ?? 0,
        dongXe: promo.dongXe ?? [],
        createdAt: promo.createdAt || new Date().toISOString(),
        createdBy: promo.createdBy || 'system',
      });
    }
    return true;
  } catch (err) {
    console.error('Error seeding default promotions to Firebase:', err);
    return false;
  }
};

/**
 * Load promotions from Firebase. Nếu chưa có dữ liệu (bảng trống) thì tự động tạo và ghi ưu đãi mặc định lên database, rồi trả về danh sách đó.
 * @returns {Promise<Array>} Array of promotions with structure: { id, name, createdAt, createdBy, dongXe, ... }
 */
export const loadPromotionsFromFirebase = async () => {
  try {
    const promotionsRef = ref(database, "promotions");
    const snapshot = await get(promotionsRef);
    const data = snapshot.exists() ? snapshot.val() : {};
    const promotionsList = Object.entries(data || {}).map(([key, value]) => ({
      id: key,
      ...value,
    })).sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });

    if (promotionsList.length === 0) {
      const seeded = await seedDefaultPromotionsToFirebase();
      if (seeded) {
        const snapshot2 = await get(promotionsRef);
        const data2 = snapshot2.exists() ? snapshot2.val() : {};
        return Object.entries(data2 || {}).map(([key, value]) => ({
          id: key,
          ...value,
        })).sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        });
      }
    }

    return promotionsList;
  } catch (err) {
    console.error("Error loading promotions from Firebase:", err);
    return [];
  }
};

/**
 * Get promotion names as a simple array (for backward compatibility)
 * @returns {Promise<Array<string>>} Array of promotion names
 */
export const getPromotionNames = async () => {
  const promotions = await loadPromotionsFromFirebase();
  return promotions.map(p => p.name || '').filter(Boolean);
};

/**
 * Default/hardcoded promotions (fallback if Firebase is empty)
 * These are used as initial values or fallback
 * Now includes dongXe field to specify which car models the promotion applies to
 */
export const defaultPromotions = [
  // VF 3 promotions
  {
    id: 'promo_vf3_1',
    name: 'Giảm trực tiếp 5.000.000 VNĐ cho VF 3',
    type: 'fixed',
    value: 5000000,
    maxDiscount: 0,
    minPurchase: 0,
    dongXe: ['vf_3'], // Chỉ áp dụng cho VF 3
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  },
  {
    id: 'promo_vf3_2',
    name: 'Miễn phí sạc tới 30/06/2027 - VF 3',
    type: 'display',
    value: 0,
    maxDiscount: 0,
    minPurchase: 0,
    dongXe: ['vf_3'],
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  },
  // VF 5 promotions
  {
    id: 'promo_vf5_1',
    name: 'Giảm trực tiếp 10.000.000 VNĐ cho VF 5',
    type: 'fixed',
    value: 10000000,
    maxDiscount: 0,
    minPurchase: 0,
    dongXe: ['vf_5'],
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  },
  {
    id: 'promo_vf5_2',
    name: 'Giảm thêm 3% tối đa 15.000.000 VNĐ - VF 5',
    type: 'percentage',
    value: 3,
    maxDiscount: 15000000,
    minPurchase: 0,
    dongXe: ['vf_5'],
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  },
  // VF 6 promotions
  {
    id: 'promo_vf6_1',
    name: 'Giảm trực tiếp 15.000.000 VNĐ cho VF 6',
    type: 'fixed',
    value: 15000000,
    maxDiscount: 0,
    minPurchase: 0,
    dongXe: ['vf_6'],
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  },
  {
    id: 'promo_vf6_2',
    name: 'Ưu đãi bảo hiểm VF 6',
    type: 'display',
    value: 0,
    maxDiscount: 0,
    minPurchase: 0,
    dongXe: ['vf_6'],
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  },
  // VF 7 promotions
  {
    id: 'promo_vf7_1',
    name: 'Thu cũ đổi mới xe xăng VinFast: 50.000.000 vnđ - VF 7',
    type: 'fixed',
    value: 50000000,
    maxDiscount: 0,
    minPurchase: 0,
    dongXe: ['vf_7'],
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  },
  {
    id: 'promo_vf7_2',
    name: 'Giảm thêm 5% tối đa 30.000.000 VNĐ - VF 7',
    type: 'percentage',
    value: 5,
    maxDiscount: 30000000,
    minPurchase: 0,
    dongXe: ['vf_7'],
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  },
  // VF 8 promotions
  {
    id: 'promo_vf8_1',
    name: 'Ưu đãi đặc biệt VF 8 - 70.000.000 VNĐ',
    type: 'fixed',
    value: 70000000,
    maxDiscount: 0,
    minPurchase: 0,
    dongXe: ['vf_8'],
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  },
  // VF 9 promotions
  {
    id: 'promo_vf9_1',
    name: 'Ưu đãi cao cấp VF 9 - 100.000.000 VNĐ',
    type: 'fixed',
    value: 100000000,
    maxDiscount: 0,
    minPurchase: 0,
    dongXe: ['vf_9'],
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  },
  // Multi-model promotions (áp dụng cho nhiều dòng xe)
  {
    id: 'promo_multi_1',
    name: 'Ưu đãi Lái xe Xanh (VN3) - Tất cả dòng xe',
    type: 'fixed',
    value: 1000000,
    maxDiscount: 0,
    minPurchase: 0,
    dongXe: ['vf_3', 'vf_5', 'vf_6', 'vf_7', 'vf_8', 'vf_9'], // Áp dụng cho nhiều dòng xe
    createdAt: new Date().toISOString(),
    createdBy: 'system'
  }
];

/** Chuẩn hóa dongXe từ Firebase (có thể là mảng hoặc object { "0": "vf_3", "1": "test" }) */
export const normalizeDongXe = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'object' && val !== null) return Object.values(val).filter(Boolean);
  return [];
};

/**
 * Filter promotions by car model (dongXe)
 * Bao gồm cả ưu đãi "áp dụng tất cả" (chưa gán dòng xe) — dùng cho tính báo giá.
 * @param {Array} promotions - Array of promotions
 * @param {string} selectedDongXe - Selected car model code (e.g., 'vf_3', 'vf_5', 'test')
 * @returns {Array} Filtered promotions for the selected car model
 */
export const filterPromotionsByDongXe = (promotions, selectedDongXe) => {
  if (!selectedDongXe || !Array.isArray(promotions)) {
    return promotions || [];
  }

  return promotions.filter(promotion => {
    const list = normalizeDongXe(promotion.dongXe);
    if (list.length === 0) return true; // Không gán dòng xe = áp dụng tất cả
    return list.includes(selectedDongXe);
  });
};

/**
 * Kiểm tra ưu đãi có áp dụng cho dòng xe đang chọn hay không.
 * Trả về true khi: (1) chưa chọn dòng xe, hoặc (2) ưu đãi không gán dòng xe (áp dụng tất cả), hoặc (3) ưu đãi có dòng xe chứa selectedDongXe.
 * Nhờ đó ưu đãi mới thêm (áp dụng tất cả) vẫn hiện khi đã chọn dòng xe (vd. VF 6).
 * @param {Object} promotion - Một promotion
 * @param {string} selectedDongXe - Mã dòng xe đang chọn (vd: 'vf_6', 'vf_3')
 * @returns {boolean}
 */
export const isPromotionAssignedToDongXe = (promotion, selectedDongXe) => {
  if (!selectedDongXe) return true; // Chưa chọn dòng xe: hiện tất cả
  const list = normalizeDongXe(promotion.dongXe);
  if (list.length === 0) return true; // Áp dụng tất cả dòng xe → luôn hiện
  return list.includes(selectedDongXe);
};

