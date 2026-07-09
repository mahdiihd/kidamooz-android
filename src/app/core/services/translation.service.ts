import { Injectable, signal } from '@angular/core';

import en from '../../../assets/i18n/en.json';
import fa from '../../../assets/i18n/fa.json';
import {
  AppLanguage,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
} from '../models/app-language.model';

type TranslationTree = Record<string, unknown>;

const TRANSLATIONS: Record<AppLanguage, TranslationTree> = {
  fa: fa as TranslationTree,
  en: en as TranslationTree,
};

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly languageState = signal<AppLanguage>(DEFAULT_LANGUAGE);

  readonly language = this.languageState.asReadonly();

  constructor() {
    this.initializeLanguage();
  }

  translate(key: string): string {
    const value = key.split('.').reduce<unknown>((current, part) => {
      if (current && typeof current === 'object' && part in current) {
        return (current as TranslationTree)[part];
      }
      return undefined;
    }, TRANSLATIONS[this.languageState()]);

    return typeof value === 'string' ? value : key;
  }

  toggleLanguage(): void {
    this.setLanguage(this.languageState() === 'fa' ? 'en' : 'fa');
  }

  setLanguage(language: AppLanguage): void {
    this.languageState.set(language);
    this.applyDocumentLanguage(language);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }

  isRtl(): boolean {
    return this.languageState() === 'fa';
  }

  private initializeLanguage(): void {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as AppLanguage | null;
    const language = stored === 'en' || stored === 'fa' ? stored : DEFAULT_LANGUAGE;
    this.languageState.set(language);
    this.applyDocumentLanguage(language);
  }

  private applyDocumentLanguage(language: AppLanguage): void {
    const html = document.documentElement;
    html.lang = language;
    html.dir = language === 'fa' ? 'rtl' : 'ltr';
  }
}
