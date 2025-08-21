export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'INR', 
  'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 
  'NZD', 'SEK', 'KRW', 'SGD', 'NOK',
  'MXN', 'BRL', 'ZAR', 'RUB', 'TRY'
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  USD: '$',    // US Dollar
  EUR: '€',    // Euro
  GBP: '£',    // British Pound
  JPY: '¥',    // Japanese Yen
  INR: '₹',    // Indian Rupee
  AUD: 'A$',   // Australian Dollar
  CAD: 'C$',   // Canadian Dollar
  CHF: 'Fr',   // Swiss Franc
  CNY: '¥',    // Chinese Yuan
  HKD: 'HK$',  // Hong Kong Dollar
  NZD: 'NZ$',  // New Zealand Dollar
  SEK: 'kr',   // Swedish Krona
  KRW: '₩',    // South Korean Won
  SGD: 'S$',   // Singapore Dollar
  NOK: 'kr',   // Norwegian Krone
  MXN: '$',    // Mexican Peso
  BRL: 'R$',   // Brazilian Real
  ZAR: 'R',    // South African Rand
  RUB: '₽',    // Russian Ruble
  TRY: '₺'     // Turkish Lira
};

export const CURRENCY_NAMES: Record<SupportedCurrency, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  INR: 'Indian Rupee',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan',
  HKD: 'Hong Kong Dollar',
  NZD: 'New Zealand Dollar',
  SEK: 'Swedish Krona',
  KRW: 'South Korean Won',
  SGD: 'Singapore Dollar',
  NOK: 'Norwegian Krone',
  MXN: 'Mexican Peso',
  BRL: 'Brazilian Real',
  ZAR: 'South African Rand',
  RUB: 'Russian Ruble',
  TRY: 'Turkish Lira'
};

export const getCurrencySymbol = (currency: SupportedCurrency) => CURRENCY_SYMBOLS[currency] || '';

export const getCurrencyName = (currency: SupportedCurrency) => CURRENCY_NAMES[currency] || currency;
