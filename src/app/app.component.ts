import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], 
  styles: [`
    .navbar {
      background-color: #ffffff;
      border-bottom: 1px solid #ddd;
      padding: 0 20px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky; top: 0; z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .brand { font-size: 1.5rem; font-weight: bold; color: #1877f2; text-decoration: none; }
    
    .nav-links { display: flex; gap: 20px; align-items: center; }
    
    .nav-item {
      text-decoration: none; color: #65676b; font-weight: 600; padding: 8px 15px; border-radius: 5px; transition: 0.2s;
      cursor: pointer;
      display: flex; align-items: center;
    }
    .nav-item:hover { background-color: #f0f2f5; }
    .active-link { color: #1877f2; background-color: #e7f3ff; }

    .dropdown {
      position: relative;
      display: inline-block;
    }

    .dropdown-content {
      display: none;
      position: absolute;
      right: 0; 
      top: 100%; 
      background-color: #fff;
      min-width: 180px;
      box-shadow: 0 8px 16px rgba(0,0,0,0.2);
      border-radius: 8px;
      z-index: 1001;
      padding: 5px 0;
      border: 1px solid #ddd;
    }

    .dropdown:hover .dropdown-content {
      display: block;
    }

    .dropdown-item {
      color: #333;
      padding: 10px 15px;
      text-decoration: none;
      display: block;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .dropdown-item:hover {
      background-color: #f2f2f2;
      color: #1877f2;
    }
    
    .arrow-down {
      font-size: 0.8rem;
      margin-left: 5px;
    }
  `],
  template: `
    <nav class="navbar">
      <a routerLink="/home" class="brand">VNVerse</a>
      
      <div class="nav-links">
        <a routerLink="/home" routerLinkActive="active-link" class="nav-item">Trang chủ</a>
        
        <div class="dropdown" *ngIf="myUsername">
          
          <div class="nav-item" [class.active-link]="isActiveProfile()">
             <img *ngIf="myAvatar" [src]="myAvatar" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px; object-fit: cover;">
             {{ myFullName || myUsername }} <span class="arrow-down">▼</span>
          </div>

          <div class="dropdown-content">
            <a [routerLink]="['/', myUsername]" class="dropdown-item">
              Trang cá nhân
            </a>
            
            <hr style="margin: 0; border: none; border-top: 1px solid #eee;">

            <a (click)="logout()" class="dropdown-item" style="color: #d93025;">
              Đăng xuất
            </a>
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

  constructor(private keycloak: KeycloakService) {}

  async ngOnInit() {
    try {
      if (await this.keycloak.isLoggedIn()) {
        const profile = await this.keycloak.loadUserProfile();
        this.myUsername = profile.username || '';
        
        this.myFullName = (profile.firstName ? profile.firstName : '') + ' ' + (profile.lastName ? profile.lastName : '');
        this.myFullName = this.myFullName.trim();
      }
    } catch (error) {
      console.error('Lỗi lấy thông tin user:', error);
    }
  }

  logout() {
    this.keycloak.logout('http://localhost:4200/home'); 
  }

  isActiveProfile(): boolean {
    return window.location.pathname === '/' + this.myUsername;
  }
}