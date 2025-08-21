import React from 'react';
import { cn } from '@/lib/utils';
import { SupportedCurrency, getCurrencySymbol, getCurrencyName } from '@/lib/constants/currency';
import { Language } from '@/lib/store/language-store';
import { Check } from "lucide-react";

interface MenuItemProps {
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  children: React.ReactNode;
  className?: string;
  isSelected?: boolean;
  role?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  onClick,
  onKeyDown,
  children,
  className,
  isSelected,
  role = 'menuitem'
}) => (
  <button
    onClick={onClick}
    onKeyDown={onKeyDown}
    className={cn(
      "flex items-center w-full px-4 py-2 text-sm",
      isSelected ? "bg-primary/10 text-primary font-medium" : "text-gray-700 hover:bg-gray-50",
      className
    )}
    role={role}
    aria-selected={isSelected}
  >
    {children}
  </button>
);

interface MenuItemsProps {
  onKeyDown: (e: React.KeyboardEvent, action: () => void) => void;
  closeMenu: () => void;
}

interface LanguageMenuItemsProps extends MenuItemsProps {
  languages: Language[];
  selectedLanguage: string;
  onSelect: (language: string) => void;
}

interface CurrencyMenuItemsProps extends MenuItemsProps {
  currencies: readonly SupportedCurrency[];
  selectedCurrency: SupportedCurrency;
  onSelect: (currency: SupportedCurrency) => void;
}

export function LanguageMenuItems({
  languages,
  selectedLanguage,
  onSelect,
  onKeyDown,
  closeMenu,
}: LanguageMenuItemsProps) {
  return (
    <div className="py-1" role="none">
      {languages.map((language) => (
        <button
          key={language.code}
          className={cn(
            "flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors",
            selectedLanguage === language.code ? "bg-gray-50 font-medium" : ""
          )}
          role="menuitem"
          onClick={() => {
            onSelect(language.code);
            closeMenu();
          }}
          onKeyDown={onKeyDown}
        >
          <span className="mr-2">{language.flag}</span>
          <span className="flex-grow text-left">{language.name}</span>
          {selectedLanguage === language.code && (
            <Check className="h-4 w-4 text-blue-500 ml-2" />
          )}
        </button>
      ))}
    </div>
  );
}

export function CurrencyMenuItems({
  currencies,
  selectedCurrency,
  onSelect,
  onKeyDown,
  closeMenu,
}: CurrencyMenuItemsProps) {
  return (
    <div className="py-1" role="none">
      {currencies.map((currency) => (
        <button
          key={currency}
          className={cn(
            "flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors",
            selectedCurrency === currency ? "bg-gray-50 font-medium" : ""
          )}
          role="menuitem"
          onClick={() => {
            onSelect(currency);
            closeMenu();
          }}
          onKeyDown={onKeyDown}
        >
          <span className="w-8 text-left">{getCurrencySymbol(currency)}</span>
          <span className="flex-grow text-left">{getCurrencyName(currency)}</span>
          {selectedCurrency === currency && (
            <Check className="h-4 w-4 text-blue-500 ml-2" />
          )}
        </button>
      ))}
    </div>
  );
}
