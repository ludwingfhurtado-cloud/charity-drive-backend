import { Language } from '../types';
import en from './en';
import es from './es';
import pt from './pt';

const translations: Record<Language, Record<string, string>> = {
  en,
  es,
  pt,
};

export const t = (key: string, lang: Language): string => {
  return translations[lang][key] || translations['en'][key] || key;
};