import { createContext, useContext, useMemo } from 'react';
import { useCalculatorConfigFirebase } from '../hooks/useCalculatorConfigFirebase';

const CarPriceDataContext = createContext(null);

export function CarPriceDataProvider({ children }) {
  const { carPriceData, exteriorColors, interiorColors, loading, isFromFirebase } = useCalculatorConfigFirebase();
  const value = useMemo(
    () => ({
      carPriceData,
      exteriorColors,
      interiorColors,
      loading,
      error: null,
      isFromFirebase,
    }),
    [carPriceData, exteriorColors, interiorColors, loading, isFromFirebase]
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
    const { carPriceData, uniqueNgoaiThatColors, uniqueNoiThatColors } = require('../data/calculatorData');
    return {
      carPriceData,
      exteriorColors: uniqueNgoaiThatColors,
      interiorColors: uniqueNoiThatColors,
      loading: false,
      error: null,
      isFromFirebase: false,
    };
  }
  return ctx;
}
