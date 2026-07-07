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
import type { HubQuoteDisplay } from '@/lib/payments/hubQuote';

export type DAppWidgetQuote = {
  paymentAmount: number | null;
  actionId: string | null;
  hubQuote: HubQuoteDisplay | null;
};

type PaymentAmountContextValue = DAppWidgetQuote & {
  setPaymentAmount: (amount: number | null) => void;
  setWidgetQuote: (quote: Partial<DAppWidgetQuote>) => void;
  setHubQuote: (quote: HubQuoteDisplay | null) => void;
  clearWidgetQuote: () => void;
};

const PaymentAmountContext = createContext<PaymentAmountContextValue | null>(null);

const EMPTY_QUOTE: DAppWidgetQuote = { paymentAmount: null, actionId: null, hubQuote: null };

export function PaymentAmountProvider({ children }: { children: ReactNode }) {
  const [paymentAmount, setPaymentAmountState] = useState<number | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [hubQuote, setHubQuoteState] = useState<HubQuoteDisplay | null>(null);

  const setPaymentAmount = useCallback((amount: number | null) => {
    setPaymentAmountState(amount);
  }, []);

  const setWidgetQuote = useCallback((quote: Partial<DAppWidgetQuote>) => {
    if (quote.paymentAmount !== undefined) setPaymentAmountState(quote.paymentAmount);
    if (quote.actionId !== undefined) setActionId(quote.actionId);
    if (quote.hubQuote !== undefined) setHubQuoteState(quote.hubQuote);
  }, []);

  const setHubQuote = useCallback((quote: HubQuoteDisplay | null) => {
    setHubQuoteState(quote);
  }, []);

  const clearWidgetQuote = useCallback(() => {
    setPaymentAmountState(null);
    setActionId(null);
    setHubQuoteState(null);
  }, []);

  return (
    <PaymentAmountContext.Provider
      value={{
        paymentAmount,
        actionId,
        hubQuote,
        setPaymentAmount,
        setWidgetQuote,
        setHubQuote,
        clearWidgetQuote,
      }}
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
      setHubQuote: () => {},
      clearWidgetQuote: () => {},
    }
  );
}

export function useSyncDAppWidgetQuote(
  amount: number | null | undefined,
  actionId: string | null,
  deps: DependencyList = [],
) {
  const { setWidgetQuote, clearWidgetQuote } = usePaymentAmount();

  useEffect(() => {
    const parsed = amount != null && !Number.isNaN(amount) && amount > 0 ? amount : null;
    setWidgetQuote({ paymentAmount: parsed, actionId, hubQuote: null });
  }, [amount, actionId, setWidgetQuote, ...deps]);

  useEffect(() => () => clearWidgetQuote(), [clearWidgetQuote]);
}

export function useSyncHubQuote(quote: HubQuoteDisplay | null, deps: DependencyList = []) {
  const { setHubQuote, clearWidgetQuote } = usePaymentAmount();

  useEffect(() => {
    setHubQuote(quote);
    return () => clearWidgetQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote, setHubQuote, clearWidgetQuote, ...deps]);
}
