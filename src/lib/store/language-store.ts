import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = {
  code: string;
  name: string;
  flag: string;
};

type Translations = {
  [key: string]: {
    [key: string]: string;
  };
};

type LanguageState = {
  selectedLanguage: string;
  languages: Language[];
  translations: Translations;
  setLanguage: (language: string) => void;
  translate: (key: string) => string;
};

// Mock translations
const translations: Translations = {
  en: {
    'nav.roversSuites': 'Rovers Suites',
    'nav.home': 'Home',
    'nav.becomeHost': 'Become a Host',
    'nav.signIn': 'Sign in',
    'nav.manageProperties': 'Manage Properties',
    'nav.adminDashboard': 'Admin Dashboard',
    'nav.hostDashboard': 'Host Dashboard',
    'nav.myBookings': 'My Bookings',
    'nav.search': 'Search for places...',
    'nav.logout': 'Logout',
    'nav.currency': 'Currency',
    'USD': 'USD',
    'EUR': 'EUR',
    'GBP': 'GBP',
    'INR': 'INR',
    'JPY': 'JPY',
    'AUD': 'AUD',
    'CAD': 'CAD',
  },
  es: {
    'nav.roversSuites': 'Rovers Suites',
    'nav.home': 'Inicio',
    'nav.becomeHost': 'Conviértete en Anfitrión',
    'nav.signIn': 'Iniciar Sesión',
    'nav.manageProperties': 'Administrar Propiedades',
    'nav.adminDashboard': 'Panel de Administrador',
    'nav.hostDashboard': 'Panel de Anfitrión',
    'nav.myBookings': 'Mis Reservas',
    'nav.search': 'Buscar lugares...',
    'nav.logout': 'Cerrar Sesión',
    'nav.currency': 'Moneda',
    'USD': 'Dólar estadounidense',
    'EUR': 'Euro',
    'GBP': 'Libra esterlina',
    'INR': 'Rupia india',
    'JPY': 'Yen japonés',
    'AUD': 'Dólar australiano',
    'CAD': 'Dólar canadiense',
  },
  fr: {
    'nav.roversSuites': 'Rovers Suites',
    'nav.home': 'Accueil',
    'nav.becomeHost': 'Devenir Hôte',
    'nav.signIn': 'Se Connecter',
    'nav.manageProperties': 'Gérer les Propriétés',
    'nav.search': 'Rechercher des lieux...',
    'nav.logout': 'Déconnexion',
    'nav.currency': 'Devise',
    'USD': 'Dollar américain',
    'EUR': 'Euro',
    'GBP': 'Livre sterling',
    'INR': 'Roupie indienne',
    'JPY': 'Yen japonais',
    'AUD': 'Dollar australien',
    'CAD': 'Dollar canadien',
  },
  de: {
    'nav.roversSuites': 'Rovers Suites',
    'nav.home': 'Startseite',
    'nav.becomeHost': 'Gastgeber werden',
    'nav.signIn': 'Anmelden',
    'nav.manageProperties': 'Eigenschaften verwalten',
    'nav.search': 'Orte suchen...',
    'nav.logout': 'Abmelden',
    'nav.currency': 'Währung',
    'USD': 'US-Dollar',
    'EUR': 'Euro',
    'GBP': 'Britisches Pfund',
    'INR': 'Indische Rupie',
    'JPY': 'Japanischer Yen',
    'AUD': 'Australischer Dollar',
    'CAD': 'Kanadischer Dollar',
  },
  hi: {
    'nav.roversSuites': 'रोवर्स सुइट्स',
    'nav.home': 'होम',
    'nav.becomeHost': 'होस्ट बनें',
    'nav.signIn': 'साइन इन करें',
    'nav.manageProperties': 'प्रॉपर्टी प्रबंधित करें',
    'nav.search': 'स्थान खोजें...',
    'nav.logout': 'लॉग आउट',
    'nav.currency': 'मुद्रा',
    'USD': 'अमेरिकी डॉलर',
    'EUR': 'यूरो',
    'GBP': 'ब्रिटिश पाउंड',
    'INR': 'भारतीय रुपया',
    'JPY': 'जापानी येन',
    'AUD': 'ऑस्ट्रेलियाई डॉलर',
    'CAD': 'कनाडाई डॉलर',
  },
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      selectedLanguage: 'en',
      languages: [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        { code: 'it', name: 'Italiano', flag: '🇮🇹' },
        { code: 'pt', name: 'Português', flag: '🇵🇹' },
        { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
        { code: 'pl', name: 'Polski', flag: '🇵🇱' },
        { code: 'ru', name: 'Русский', flag: '🇷🇺' },
        { code: 'ja', name: '日本語', flag: '🇯🇵' },
        { code: 'ko', name: '한국어', flag: '🇰🇷' },
        { code: 'zh', name: '中文', flag: '🇨🇳' },
        { code: 'ar', name: 'العربية', flag: '🇸🇦' },
        { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
        { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
      ],
      translations,
      
      setLanguage: (language) => {
        set({ selectedLanguage: language });
      },
      
      translate: (key: string) => {
        const state = get();
        const translation = state.translations[state.selectedLanguage]?.[key] || 
                          state.translations['en'][key];
        
        if (!translation) {
          console.warn(`Translation missing for key: ${key}`);
          return key;
        }
        
        return translation;
      },
    }),
    {
      name: 'language-storage',
      version: 1,
    }
  )
);