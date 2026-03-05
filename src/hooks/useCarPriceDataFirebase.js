import { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { carPriceData as staticCarPriceData } from '../data/calculatorData';

const FIREBASE_PATH = 'calculatorConfig/carPriceData';

/**
 * Hook: đọc bảng giá xe từ Firebase. Nếu Firebase có dữ liệu thì dùng, không thì fallback sang static.
 * @returns {{ data: Array, loading: boolean, error: Error|null, isFromFirebase: boolean }}
 */
export function useCarPriceDataFirebase() {
  const [firebaseData, setFirebaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const dbRef = ref(database, FIREBASE_PATH);
    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          const arr = Object.entries(val).map(([id, row]) => ({ ...row, id }));
          setFirebaseData(arr);
        } else {
          setFirebaseData([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('useCarPriceDataFirebase error:', err);
        setError(err);
        setFirebaseData([]);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const data = useMemo(() => {
    if (loading) return staticCarPriceData;
    if (firebaseData && firebaseData.length > 0) return firebaseData;
    return staticCarPriceData;
  }, [loading, firebaseData]);

  const isFromFirebase = Boolean(firebaseData && firebaseData.length > 0);

  return { data, loading, error, isFromFirebase, firebaseData: firebaseData || [] };
}

export { FIREBASE_PATH };
