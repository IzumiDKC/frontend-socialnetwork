import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  styles: [`
    .navbar { background-color: #3b5998; color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .brand { font-size: 1.5rem; font-weight: bold; }
    .container { max-width: 800px; margin: 40px auto; padding: 20px; text-align: center; }
    button { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 1rem; }
    .btn-login { background-color: #42b72a; color: white; }
    .btn-logout { background-color: #f02849; color: white; }
    .btn-load { background-color: #1877f2; color: white; margin-bottom: 20px; }
    .post-card { background: #f0f2f5; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; text-align: left; }
    .error-box { background-color: #ffebe8; color: #cc0000; padding: 15px; border: 1px solid #dd3c10; border-radius: 4px; margin-top: 20px; }
  `],
  template: `
    <nav class="navbar">
      <div class="brand">Social Network Demo</div>
      <div>
        <span *ngIf="isLoggedIn" style="margin-right: 15px;">
          Xin chào, <strong>{{ userProfile?.username }}</strong>
        </span>
        <button *ngIf="!isLoggedIn" class="btn-login" (click)="login()">Đăng nhập</button>
        <button *ngIf="isLoggedIn" class="btn-logout" (click)="logout()">Đăng xuất</button>
      </div>
    </nav>

    <div class="container">
      <div *ngIf="!isLoggedIn">
        <h2>Chào mừng bạn đến với Mạng xã hội</h2>
        <p>Vui lòng đăng nhập thông qua Keycloak để xem nội dung.</p>
        <button class="btn-login" (click)="login()">👉 Đăng nhập ngay</button>
      </div>

      <div *ngIf="isLoggedIn">
        <h3>News Feed (Dữ liệu từ Microservice)</h3>
        <p>Token của bạn đang được tự động gửi kèm request.</p>
        
        <button class="btn-load" (click)="getPosts()">
          📥 Lấy danh sách bài viết (API Gateway 8081)
        </button>

        <div *ngIf="errorMessage" class="error-box">
          <strong>⚠️ Lỗi xảy ra:</strong> {{ errorMessage }} <br>
          <small>Hãy kiểm tra lại Backend hoặc cấu hình CORS/Keycloak.</small>
        </div>

        <div *ngFor="let post of posts" class="post-card">
          <h4>Post ID: {{ post.id }}</h4>
          <p>{{ post.content }}</p>
        </div>
      </div>
    </div>
  `
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  userProfile: any = null;
  posts: any[] = [];
  errorMessage = '';

  constructor(
    private keycloak: KeycloakService, 
    private http: HttpClient
  ) {}

  async ngOnInit() {
    
    this.isLoggedIn = this.keycloak.getKeycloakInstance()?.authenticated ?? false;
    
    console.log("Trạng thái login (Native):", this.isLoggedIn);

    if (this.isLoggedIn) {
      try {
        this.userProfile = await this.keycloak.loadUserProfile();
      } catch (e) {
        console.error("Lỗi tải profile:", e);
      }
    }
  }

  login() {
    this.keycloak.login({
      redirectUri: window.location.origin
    });
  }

  logout() {
    this.keycloak.logout();
  }

  getPosts() {
    this.errorMessage = '';
    this.posts = [];
    this.http.get<any[]>('/api/posts').subscribe({
      next: (data) => this.posts = data,
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Lỗi kết nối: ' + err.message;
      }
    });
  }
}