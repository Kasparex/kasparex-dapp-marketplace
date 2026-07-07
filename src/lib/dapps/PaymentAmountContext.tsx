'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type DependencyList,
  type ReactNode,
} from 'react';

export type DAppWidgetQuote = {
  paymentAmount: number | null;
  actionId: string | null;
};

type PaymentAmountContextValue = DAppWidgetQuote & {
  setPaymentAmount: (amount: number | null) => void;
  setWidgetQuote: (quote: Partial<DAppWidgetQuote>) => void;
  clearWidgetQuote: () => void;
};

const PaymentAmountContext = createContext<PaymentAmountContextValue | null>(null);

const EMPTY_QUOTE: DAppWidgetQuote = { paymentAmount: null, actionId: null };

export function PaymentAmountProvider({ children }: { children: ReactNode }) {
  const [paymentAmount, setPaymentAmountState] = useState<number | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const setPaymentAmount = useCallback((amount: number | null) => {
    setPaymentAmountState(amount);
  }, []);

  const setWidgetQuote = useCallback((quote: Partial<DAppWidgetQuote>) => {
    if (quote.paymentAmount !== undefined) setPaymentAmountState(quote.paymentAmount);
    if (quote.actionId !== undefined) setActionId(quote.actionId);
  }, []);

  const clearWidgetQuote = useCallback(() => {
    setPaymentAmountState(null);
    setActionId(null);
  }, []);

  return (
    <PaymentAmountContext.Provider
      value={{ paymentAmount, actionId, setPaymentAmount, setWidgetQuote, clearWidgetQuote }}
    >
      {children}
    </PaymentAmountContext.Provider>
  );
}

export function usePaymentAmount() {
  const ctx = useContext(PaymentAmountContext);
  return (
    ctx ?? {
      ...EMPTY_QUOTE,
      setPaymentAmount: () => {},
      setWidgetQuote: () => {},
      clearWidgetQuote: () => {},
    }
  );
}

/** Keep the calculation breakdown in sync with widget form inputs. */
export function useSyncDAppWidgetQuote(
  amount: number | null | undefined,
  actionId: string | null,
  deps: DependencyList = [],
) {
  const { setWidgetQuote, clearWidgetQuote } = usePaymentAmount();

  useEffect(() => {
    const parsed = amount != null && !Number.isNaN(amount) && amount > 0 ? amount : null;
    setWidgetQuote({ paymentAmount: parsed, actionId });
  }, [amount, actionId, setWidgetQuote, ...deps]);

  useEffect(() => () => clearWidgetQuote(), [clearWidgetQuote]);
}
