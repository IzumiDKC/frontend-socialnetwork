import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KeycloakService } from 'keycloak-angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { UserService } from '../app/services/user.service';
import { PostService } from '../app/services/post.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'] 
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
      this.userService.getMyUserId(this.myUsername).subscribe((id: number) => {
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
      this.userService.getFollowingIds(this.myId).subscribe((ids: number[]) => {
        this.followingIds = ids;
      });
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

  // --- CẬP NHẬT: Thêm thuộc tính showMenu vào post ---
  loadFeed() {
    this.postService.getFeed().subscribe((data: any[]) => {
      this.posts = data.map(post => ({
        ...post,
        showComments: false,
        showMenu: false, // <--- QUAN TRỌNG: Mặc định ẩn menu
        comments: [],            
        newCommentInput: '' 
      }));
    });
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

  onLikePost(post: any) {
    this.postService.likePost(post.id).subscribe({
      next: (newLikeCount: number) => {
        post.likeCount = newLikeCount;
        post.likedByCurrentUser = !post.likedByCurrentUser;
      },
      error: (err: any) => console.error('Lỗi like:', err)
    });
  }

  // --- CÁC HÀM XỬ LÝ MENU VÀ XÓA POST MỚI ---

  togglePostMenu(post: any) {
    // Đóng tất cả menu của các bài khác để tránh rối mắt
    this.posts.forEach(p => {
      if (p !== post) p.showMenu = false;
    });
    // Bật/tắt menu của bài hiện tại
    post.showMenu = !post.showMenu;
  }

  deletePost(post: any) {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.')) {
      return;
    }

    this.postService.deletePost(post.id).subscribe({
      next: () => {
        alert('Đã xóa bài viết.');
        // Xóa bài viết khỏi danh sách hiển thị trên giao diện ngay lập tức
        this.posts = this.posts.filter(p => p.id !== post.id);
      },
      error: (err) => {
        console.error(err);
        alert('Lỗi khi xóa bài viết: ' + (err.message || err));
      }
    });
  }

  // ---------------------------------------------

  toggleComments(post: any) {
    post.showComments = !post.showComments;
    if (post.showComments) {
      this.loadComments(post);
    }
  }

  loadComments(post: any) {
    this.postService.getComments(post.id).subscribe({
      next: (comments) => {
        post.comments = comments;
      },
      error: (err) => console.error('Lỗi tải comment:', err)
    });
  }

  submitComment(post: any) {
    const content = post.newCommentInput?.trim();
    if (!content) return;

    this.postService.createComment(post.id, content).subscribe({
      next: (savedComment) => {
        if (!post.comments) post.comments = [];
        post.comments.unshift(savedComment);
        
        post.commentCount++;
        post.newCommentInput = '';
      },
      error: (err) => alert('Không thể gửi bình luận: ' + err.message)
    });
  }

  deleteComment(post: any, commentId: number) {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    this.postService.deleteComment(commentId).subscribe({
      next: () => {
        post.comments = post.comments.filter((c: any) => c.id !== commentId);
        post.commentCount--;
      },
      error: (err) => alert('Lỗi xóa comment: ' + err.message)
    });
  }
}