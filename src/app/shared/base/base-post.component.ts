// src/app/shared/base/base-post.component.ts
import { Component, inject, OnDestroy } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { UserService } from '../../services/user.service';
import { PostService } from '../../services/post.service';
import { CommentService } from '../../services/comment.service';
import { CommentUtils } from '../utils/comment.utils';

@Component({
  template: ''
})
export abstract class BasePostComponent implements OnDestroy {
  // --- Services ---
  protected keycloakService = inject(KeycloakService);
  protected userService = inject(UserService);
  protected postService = inject(PostService);
  protected commentService = inject(CommentService);

  // --- Shared Data ---
  myId: number | null = null;
  myUsername: string = '';
  myFullName: string = '';
  myAvatarUrl: string | null = null;

  // --- Reply State ---
  activeReplyCommentId: number | null = null;
  replyContent: string = '';

  constructor() {
    this.loadCurrentUser();
  }

  // Load User Info
  async loadCurrentUser() {
    try {
      const isLoggedIn = await this.keycloakService.isLoggedIn();
      if (!isLoggedIn) return;

      const profile = await this.keycloakService.loadUserProfile();
      this.myUsername = profile.username || '';

      if (this.myUsername) {
        this.userService.getUserInfo(this.myUsername).subscribe({
          next: (user: any) => {
            this.myId = user.id;
            this.myAvatarUrl = user.avatarUrl;
            this.myFullName = user.fullName || user.username;
            this.onUserLoaded(); 
          },
          error: (err) => console.error('Lỗi load user info:', err)
        });
      }
    } catch (e) {
      console.error('Lỗi Keycloak:', e);
    }
  }

  protected onUserLoaded() {}

  protected buildCommentTree(flat: any[]) {
    return CommentUtils.buildCommentTree(flat);
  }

  protected addReplyToTree(nodes: any[], parentId: number, child: any) {
    return CommentUtils.addReplyToTree(nodes, parentId, child);
  }

  protected removeNodeFromTree(nodes: any[], id: number) {
    return CommentUtils.removeNodeFromTree(nodes, id);
  }

  // UI Helpers
  initReply(comment: any) {
    this.activeReplyCommentId = comment.id;
    this.replyContent = '';
    
    // Auto tag
    const targetName = comment.fullName || comment.username;
    if (comment.username !== this.myUsername) {
      this.replyContent = `@${targetName} `;
    }
  }

  cancelReply() {
    this.activeReplyCommentId = null;
    this.replyContent = '';
  }

  // Shared API Actions
  handleLikePost(post: any) {
    if (!post) return;
    this.postService.likePost(post.id).subscribe({
      next: (newLikeCount: number) => {
        post.likeCount = newLikeCount;
        post.likedByCurrentUser = !post.likedByCurrentUser;
      },
      error: (err) => console.error('Lỗi like:', err)
    });
  }

  handleDeleteComment(post: any, commentId: number, commentsList: any[]) {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        if (this.removeNodeFromTree(commentsList, commentId)) {
          post.commentCount--;
        }
      },
      error: (err) => alert('Lỗi xóa comment: ' + (err.message || err))
    });
  }

  ngOnDestroy(): void {}
}