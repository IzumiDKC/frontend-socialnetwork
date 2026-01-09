import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { WebSocketService } from '../app/services/websocket.service';
import { BasePostComponent } from '../app/shared/base/base-post.component'; 

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent extends BasePostComponent implements OnInit, OnDestroy {
  // Home Specific
  followingIds: number[] = [];
  
  // Search
  searchTerm = '';
  searchResults: any[] = [];
  private searchSubject = new Subject<string>();

  // Post Feed
  posts: any[] = [];
  newPostContent: string = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  // Notification
  notifications: any[] = [];
  unreadCount: number = 0;
  showNotifications: boolean = false;
  showToastData: any = null;

  // Delete Modal
  showDeleteModal: boolean = false;
  postIdToDelete: number | null = null;

  constructor(private webSocketService: WebSocketService) {
    super();
  }

   ngOnInit() {
    this.loadFeed();
    this.setupSearch();
  }

  protected override onUserLoaded() {
    this.refreshFollowing();
    if (this.myId) {
      this.webSocketService.connect(this.myId);
      this.webSocketService.notificationSubject.subscribe((noti: any) => {
        this.handleNewNotification(noti);
      });
    }
  }

  override ngOnDestroy() {
    this.webSocketService.disconnect();
    super.ngOnDestroy();
  }

  loadFeed() {
    this.postService.getFeed().subscribe((data: any[]) => {
      this.posts = data.map(post => ({
        ...post,
        showComments: false,
        showMenu: false,
        comments: [],
        newCommentInput: ''
      }));
    });
  }

  onLikePost(post: any) {
    this.handleLikePost(post);
  }

  toggleComments(post: any) {
    post.showComments = !post.showComments;
    if (post.showComments) {
      this.loadComments(post);
    }
  }

  loadComments(post: any) {
    this.commentService.getCommentsByPostId(post.id).subscribe({
      next: (flatComments: any[]) => {
        post.comments = this.buildCommentTree(flatComments);
      },
      error: (err: any) => console.error('Lỗi tải comment:', err)
    });
  }

  deleteComment(post: any, commentId: number) {
    this.handleDeleteComment(post, commentId, post.comments);
  }

  // Home Specific

  createPost() {
    if (!this.newPostContent.trim() && !this.selectedFile) return;

    this.postService.createPost(this.newPostContent, this.selectedFile).subscribe({
      next: (res) => {
        console.log('Đăng thành công', res);
        this.newPostContent = '';
        this.selectedFile = null;
        this.previewUrl = null;
        this.loadFeed();
      },
      error: (err) => console.error('Lỗi đăng bài', err)
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => this.previewUrl = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  submitComment(post: any) {
    const content = post.newCommentInput?.trim();
    if (!content) return;

    this.commentService.createComment(post.id, { content }).subscribe({
      next: (savedComment: any) => {
        const commentToDisplay = {
          ...savedComment,
          username: this.myUsername,
          fullName: this.myFullName,
          avatarUrl: this.myAvatarUrl,
          children: []
        };
        if (!post.comments) post.comments = [];
        post.comments.unshift(commentToDisplay);
        post.commentCount++;
        post.newCommentInput = '';
      },
      error: (err: any) => alert('Lỗi gửi: ' + err.message)
    });
  }

  submitReply(post: any, parentId: number) {
    if (!this.replyContent.trim()) return;

    this.commentService.createComment(post.id, { content: this.replyContent, parentId }).subscribe({
      next: (savedReply: any) => {
        const replyToDisplay = {
          ...savedReply,
          username: this.myUsername,
          fullName: this.myFullName,
          avatarUrl: this.myAvatarUrl,
          children: []
        };
        this.addReplyToTree(post.comments, parentId, replyToDisplay);
        post.commentCount++;
        this.cancelReply();
      },
      error: (err: any) => alert('Lỗi: ' + err.message)
    });
  }

  handleNewNotification(noti: any) {
    this.notifications.unshift(noti);
    this.unreadCount++;
    this.showToast(noti);
  }

  toggleNotificationPanel() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) this.unreadCount = 0;
  }

  showToast(noti: any) {
    this.showToastData = noti;
    setTimeout(() => this.showToastData = null, 3000);
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

  togglePostMenu(post: any) {
    this.posts.forEach((p: any) => { if (p !== post) p.showMenu = false; });
    post.showMenu = !post.showMenu;
  }

  onDeleteRequest(post: any) {
    this.postIdToDelete = post.id;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.postIdToDelete = null;
  }

  confirmDelete() {
    if (this.postIdToDelete) {
      this.postService.deletePost(this.postIdToDelete).subscribe({
        next: () => {
          this.posts = this.posts.filter(p => p.id !== this.postIdToDelete);
          this.closeDeleteModal();
          this.showToast({ senderName: '', content: 'Đã chuyển bài viết vào thùng rác.' });
        },
        error: (err) => {
          console.error("Lỗi xóa bài:", err);
          this.showToast({ senderName: 'Lỗi', content: 'Có lỗi xảy ra.' });
          this.closeDeleteModal();
        }
      });
    }
  }
}