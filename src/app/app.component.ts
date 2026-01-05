import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';

import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { UserService } from './services/user.service';
import { ThemeService } from './services/theme.service'; // Import ThemeService

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], 
  styles: [`
    /* Sử dụng biến CSS để hỗ trợ Dark Mode */
    .navbar {
      background-color: var(--bg-card); /* Thay cho #ffffff */
      border-bottom: 1px solid var(--border-color); /* Thay cho #ddd */
      padding: 0 20px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky; top: 0; z-index: 1000;
      box-shadow: var(--shadow);
      transition: background-color 0.3s;
    }
    .brand { font-size: 1.5rem; font-weight: bold; color: var(--primary-color); text-decoration: none; margin-right: 20px; }
    
    /* --- CSS CHO THANH TÌM KIẾM --- */
    .search-container {
      flex: 1;
      max-width: 400px;
      margin-right: auto;
      position: relative;
    }

    .search-input {
      width: 100%;
      padding: 10px 20px;
      background-color: var(--bg-input); /* Thay cho #f0f2f5 */
      color: var(--text-main); /* Màu chữ */
      border: 1px solid transparent;
      border-radius: 20px;
      font-size: 0.95rem;
      outline: none;
      transition: 0.2s;
    }
    .search-input:focus {
      background-color: var(--bg-card);
      border-color: var(--border-color);
      box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.2);
    }

    /* Dropdown kết quả tìm kiếm */
    .search-dropdown {
      position: absolute;
      top: 110%;
      left: 0;
      width: 100%;
      background: var(--bg-card); /* Thay cho white */
      border: 1px solid var(--border-color);
      border-radius: 8px;
      box-shadow: var(--shadow);
      padding: 10px 0;
      z-index: 1002;
    }

    .search-item {
      display: flex;
      align-items: center;
      padding: 10px 15px;
      cursor: pointer;
      text-decoration: none;
      color: var(--text-main); /* Thay cho #050505 */
    }
    .search-item:hover {
      background-color: var(--bg-hover); /* Thay cho #f0f2f5 */
    }
    .search-avatar {
      width: 36px; height: 36px; border-radius: 50%; object-fit: cover; margin-right: 10px;
      border: 1px solid var(--border-color);
    }
    .search-name {
      font-weight: 500; font-size: 0.95rem;
    }
    /* ------------------------------------ */

    .nav-links { display: flex; gap: 15px; align-items: center; }
    
    .nav-item {
      text-decoration: none; 
      color: var(--text-sub); /* Thay cho #65676b */
      font-weight: 600; 
      padding: 8px 15px; 
      border-radius: 5px; 
      transition: 0.2s;
      cursor: pointer;
      display: flex; align-items: center;
    }
    .nav-item:hover { background-color: var(--bg-hover); }
    .active-link { color: var(--primary-color); background-color: var(--bg-hover); }

    /* Nút đổi theme */
    .btn-theme {
      background: var(--bg-hover);
      border: 1px solid var(--border-color);
      color: var(--text-main);
      font-size: 1.2rem;
      width: 40px; height: 40px;
      border-radius: 50%;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: 0.2s;
    }
    .btn-theme:hover { filter: brightness(0.9); }

    .dropdown { position: relative; display: inline-block; }
    .dropdown-content {
      display: none; position: absolute; right: 0; top: 100%; 
      background-color: var(--bg-card); /* Thay cho #fff */
      min-width: 180px;
      box-shadow: var(--shadow);
      border-radius: 8px; z-index: 1001;
      padding: 5px 0; 
      border: 1px solid var(--border-color); /* Thay cho #ddd */
    }
    .dropdown:hover .dropdown-content { display: block; }
    
    .dropdown-item {
      color: var(--text-main); /* Thay cho #333 */
      padding: 10px 15px; text-decoration: none; display: block; font-weight: 500; cursor: pointer; transition: background 0.2s;
    }
    .dropdown-item:hover { background-color: var(--bg-hover); color: var(--primary-color); }
    .arrow-down { font-size: 0.8rem; margin-left: 5px; }
  `],
  template: `
    <nav class="navbar">
      <a routerLink="/home" class="brand">VNVerse</a>
      
      <div class="search-container">
        <input 
          type="text" 
          class="search-input" 
          placeholder="Tìm kiếm trên VNVerse..." 
          (input)="onSearch($event)"
        >

        <div class="search-dropdown" *ngIf="searchResults.length > 0">
          <a *ngFor="let user of searchResults" 
             [routerLink]="['/', user.username]" 
             class="search-item"
             (click)="clearSearch()"> 
            <img [src]="user.avatarUrl || 'assets/default-avatar.png'" class="search-avatar">
            <span class="search-name">{{ user.fullName || user.username }}</span>
          </a>
        </div>
      </div>
      
      <div class="nav-links">
        <button class="btn-theme" (click)="toggleTheme()" title="Đổi giao diện">
           {{ isDark ? '☀️' : '🌙' }}
        </button>

        <a routerLink="/home" routerLinkActive="active-link" class="nav-item">Trang chủ</a>
        
        <div class="dropdown" *ngIf="myUsername">
          <div class="nav-item" [class.active-link]="isActiveProfile()">
             <img *ngIf="myAvatar" [src]="myAvatar" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px; object-fit: cover;">
             {{ myFullName || myUsername }} <span class="arrow-down">▼</span>
          </div>

          <div class="dropdown-content">
            <a [routerLink]="['/', myUsername]" class="dropdown-item">Trang cá nhân</a>
            <hr style="margin: 0; border: none; border-top: 1px solid var(--border-color);">
            <a (click)="logout()" class="dropdown-item" style="color: #d93025;">Đăng xuất</a>
          </div>
        </div>
      </div>
    </nav>

    <router-outlet></router-outlet>
  `
})
export class AppComponent implements OnInit {
  title = 'frontend-socialnetwork';
  myUsername = '';
  myFullName = '';
  myAvatar = '';
  
