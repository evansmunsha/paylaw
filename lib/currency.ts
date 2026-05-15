export type Currency = 'ZMW' | 'USD' | 'EUR' | 'GBP' | 'ZAR' | 'NGN' | 'KES'

export const CURRENCIES: {
  code: Currency
  symbol: string
  name: string
  flag: string
}[] = [
  { code: 'ZMW', symbol: 'K',  name: 'Zambian Kwacha',   flag: '🇿🇲' },
  { code: 'USD', symbol: '$',  name: 'US Dollar',         flag: '🇺🇸' },
  { code: 'EUR', symbol: '€',  name: 'Euro',              flag: '🇪🇺' },
  { code: 'GBP', symbol: '£',  name: 'British Pound',     flag: '🇬🇧' },
  { code: 'ZAR', symbol: 'R',  name: 'South African Rand',flag: '🇿🇦' },
  { code: 'NGN', symbol: '₦',  name: 'Nigerian Naira',    flag: '🇳🇬' },
  { code: 'KES', symbol: 'KSh',name: 'Kenyan Shilling',   flag: '🇰🇪' },
]

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol || code
}

export function formatMoney(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency)
  return `${symbol} ${amount.toLocaleString()}`
}