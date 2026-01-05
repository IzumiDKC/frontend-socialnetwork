import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private darkMode = false;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.initTheme();
  }

  initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.enableDarkMode();
    } else {
      this.disableDarkMode();
    }
  }

  toggleTheme() {
    if (this.darkMode) {
      this.disableDarkMode();
    } else {
      this.enableDarkMode();
    }
  }

  isDarkMode(): boolean {
    return this.darkMode;
  }

  private enableDarkMode() {
    this.darkMode = true;
    this.renderer.addClass(document.body, 'dark-mode');
    localStorage.setItem('theme', 'dark');
  }

  private disableDarkMode() {
    this.darkMode = false;
    this.renderer.removeClass(document.body, 'dark-mode');
    localStorage.setItem('theme', 'light');
  }
}