import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KeycloakService } from 'keycloak-angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { UserService } from '../app/services/user.service';
import { PostService } from '../app/services/post.service';

// Import Services vừa tạo


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule], // Không cần HttpClientModule nữa
  styles: [`
    /* Giữ nguyên CSS cũ của bạn */
    .container { max-width: 900px; margin: 20px auto; display: flex; gap: 20px; font-family: sans-serif; }
    .left-col { width: 35%; }
    .right-col { width: 65%; }
    .box { background: white; border-radius: 8px; padding: 15px; margin-bottom: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); border: 1px solid #ddd; }
    h3 { margin-top: 0; font-size: 1.1rem; color: #333; }
    .search-input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 20px; outline: none; margin-bottom: 10px; }
    .user-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 0.9rem; }
    .btn-follow { background: #1877f2; color: white; border: none; padding: 5px 12px; border-radius: 15px; cursor: pointer; font-size: 0.8rem; }
    .btn-following { background: #e4e6eb; color: black; border: none; padding: 5px 12px; border-radius: 15px; cursor: default; font-size: 0.8rem; }
    textarea { width: 100%; height: 80px; padding: 10px; border: 1px solid #e4e6eb; border-radius: 8px; resize: none; margin-bottom: 10px; font-family: inherit; }
    .btn-post { background: #1877f2; color: white; border: none; padding: 8px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; }
    .btn-post:disabled { background: #ccc; cursor: not-allowed; }
    .post-card { background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #ddd; }
    .post-header { display: flex; align-items: center; margin-bottom: 10px; }
    .avatar-placeholder { width: 40px; height: 40px; background: #ddd; border-radius: 50%; margin-right: 10px; }
    .post-author { font-weight: bold; color: #050505; }
    .post-content { color: #050505; line-height: 1.4; }
    @media (max-width: 768px) { .container { flex-direction: column; } .left-col, .right-col { width: 100%; } }
  `],
  template: `
    <div class="container">
      <div class="left-col">
        <div class="box">
          <h3>👋 Chào, {{ myUsername }}!</h3>
          <p *ngIf="myId">UserID: <strong>{{ myId }}</strong></p>
        </div>

        <div class="box">
          <h3>🔍 Tìm bạn bè</h3>
          <input class="search-input" placeholder="Nhập tên..." (input)="onSearch($event)">
          
          <div *ngIf="searchResults.length > 0">
            <div *ngFor="let user of searchResults" class="user-item">
              <span>{{ user.username }} <small *ngIf="user.id === myId">(Bạn)</small></span>
              <div *ngIf="user.id !== myId">
                <button *ngIf="!isFollowing(user.id)" class="btn-follow" (click)="follow(user.id)">Follow</button>
                <button *ngIf="isFollowing(user.id)" class="btn-following">Đang Follow</button>
              </div>
            </div>
          </div>
          <div *ngIf="searchResults.length === 0 && searchTerm" style="color: gray; font-size: 0.9rem; text-align: center;">Không tìm thấy ai.</div>
        </div>
      </div>

      <div class="right-col">
        <div class="box">
          <textarea [(ngModel)]="newPostContent" placeholder="Bạn đang nghĩ gì thế?"></textarea>
          <button class="btn-post" (click)="createPost()" [disabled]="!newPostContent.trim()">Đăng bài</button>
        </div>

        <button (click)="loadFeed()" style="margin-bottom: 10px; cursor: pointer; border: none; background: none; color: #1877f2;">🔄 Làm mới</button>

        <div *ngFor="let post of posts" class="post-card">
          <div class="post-header">
            <div class="avatar-placeholder"></div>
            <div class="post-author">User (ID: {{post.userId}})</div>
          </div>
          <div class="post-content">{{ post.content }}</div>
        </div>
        <div *ngIf="posts.length === 0" style="text-align: center; color: gray;">Chưa có bài viết nào.</div>
      </div>
    </div>
  `
})
export class HomeComponent implements OnInit {
  myUsername = '';
  myId: number | null = null;
  followingIds: number[] = [];
  
  searchTerm = '';
  searchResults: any[] = [];
  private searchSubject = new Subject<string>();

  posts: any[] = [];
  newPostContent = '';

  constructor(
    private keycloak: KeycloakService,
    private userService: UserService,
    private postService: PostService
  ) {}

  async ngOnInit() {
    const profile = await this.keycloak.loadUserProfile();
    this.myUsername = profile.username || '';

    if (this.myUsername) {
      this.userService.getMyUserId(this.myUsername).subscribe(id => {
        this.myId = id;
        this.refreshFollowing();
      });
    }

    this.loadFeed();
    this.setupSearch();
  }

  setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.userService.searchUsers(term))
    ).subscribe(users => this.searchResults = users || []);
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value;
    this.searchSubject.next(this.searchTerm);
  }

  refreshFollowing() {
    if (this.myId) {
      this.userService.getFollowingIds(this.myId).subscribe(ids => this.followingIds = ids);
    }
  }

  isFollowing(targetId: number): boolean {
    return this.followingIds.includes(targetId);
  }

  follow(targetId: number) {
    if (!this.myId) return;
    this.userService.followUser(this.myId, targetId).subscribe({
      next: () => this.followingIds.push(targetId),
      error: (err: any) => alert('Lỗi: ' + (err.message || err))
    });
  }

  loadFeed() {
    this.postService.getFeed().subscribe(data => this.posts = data);
  }

createPost() {
    if (!this.newPostContent.trim()) return;
    this.postService.createPost(this.newPostContent).subscribe({
      next: () => {
        this.newPostContent = '';
        this.loadFeed();
      },
      error: (err: any) => alert('Lỗi: ' + (err.message || err))
    });
  }
}