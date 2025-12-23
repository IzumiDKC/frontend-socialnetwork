import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .container { max-width: 600px; margin: 40px auto; font-family: sans-serif; }
    .profile-card {
      background: white; border: 1px solid #ddd; border-radius: 8px;
      padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h2 { margin-top: 0; color: #1877f2; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    
    .info-row { margin-bottom: 15px; display: flex; align-items: center; }
    .label { font-weight: bold; width: 120px; color: #555; }
    .value { flex: 1; color: #333; font-size: 1.05rem; }

    .btn-group { margin-top: 30px; display: flex; gap: 15px; }
    
    button {
      padding: 10px 20px; border-radius: 5px; border: none; cursor: pointer;
      font-weight: bold; transition: 0.2s;
    }
    
    .btn-manage { background: #1877f2; color: white; }
    .btn-manage:hover { background: #166fe5; }

    .btn-logout { background: #f0f2f5; color: #333; }
    .btn-logout:hover { background: #e4e6eb; }
  `],
  template: `
    <div class="container">
      <div class="profile-card">
        <h2>Thông tin tài khoản</h2>
        
        <div class="info-row">
          <span class="label">Username:</span>
          <span class="value">{{ userProfile?.username }}</span>
        </div>

        <div class="info-row">
          <span class="label">Email:</span>
          <span class="value">{{ userProfile?.email || 'Chưa cập nhật' }}</span>
        </div>

        <div class="info-row">
          <span class="label">Họ:</span>
          <span class="value">{{ userProfile?.firstName || '---' }}</span>
        </div>

        <div class="info-row">
          <span class="label">Tên:</span>
          <span class="value">{{ userProfile?.lastName || '---' }}</span>
        </div>

        <div class="info-row">
          <span class="label">User ID:</span>
          <span class="value" style="font-size: 0.8rem; color: #888;">{{ userProfile?.id }}</span>
        </div>

        <div class="btn-group">
          <button class="btn-manage" (click)="manageAccount()">
            🔑 Đổi Mật khẩu / Email
          </button>
          
          <button class="btn-logout" (click)="logout()">
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  userProfile: any | null = null;

  constructor(private keycloak: KeycloakService) {}

  async ngOnInit() {
    if (await this.keycloak.isLoggedIn()) {
      this.userProfile = await this.keycloak.loadUserProfile();
    }
  }

  manageAccount() {
    this.keycloak.getKeycloakInstance().accountManagement();
  }

  logout() {
    this.keycloak.logout('http://localhost:4200'); 
  }
}