'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

const PaymentAmountContext = createContext<{
  paymentAmount: number | null;
  setPaymentAmount: (amount: number | null) => void;
} | null>(null);

export function PaymentAmountProvider({ children }: { children: ReactNode }) {
  const [paymentAmount, setPaymentAmountState] = useState<number | null>(null);
  const setPaymentAmount = useCallback((amount: number | null) => {
    setPaymentAmountState(amount);
  }, []);
  return (
    <PaymentAmountContext.Provider value={{ paymentAmount, setPaymentAmount }}>
      {children}
    </PaymentAmountContext.Provider>
  );
}

export function usePaymentAmount() {
  const ctx = useContext(PaymentAmountContext);
  return ctx ?? { paymentAmount: null, setPaymentAmount: () => {} };
}
