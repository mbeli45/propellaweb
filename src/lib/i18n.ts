import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from '../locales/en.json';
import fr from '../locales/fr.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // First try to get language from localStorage
      const savedLanguage = localStorage.getItem('user-language');
      if (savedLanguage) {
        return callback(savedLanguage);
      }
      
      // Fall back to browser locale
      const deviceLanguage = navigator.language.split('-')[0] || 'en';
      const supportedLanguages = ['en', 'fr'];
      const language = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';
      
      callback(language);
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      localStorage.setItem('user-language', lng);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en
      },
      fr: {
        translation: fr
      }
    },
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;