  // Biến trạng thái Dark Mode
  isDark = false;

  // Biến Tìm kiếm
  searchResults: any[] = [];
  private searchSubject = new Subject<string>();

  constructor(
    private keycloak: KeycloakService,
    private userService: UserService,
    private themeService: ThemeService // Inject ThemeService
  ) {}

  async ngOnInit() {
    // 1. Khởi tạo theme
    this.isDark = this.themeService.isDarkMode();

    // 2. Lấy thông tin user
    try {
      if (await this.keycloak.isLoggedIn()) {
        const profile = await this.keycloak.loadUserProfile();
        this.myUsername = profile.username || '';
        this.myFullName = (profile.firstName ? profile.firstName : '') + ' ' + (profile.lastName ? profile.lastName : '');
        this.myFullName = this.myFullName.trim();
        
        // Lấy avatar chính xác từ DB
        this.userService.getUserInfo(this.myUsername).subscribe(u => this.myAvatar = u.avatarUrl);
      }
    } catch (error) {
      console.error('Lỗi lấy thông tin user:', error);
    }

    // 3. Khởi tạo tìm kiếm
    this.setupSearch();
  }

  // --- LOGIC DARK MODE ---
  toggleTheme() {
    this.themeService.toggleTheme();
    this.isDark = this.themeService.isDarkMode();
  }

  // --- LOGIC TÌM KIẾM ---
  setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300), 
      distinctUntilChanged(), 
      switchMap(term => {
        if (!term.trim()) {
          return [];
        }
        return this.userService.searchUsers(term);
      })
    ).subscribe(users => {
      this.searchResults = users || [];
    });
  }

  onSearch(event: any) {
    const term = event.target.value;
    this.searchSubject.next(term);
    
    if (!term) {
      this.searchResults = [];
    }
  }

  clearSearch() {
    this.searchResults = [];
  }

  logout() {
    this.keycloak.logout('http://localhost:4200/home'); 
  }

  isActiveProfile(): boolean {
    return window.location.pathname === '/' + this.myUsername;
  }
}