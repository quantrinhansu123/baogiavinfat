import { createContext, useContext, useMemo } from 'react';
import { useCarPriceDataFirebase } from '../hooks/useCarPriceDataFirebase';

const CarPriceDataContext = createContext(null);

export function CarPriceDataProvider({ children }) {
  const { data, loading, error, isFromFirebase } = useCarPriceDataFirebase();
  const value = useMemo(
    () => ({ carPriceData: data, loading, error, isFromFirebase }),
    [data, loading, error, isFromFirebase]
  );
  return (
    <CarPriceDataContext.Provider value={value}>
      {children}
    </CarPriceDataContext.Provider>
  );
}

export function useCarPriceData() {
  const ctx = useContext(CarPriceDataContext);
  if (!ctx) {
    // Fallback khi dùng ngoài Provider: dùng static từ calculatorData
    const { carPriceData } = require('../data/calculatorData');
    return { carPriceData, loading: false, error: null, isFromFirebase: false };
  }
  return ctx;
}
