import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'AUD' | 'CAD';

interface CurrencyState {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  exchangeRates: Record<Currency, number>;
  setExchangeRates: (rates: Record<Currency, number>) => void;
  convertPrice: (amount: number, from: Currency, to: Currency) => number;
  formatPrice: (amount: number, currency?: Currency) => string;
  fetchExchangeRates: () => Promise<void>;
}

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
};

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      selectedCurrency: 'USD',
      exchangeRates: {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        INR: 83.28,
        JPY: 148.42,
        AUD: 1.54,
        CAD: 1.36,
      },
      setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),
      setExchangeRates: (rates) => set({ exchangeRates: rates }),
      convertPrice: (amount, from, to) => {
        const { exchangeRates } = get();
        const fromRate = exchangeRates[from];
        const toRate = exchangeRates[to];
        return (amount / fromRate) * toRate;
      },
      formatPrice: (amount, currency) => {
        const { selectedCurrency, convertPrice } = get();
        const targetCurrency = currency || selectedCurrency;
        const convertedAmount = convertPrice(amount, 'USD', targetCurrency);
        
        const formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: targetCurrency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });
        
        return formatter.format(convertedAmount);
      },
      fetchExchangeRates: async () => {
        try {
          // For now, we'll use static rates. In production, you would fetch from an API
          const rates: Record<Currency, number> = {
            USD: 1,
            EUR: 0.85,
            GBP: 0.73,
            INR: 83.28,
            JPY: 148.42,
            AUD: 1.54,
            CAD: 1.36,
          };
          set({ exchangeRates: rates });
        } catch (error) {
          console.error('Failed to fetch exchange rates:', error);
        }
      },
    }),
    {
      name: 'currency-storage',
    }
  )
);