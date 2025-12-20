import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet], 
  styles: [`
    .navbar { background-color: #3b5998; color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-size: 1.5rem; font-weight: bold; }
    button { background: #f02849; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
  `],
  template: `
    <nav class="navbar" *ngIf="isLoggedIn">
      <div class="brand">Social Network</div>
      <div>
        <button (click)="logout()">Đăng xuất</button>
      </div>
    </nav>

    <router-outlet></router-outlet>
  `
})
export class AppComponent implements OnInit {
  isLoggedIn = false;

  constructor(private keycloak: KeycloakService) {}

  ngOnInit() {
    this.isLoggedIn = this.keycloak.getKeycloakInstance()?.authenticated ?? false;
  }

  logout() {
    this.keycloak.logout();
  }
}