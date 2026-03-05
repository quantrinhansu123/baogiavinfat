import { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import {
  carPriceData as staticCarPriceData,
  uniqueNgoaiThatColors as staticExteriorColors,
  uniqueNoiThatColors as staticInteriorColors,
} from '../data/calculatorData';

const PATHS = {
  carPrice: 'calculatorConfig/carPriceData',
  exterior: 'calculatorConfig/exteriorColors',
  interior: 'calculatorConfig/interiorColors',
};

function parsePriceVnd(val) {
  if (val == null || val === '') return 0;
  if (typeof val === 'number' && !Number.isNaN(val)) return Math.max(0, val);
  const num = String(val).replace(/\D/g, '');
  return num ? Math.max(0, parseInt(num, 10)) : 0;
}

function useFirebaseList(path, fallback) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dbRef = ref(database, path);
    const unsub = onValue(
      dbRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          const list = Object.entries(val).map(([id, row]) => {
            const item = { ...row, id };
            if (path.includes('carPriceData') && item.price_vnd != null) {
              item.price_vnd = parsePriceVnd(item.price_vnd);
            }
            return item;
          });
          setData(list);
        } else {
          setData([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('useCalculatorConfigFirebase error:', path, err);
        setData([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [path]);

  const result = useMemo(() => {
    if (loading) return fallback;
    if (data && data.length > 0) return data;
    return fallback;
  }, [loading, data, fallback]);

  const fromFirebase = !loading && data && data.length > 0;
  return { data: result, fromFirebase };
}

/**
 * Hook: đọc toàn bộ cấu hình báo giá từ Firebase (bảng giá xe + màu ngoại thất + màu nội thất).
 * Dùng cho trang báo giá để ảnh/link khớp với trang quản trị.
 */
export function useCalculatorConfigFirebase() {
  const carPriceRes = useFirebaseList(PATHS.carPrice, staticCarPriceData);
  const exteriorRes = useFirebaseList(PATHS.exterior, staticExteriorColors);
  const interiorRes = useFirebaseList(PATHS.interior, staticInteriorColors);

  return {
    carPriceData: carPriceRes.data,
    exteriorColors: exteriorRes.data,
    interiorColors: interiorRes.data,
    loading: false,
    isFromFirebase: {
      carPrice: carPriceRes.fromFirebase,
      exterior: exteriorRes.fromFirebase,
      interior: interiorRes.fromFirebase,
    },
  };
}

export { PATHS };
