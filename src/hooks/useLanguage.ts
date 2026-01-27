import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';


export const useLanguage = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = useCallback(async (language: 'en' | 'fr') => {
    try {
      await i18n.changeLanguage(language);
      localStorage.setItem('user-language', language);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }, [i18n]);

  const getCurrentLanguage = useCallback(() => {
    return i18n.language;
  }, [i18n.language]);

  const getLanguageName = useCallback((languageCode: string) => {
    switch (languageCode) {
      case 'en':
        return t('languages.english');
      case 'fr':
        return t('languages.french');
      default:
        return t('languages.english');
    }
  }, [t]);

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    getLanguageName,
    currentLanguage: i18n.language,
    isEnglish: i18n.language === 'en',
    isFrench: i18n.language === 'fr',
  };
};
