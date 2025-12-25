import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakService } from 'keycloak-angular';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .container { max-width: 600px; margin: 40px auto; font-family: sans-serif; }
    .profile-card {
      background: white; border: 1px solid #ddd; border-radius: 8px;
      padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      /* Thêm text-align center để căn giữa avatar */
      text-align: center; 
    }
    /* Chỉnh lại h2 để text về bên trái nếu muốn, hoặc để giữa tùy ý. Ở đây tôi để left cho giống cũ */
    h2 { margin-top: 0; color: #1877f2; border-bottom: 1px solid #eee; padding-bottom: 10px; text-align: left; }
    
    .info-row { margin-bottom: 15px; display: flex; align-items: center; text-align: left; }
    .label { font-weight: bold; width: 120px; color: #555; }
    .value { flex: 1; color: #333; font-size: 1.05rem; }

    .btn-group { margin-top: 30px; display: flex; gap: 15px; justify-content: center; }
    
    button {
      padding: 10px 20px; border-radius: 5px; border: none; cursor: pointer;
      font-weight: bold; transition: 0.2s;
    }
    
    .btn-manage { background: #1877f2; color: white; }
    .btn-manage:hover { background: #166fe5; }

    .btn-logout { background: #f0f2f5; color: #333; }
    .btn-logout:hover { background: #e4e6eb; }

    .avatar-container { margin-bottom: 20px; position: relative; display: inline-block; }
    
    .avatar-img {
      width: 120px; height: 120px; border-radius: 50%; object-fit: cover;
      border: 3px solid #1877f2; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    
    .avatar-placeholder {
      width: 120px; height: 120px; border-radius: 50%; background: #ddd;
      color: #555; font-size: 3rem; font-weight: bold;
      display: flex; align-items: center; justify-content: center;
      border: 3px solid #ccc; margin: 0 auto;
    }

    .btn-upload-trigger {
      position: absolute; bottom: 0; right: 0; background: #f0f2f5; border: 1px solid #ccc;
      border-radius: 50%; width: 36px; height: 36px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
      transition: 0.2s;
    }
    .btn-upload-trigger:hover { background: #e4e6eb; transform: scale(1.05); }

    /* Ẩn input file mặc định */
    #fileInput { display: none; }

    .upload-actions { margin-bottom: 20px; }
    .btn-save { background: #42b72a; color: white; margin-right: 10px; }
    .btn-cancel { background: #e4e6eb; color: #333; }
  `],
  template: `
    <div class="container">
      <div class="profile-card">
        <h2>👤 Thông tin tài khoản</h2>
        
        <div class="avatar-container">
          <img *ngIf="userProfile?.avatarUrl" [src]="userProfile.avatarUrl" class="avatar-img" alt="Avatar">
          
          <div *ngIf="!userProfile?.avatarUrl" class="avatar-placeholder">
            {{ userProfile?.username?.charAt(0)?.toUpperCase() || 'U' }}
          </div>

          <label for="fileInput" class="btn-upload-trigger" title="Đổi ảnh đại diện">📷</label>
          <input type="file" id="fileInput" (change)="onFileSelected($event)" accept="image/png, image/jpeg">
        </div>

        <div *ngIf="selectedFile" class="upload-actions">
          <p style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">Đang chọn: {{ selectedFile.name }}</p>
          <button class="btn-save" (click)="onUpload()">⬆️ Lưu ảnh</button>
          <button class="btn-cancel" (click)="selectedFile = null">Hủy</button>
        </div>
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
  selectedFile: File | null = null;

  constructor(
    private keycloak: KeycloakService,
    private userService: UserService 
  ) {}

  async ngOnInit() {
  if (await this.keycloak.isLoggedIn()) {
    const kcProfile = await this.keycloak.loadUserProfile();
    const username = kcProfile.username;

    if (username) {
      this.userService.getUserByUsername(username).subscribe({
        next: (dbUser) => {
          this.userProfile = {
            ...kcProfile,           
            id: dbUser.id,         
            avatarUrl: dbUser.avatarUrl 
          };
        },
        error: (err) => {
          console.error('Lỗi không lấy được thông tin user từ DB:', err);
          this.userProfile = kcProfile;
        }
      });
    }
  }
}

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      if (file.type.match(/image\/*/) == null) {
        alert("Chỉ được phép chọn file ảnh!");
        return;
      }
      this.selectedFile = file;
    }
  }

  onUpload() {
    if (!this.selectedFile) return;

    this.userService.uploadAvatar(this.selectedFile).subscribe({
      next: (updatedUser: any) => {
        alert('Cập nhật ảnh đại diện thành công!');
        
        if (this.userProfile) {
          this.userProfile.avatarUrl = updatedUser.avatarUrl; 
        }
        
        this.selectedFile = null; 
      },
      error: (err) => {
        console.error('Upload lỗi:', err);
        alert('Lỗi khi upload ảnh: ' + (err.message || err));
      }
    });
  }

  manageAccount() {
    this.keycloak.getKeycloakInstance().accountManagement();
  }

  logout() {
    this.keycloak.logout('http://localhost:4200'); 
  }
}