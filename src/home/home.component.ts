import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KeycloakService } from 'keycloak-angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { UserService } from '../app/./services/user.service';
import { PostService } from '../app/./services/post.service';
import { WebSocketService } from '../app/./services/websocket.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  // --- Biến User ---
  myUsername = '';
  myId: number | null = null;
  followingIds: number[] = [];
  myAvatarUrl: string | null = null;

  // --- Biến Search ---
  searchTerm = '';
  searchResults: any[] = [];
  private searchSubject = new Subject<string>();

  // --- Biến Post ---
  posts: any[] = [];
  newPostContent: string = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  // --- Biến Reply ---
  activeReplyCommentId: number | null = null;
  replyContent: string = '';

  // --- Biến Notification ---
  notifications: any[] = [];
  unreadCount: number = 0;
  showNotifications: boolean = false;
  showToastData: any = null; // Dùng để hiện thông báo nổi (Toast)

  myFullName = '';

  showDeleteModal: boolean = false;
  postIdToDelete: number | null = null;

  constructor(
    private keycloak: KeycloakService,
    private userService: UserService,
    private postService: PostService,
    private webSocketService: WebSocketService
  ) { }


  async ngOnInit() {
    const profile = await this.keycloak.loadUserProfile();
    this.myUsername = profile.username || '';

    if (this.myUsername) {
      this.userService.getUserInfo(this.myUsername).subscribe({
        next: (user: any) => {
          this.myId = user.id;
          this.myAvatarUrl = user.avatarUrl;
          this.myFullName = user.fullName || user.username;
          this.refreshFollowing();

          if (this.myId) {
            this.webSocketService.connect(this.myId);

            this.webSocketService.notificationSubject.subscribe((noti: any) => {
              this.handleNewNotification(noti);
            });
          }
        },
        error: (err: any) => console.error('Lỗi lấy info user:', err)
      });
    }

    this.loadFeed();
    this.setupSearch();
  }

  ngOnDestroy() {
    // Ngắt kết nối khi rời trang (tùy chọn, thường thì để App Component quản lý tốt hơn)
    this.webSocketService.disconnect();
  }

  handleNewNotification(noti: any) {
    this.notifications.unshift(noti);
    this.unreadCount++;
    this.showToast(noti);
  }

  toggleNotificationPanel() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.unreadCount = 0;
    }
  }

  showToast(noti: any) {
    this.showToastData = noti;
    // Tự động ẩn Toast sau 3 giây
    setTimeout(() => {
      this.showToastData = null;
    }, 3000);
  }

  //TÌM KIẾM & FOLLOW
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

  // QUẢN LÝ POST

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

  createPost() {
    if (!this.newPostContent.trim() && !this.selectedFile) {
      return;
    }

    this.postService.createPost(this.newPostContent, this.selectedFile).subscribe({
      next: (res) => {
        console.log('Đăng thành công', res);
        this.newPostContent = '';
        this.selectedFile = null;
        this.previewUrl = null;

        this.loadFeed();
      },
      error: (err) => {
        console.error('Lỗi đăng bài', err);
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
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

  togglePostMenu(post: any) {
    this.posts.forEach((p: any) => {
      if (p !== post) p.showMenu = false;
    });
    post.showMenu = !post.showMenu;
  }

  deletePost(post: any) {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;

    this.postService.deletePost(post.id).subscribe({
      next: () => {
        alert('Đã xóa bài viết.');
        this.posts = this.posts.filter((p: any) => p.id !== post.id);
      },
      error: (err: any) => {
        console.error(err);
        alert('Lỗi khi xóa bài viết: ' + (err.message || err));
      }
    });
  }

  // QUẢN LÝ COMMENTS

  toggleComments(post: any) {
    post.showComments = !post.showComments;
    if (post.showComments) {
      this.loadComments(post);
    }
  }

  loadComments(post: any) {
    this.postService.getComments(post.id).subscribe({
      next: (flatComments: any[]) => {
        post.comments = this.buildCommentTree(flatComments);
      },
      error: (err: any) => console.error('Lỗi tải comment:', err)
    });
  }

  // Hàm helper: Flat List -> Tree
  buildCommentTree(flatComments: any[]): any[] {
    const map = new Map();
    const roots: any[] = [];

    // Khởi tạo map
    flatComments.forEach(c => {
      c.children = [];
      map.set(c.id, c);
    });

    // Xếp con vào cha
    flatComments.forEach(c => {
      if (c.parentId) {
        const parent = map.get(c.parentId);
        if (parent) {
          parent.children.push(c);
        } else {
          // Nếu có parentId nhưng không tìm thấy cha (lỗi data), cho làm root
          roots.push(c);
        }
      } else {
        roots.push(c); // Không có parentId -> Là root
      }
    });

    return roots;
  }

  //  XỬ LÝ REPLY & COMMENTS

  initReply(comment: any) {
    this.activeReplyCommentId = comment.id;
    this.replyContent = '';

    // Logic @Username: Nếu comment không phải của mình thì tự điền @Ten
    if (comment.username !== this.myUsername) {
      this.replyContent = `@${comment.username} `;
    }
  }

  // Hủy trả lời
  cancelReply() {
    this.activeReplyCommentId = null;
    this.replyContent = '';
  }

  submitReply(post: any, parentId: number) {
    if (!this.replyContent.trim()) return;

    // Gọi API tạo comment với parentId
    this.postService.createComment(post.id, this.replyContent, parentId).subscribe({
      next: (savedReply: any) => {
        // Tạo object hiển thị ngay lập tức (Fake UI update)
        const replyToDisplay = {
          ...savedReply,
          username: this.myUsername,
          fullName: this.myFullName,
          avatarUrl: this.myAvatarUrl,
          children: []
        };

        // Thêm vào cây comment
        this.addReplyToTree(post.comments, parentId, replyToDisplay);

        post.commentCount++;
        this.cancelReply();
      },
      error: (err: any) => alert('Lỗi gửi trả lời: ' + (err.message || err))
    });
  }

  // Helper: Tìm node cha và push con vào (Đệ quy)
  addReplyToTree(nodes: any[], parentId: number, newChild: any) {
    for (const node of nodes) {
      if (node.id === parentId) {
        if (!node.children) node.children = [];
        node.children.push(newChild);
        return;
      }
      if (node.children && node.children.length > 0) {
        this.addReplyToTree(node.children, parentId, newChild);
      }
    }
  }

  submitComment(post: any) {
    const content = post.newCommentInput?.trim();
    if (!content) return;

    // ParentId là null cho comment gốc
    this.postService.createComment(post.id, content, null).subscribe({
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
      error: (err: any) => alert('Không thể gửi bình luận: ' + (err.message || err))
    });
  }

  // XÓA COMMENT

  deleteComment(post: any, commentId: number) {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    this.postService.deleteComment(commentId).subscribe({
      next: () => {
        // Xóa node khỏi cây
        this.removeNodeFromTree(post.comments, commentId);

        // Giảm số lượng
        post.commentCount--;
      },
      error: (err: any) => alert('Lỗi xóa comment: ' + (err.message || err))
    });
  }

  // Helper: Xóa node khỏi cây
  removeNodeFromTree(nodes: any[], idToRemove: number): boolean {
    const index = nodes.findIndex(n => n.id === idToRemove);
    if (index !== -1) {
      nodes.splice(index, 1);
      return true;
    }
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        const deleted = this.removeNodeFromTree(node.children, idToRemove);
        if (deleted) return true;
      }
    }
    return false;
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
          this.postIdToDelete = null;

          this.showToast({
            senderName: '',
            content: 'Đã chuyển bài viết vào thùng rác.'
          });
        },
        error: (err) => {
          console.error("Lỗi xóa bài:", err);
          this.showToast({
            senderName: 'Lỗi',
            content: 'Có lỗi xảy ra, vui lòng thử lại.'
          });
          this.closeDeleteModal();
        }
      });
    }
  }
}