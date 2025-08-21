import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Globe2, X, Home, Gift, Settings, LayoutDashboard, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { useAuthStore } from '@/lib/store/auth-store';
import { useCurrencyStore } from '@/lib/store/currency-store';
import { useLanguageStore } from '@/lib/store/language-store';
import { ExpandableSearchBar } from '@/components/search/expandable-search-bar';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { SUPPORTED_CURRENCIES, getCurrencySymbol, getCurrencyName } from '@/lib/constants/currency';
import { LanguageMenuItems, CurrencyMenuItems } from './menu-items';
import '@/styles/navbar.css';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { selectedCurrency, setSelectedCurrency } = useCurrencyStore();
  const { selectedLanguage, languages, setLanguage } = useLanguageStore();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isMobileLanguageOpen, setIsMobileLanguageOpen] = useState(false);
  const [isMobileCurrencyOpen, setIsMobileCurrencyOpen] = useState(false);

  // Shared search state
  const [searchLocation, setSearchLocation] = useState("");
  const [searchCheckIn, setSearchCheckIn] = useState<Date | null>(null);
  const [searchCheckOut, setSearchCheckOut] = useState<Date | null>(null);
  const [searchGuests, setSearchGuests] = useState(1);

  const menuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const navbarRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close all menus
  const closeAllMenus = () => {
    setIsProfileMenuOpen(false);
    setIsLanguageMenuOpen(false);
    setIsCurrencyMenuOpen(false);
  };

  // Close mobile menu
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle menu toggles with coordination
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
    setIsLanguageMenuOpen(false);
    setIsCurrencyMenuOpen(false);
  };

  const toggleLanguageMenu = () => {
    setIsLanguageMenuOpen(!isLanguageMenuOpen);
    setIsProfileMenuOpen(false);
    setIsCurrencyMenuOpen(false);
  };

  const toggleCurrencyMenu = () => {
    setIsCurrencyMenuOpen(!isCurrencyMenuOpen);
    setIsProfileMenuOpen(false);
    setIsLanguageMenuOpen(false);
  };

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    } else if (e.key === 'Escape') {
      closeAllMenus();
    }
  };

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = window.innerHeight * 0.1; // 10vh threshold
      setIsSearchCollapsed(currentScrollY > scrollThreshold);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideProfile = menuRef.current && !menuRef.current.contains(event.target as Node);
      const isOutsideLanguage = languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node);
      const isOutsideCurrency = currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node);
      const isOutsideMobileMenu = mobileMenuRef.current && 
        !mobileMenuRef.current.contains(event.target as Node) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(event.target as Node);

      if (isOutsideProfile && isOutsideLanguage && isOutsideCurrency) {
        closeAllMenus();
      }

      if (isMobileMenuOpen && isOutsideMobileMenu) {
        closeMobileMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    // fetchExchangeRates();
  }, []);

  // Handle search state updates
  const handleSearchStateUpdate = (state: {
    location?: string;
    checkIn?: Date | null;
    checkOut?: Date | null;
    guests?: number;
  }) => {
    if ('location' in state) setSearchLocation(state.location!);
    if ('checkIn' in state) setSearchCheckIn(state.checkIn);
    if ('checkOut' in state) setSearchCheckOut(state.checkOut);
    if ('guests' in state) setSearchGuests(state.guests!);
  };

  const handleSearch = (query: {
    location: string;
    checkIn: Date | null;
    checkOut: Date | null;
    guests: number;
  }) => {
    navigate('/properties', {
      state: { searchParams: query },
    });
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
    setIsProfileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleMobileNavigation = (path: string) => {
    navigate(path);
    closeMobileMenu();
  };

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 bg-white",
        "transition-all duration-300 ease-in-out",
        "shadow-sm",
        "flex flex-col",
        "z-30",
        isSearchCollapsed && "is-scrolled"
      )}
    >
      {/* Main Navbar */}
      <nav className="relative border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Layout */}
          <div className="hidden md:flex justify-between items-center h-16">
            {/* Left side - Logo and Search */}
            <div className="flex items-center gap-x-4 flex-1">
              <Link 
                to="/"
                className="flex-shrink-0"
              >
                <Logo variant={isSearchCollapsed ? 'small' : 'default'} />
              </Link>
              
              <div className={cn(
                "search-bar-wrapper transition-all duration-300 ease-in-out",
                "flex-grow max-w-3xl",
                isSearchCollapsed ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
              )}>
                <ExpandableSearchBar
                  onSearch={handleSearch}
                  onStateUpdate={handleSearchStateUpdate}
                  initialState={{
                    location: searchLocation,
                    checkIn: searchCheckIn,
                    checkOut: searchCheckOut,
                    guests: searchGuests,
                  }}
                  isCollapsed={isSearchCollapsed}
                  className="w-full"
                />
              </div>
            </div>

            {/* Right side - Navigation Items */}
            <div className="flex items-center space-x-4">
              {/* Language and Currency Icons */}
              <div className="flex items-center space-x-2">
                <div className="relative" ref={languageMenuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    onClick={toggleLanguageMenu}
                    onKeyDown={(e) => handleKeyDown(e, toggleLanguageMenu)}
                    aria-expanded={isLanguageMenuOpen}
                    aria-haspopup="true"
                    aria-label="Select language"
                  >
                    <Globe2 className="h-5 w-5" />
                    <span className="sr-only">Current language: {languages.find(l => l.code === selectedLanguage)?.name}</span>
                  </Button>
                  {isLanguageMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-40 max-h-[300px] overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                      role="menu"
                      aria-orientation="vertical"
                      aria-label="Language selection menu"
                    >
                      <LanguageMenuItems
                        languages={languages}
                        selectedLanguage={selectedLanguage}
                        onSelect={setLanguage}
                        onKeyDown={handleKeyDown}
                        closeMenu={() => setIsLanguageMenuOpen(false)}
                      />
                    </div>
                  )}
                </div>

                <div className="relative" ref={currencyMenuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    onClick={toggleCurrencyMenu}
                    onKeyDown={(e) => handleKeyDown(e, toggleCurrencyMenu)}
                    aria-expanded={isCurrencyMenuOpen}
                    aria-haspopup="true"
                    aria-label="Select currency"
                  >
                    <span className="text-lg font-medium">{getCurrencySymbol(selectedCurrency)}</span>
                    <span className="sr-only">Current currency: {selectedCurrency}</span>
                  </Button>
                  {isCurrencyMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-40 max-h-[300px] overflow-y-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                      role="menu"
                      aria-orientation="vertical"
                      aria-label="Currency selection menu"
                    >
                      <CurrencyMenuItems
                        currencies={SUPPORTED_CURRENCIES}
                        selectedCurrency={selectedCurrency}
                        onSelect={setSelectedCurrency}
                        onKeyDown={handleKeyDown}
                        closeMenu={() => setIsCurrencyMenuOpen(false)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Notification Center in expanded view */}
              {isAuthenticated && (
                <div className={cn(
                  "flex items-center",
                  isSearchCollapsed ? "hidden" : "flex" // Show only in expanded view
                )}>
                  <NotificationCenter />
                </div>
              )}

              {/* User Menu */}
              <div className="relative" ref={menuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2 hover:bg-gray-50 relative z-50"
                  onClick={toggleProfileMenu}
                  onKeyDown={(e) => handleKeyDown(e, toggleProfileMenu)}
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="true"
                >
                  <User className="h-5 w-5" />
                  {isAuthenticated && user && (
                    <span className="hidden sm:inline-block">{user.name}</span>
                  )}
                </Button>

                {isProfileMenuOpen && (
                  <div 
                    className={cn(
                      "absolute right-0 mt-2 w-56 rounded-md bg-white py-1",
                      "shadow-lg ring-1 ring-black ring-opacity-5",
                      "transform opacity-100 scale-100",
                      "transition-all duration-200",
                      "z-50"
                    )}
                  >
                    {isAuthenticated && user ? (
                      <>
                        <button
                          onClick={() => handleNavigation('/profile')}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User className="mr-3 h-4 w-4" />
                          Profile & Rewards
                        </button>

                        <button
                          onClick={() => handleNavigation('/bookings')}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Home className="mr-3 h-4 w-4" />
                          My Bookings
                        </button>

                        {user.role === 'admin' && (
                          <button
                            onClick={() => handleNavigation('/admin/dashboard')}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Settings className="mr-3 h-4 w-4" />
                            Admin Dashboard
                          </button>
                        )}

                        {user.role === 'host' && (
                          <>
                            <button
                              onClick={() => handleNavigation('/host/dashboard')}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <LayoutDashboard className="mr-3 h-4 w-4" />
                              Host Dashboard
                            </button>
                            <button
                              onClick={() => handleNavigation('/host/properties')}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Home className="mr-3 h-4 w-4" />
                              My Properties
                            </button>
                          </>
                        )}

                        <div className="my-1 border-t border-gray-100" />

                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleNavigation('/auth?type=login')}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LogOut className="mr-3 h-4 w-4 rotate-180" />
                          Sign In
                        </button>
                        <button
                          onClick={() => handleNavigation('/auth?type=register')}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User className="mr-3 h-4 w-4" />
                          Sign Up
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden">
            {/* Top row - Logo and Menu */}
            <div className="flex items-center justify-between h-16">
              <Link 
                to="/"
                className="flex-shrink-0"
              >
                <Logo variant="small" />
              </Link>

              <div className="flex items-center space-x-4">
                <NotificationCenter />
                <button
                  ref={mobileMenuButtonRef}
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                  onClick={toggleMobileMenu}
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu"
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Expanded Search Bar for Desktop */}
      <div className={cn(
        "hidden md:block transition-all duration-300 ease-in-out",
        "overflow-hidden",
        isSearchCollapsed 
          ? "max-h-0 opacity-0" 
          : "max-h-[6rem] opacity-100"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ExpandableSearchBar
            onSearch={handleSearch}
            onStateUpdate={handleSearchStateUpdate}
            initialState={{
              location: searchLocation,
              checkIn: searchCheckIn,
              checkOut: searchCheckOut,
              guests: searchGuests,
            }}
            isCollapsed={false}
            className="w-full max-w-3xl mx-auto"
          />
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      <div
        className={cn(
          "mobile-menu-backdrop md:hidden",
          isMobileMenuOpen ? "visible" : ""
        )}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Mobile Menu */}
      <div
        ref={mobileMenuRef}
        id="mobile-menu"
        className={cn(
          "md:hidden fixed inset-x-0 top-[64px] bg-white",
          "transition-all duration-300 ease-in-out transform",
          "max-h-[calc(100vh-64px)] overflow-y-auto", 
          isMobileMenuOpen
            ? "translate-y-0 opacity-100 visible"
            : "-translate-y-full opacity-0 invisible",
          "z-50 shadow-lg"
        )}
      >
        {/* Search Bar in Mobile Menu */}
        <div className="sticky top-0 px-4 py-3 border-b border-gray-200 bg-white z-10">
          <ExpandableSearchBar
            onSearch={handleSearch}
            onStateUpdate={handleSearchStateUpdate}
            initialState={{
              location: searchLocation,
              checkIn: searchCheckIn,
              checkOut: searchCheckOut,
              guests: searchGuests,
            }}
            isCollapsed={true}
            className="w-full"
          />
        </div>

        {/* Menu Items Container */}
        <div className="flex flex-col divide-y divide-gray-200">
          {/* Navigation Links */}
          <div className="px-4 py-3">
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => handleMobileNavigation('/')}
                className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
              >
                <Home className="h-5 w-5 mr-3" />
                Home
              </button>
              
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => handleMobileNavigation('/bookings')}
                    className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    <LayoutDashboard className="h-5 w-5 mr-3" />
                    My Bookings
                  </button>
                  <button
                    onClick={() => handleMobileNavigation('/profile')}
                    className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    <User className="h-5 w-5 mr-3" />
                    Profile & Rewards
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Language and Currency */}
          <div className="px-4 py-3">
            <div className="flex flex-col space-y-2">
              {/* Language Dropdown */}
              <div>
                <button
                  onClick={() => setIsMobileLanguageOpen(!isMobileLanguageOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <Globe2 className="h-5 w-5 mr-3" />
                    Language
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2 flex items-center">
                      <span className="mr-2">{languages.find(l => l.code === selectedLanguage)?.flag}</span>
                      {languages.find(l => l.code === selectedLanguage)?.name}
                    </span>
                    <ChevronDown 
                      className={cn(
                        "h-4 w-4 text-gray-500 transition-transform",
                        isMobileLanguageOpen && "transform rotate-180"
                      )} 
                    />
                  </div>
                </button>
                {isMobileLanguageOpen && (
                  <div className="mt-1 py-1 bg-gray-50 rounded-md">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsMobileLanguageOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-10 py-2 text-sm flex items-center",
                          selectedLanguage === lang.code
                            ? "text-primary bg-primary/10 font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <span className="inline-block w-8 text-base">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Currency Dropdown */}
              <div>
                <button
                  onClick={() => setIsMobileCurrencyOpen(!isMobileCurrencyOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <span className="h-5 w-5 mr-3 flex items-center justify-center text-lg">
                      {getCurrencySymbol(selectedCurrency)}
                    </span>
                    Currency
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">{selectedCurrency}</span>
                    <ChevronDown 
                      className={cn(
                        "h-4 w-4 text-gray-500 transition-transform",
                        isMobileCurrencyOpen && "transform rotate-180"
                      )} 
                    />
                  </div>
                </button>
                {isMobileCurrencyOpen && (
                  <div className="mt-1 py-1 bg-gray-50 rounded-md">
                    {SUPPORTED_CURRENCIES.map((currency) => (
                      <button
                        key={currency}
                        onClick={() => {
                          setSelectedCurrency(currency);
                          setIsMobileCurrencyOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-10 py-2 text-sm",
                          selectedCurrency === currency
                            ? "text-primary bg-primary/10 font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <span className="inline-block w-8">{getCurrencySymbol(currency)}</span>
                        <span>{getCurrencyName(currency)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Auth Section */}
          <div className="px-4 py-3">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 rounded-md text-red-600 hover:bg-gray-50"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Sign Out
              </button>
            ) : (
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => handleMobileNavigation('/auth?type=login')}
                  className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className="h-5 w-5 mr-3 rotate-180" />
                  Sign In
                </button>
                <button
                  onClick={() => handleMobileNavigation('/auth?type=register')}
                  className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <User className="h-5 w-5 mr-3" />
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}