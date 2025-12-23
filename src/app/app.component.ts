import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], // Import RouterLink
  styles: [`
    /* Header Style */
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
    
    .nav-links { display: flex; gap: 20px; }
    .nav-item {
      text-decoration: none; color: #65676b; font-weight: 600; padding: 8px 15px; border-radius: 5px; transition: 0.2s;
    }
    .nav-item:hover { background-color: #f0f2f5; }
    
    /* Active Link Style (Khi đang ở trang đó) */
    .active-link { color: #1877f2; background-color: #e7f3ff; }
  `],
  template: `
    <nav class="navbar">
      <a routerLink="/home" class="brand">VNVerse</a>
      
      <div class="nav-links">
        <a routerLink="/home" routerLinkActive="active-link" class="nav-item">Trang chủ</a>
        <a routerLink="/profile" routerLinkActive="active-link" class="nav-item">Tài khoản</a>
      </div>
    </nav>

    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'frontend-socialnetwork';
}