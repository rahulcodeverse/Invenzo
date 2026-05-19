import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type InvenzoTheme = 'teal-light' | 'teal-dark' | 'copper-smooth';

export interface ThemeOption {
  id: InvenzoTheme;
  label: string;
  description: string;
}

const THEME_STORAGE_KEY = 'invenzo-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly themes: ThemeOption[] = [
    {
      id: 'teal-light',
      label: 'Teal Light',
      description: 'Teal with white and cream surfaces',
    },
    {
      id: 'teal-dark',
      label: 'Teal Dark',
      description: 'Dark operations console with teal actions',
    },
    {
      id: 'copper-smooth',
      label: 'Copper Smooth',
      description: 'Current warm theme, softened and polished',
    },
  ];

  private readonly activeThemeSubject = new BehaviorSubject<InvenzoTheme>('copper-smooth');
  readonly activeTheme$ = this.activeThemeSubject.asObservable();

  initialize(): void {
    const savedTheme = this.normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
    this.setTheme(savedTheme || 'copper-smooth');
  }

  setTheme(theme: InvenzoTheme): void {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    this.activeThemeSubject.next(theme);
  }

  get activeTheme(): InvenzoTheme {
    return this.activeThemeSubject.value;
  }

  get activeThemeLabel(): string {
    return this.themes.find(theme => theme.id === this.activeTheme)?.label || 'Theme';
  }

  private normalizeTheme(theme: string | null): InvenzoTheme | null {
    return this.themes.some(option => option.id === theme) ? (theme as InvenzoTheme) : null;
  }
}
