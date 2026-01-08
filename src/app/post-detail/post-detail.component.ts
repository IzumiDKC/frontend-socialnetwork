import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KeycloakService } from 'keycloak-angular';

import { PostService } from '../services/post.service';
import { CommentService } from '../services/comment.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css']
})
export class PostDetailComponent implements OnInit {
  postId: any;
  post: any = null;
  comments: any[] = [];
  newCommentContent: string = '';
  isLoading = true;

  // --- Biến User ---
  myId: number | null = null;
  myUsername: string = '';
  myFullName: string = '';
  myAvatarUrl: string | null = null;

  // --- Biến Reply ---
  activeReplyCommentId: number | null = null;
  replyContent: string = '';

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private commentService: CommentService,
    private userService: UserService,
    private keycloak: KeycloakService
  ) { }

  async ngOnInit() {
    this.postId = this.route.snapshot.paramMap.get('id');

    try {
      const profile = await this.keycloak.loadUserProfile();
      this.myUsername = profile.username || '';

      if (this.myUsername) {
        this.userService.getUserInfo(this.myUsername).subscribe({
          next: (user: any) => {
            this.myId = user.id;
            this.myAvatarUrl = user.avatarUrl;
            this.myFullName = user.fullName || user.username;
          }
        });
      }
    } catch (e) {
      console.error('Lỗi load user profile', e);
    }

    if (this.postId) {
      this.loadPostData();
      this.loadComments();
    }
  }

  loadPostData() {
    this.postService.getPostById(this.postId).subscribe({
      next: (data) => {
        this.post = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi tải bài:', err);
        this.isLoading = false;
      }
    });
  }

  loadComments() {
    this.commentService.getCommentsByPostId(this.postId).subscribe({
      next: (flatComments: any[]) => {
        this.comments = this.buildCommentTree(flatComments);
      },
      error: (err) => console.error(err)
    });
  }

  // --- LOGIC TREE ---
  buildCommentTree(flatComments: any[]): any[] {
    const map = new Map();
    const roots: any[] = [];

    flatComments.forEach(c => {
      c.children = [];
      map.set(c.id, c);
    });

    flatComments.forEach(c => {
      if (c.parentId) {
        const parent = map.get(c.parentId);
        if (parent) {
          parent.children.push(c);
        } else {
          roots.push(c);
        }
      } else {
        roots.push(c);
      }
    });
    return roots;
  }

  toggleLike() {
    if (!this.post) return;
    this.postService.likePost(this.post.id).subscribe({
      next: (newLikeCount: number) => {
        this.post.likeCount = newLikeCount;
        this.post.likedByCurrentUser = !this.post.likedByCurrentUser;
      },
      error: (err) => console.error('Lỗi like:', err)
    });
  }

  // --- GỬI COMMENT GỐC ---
  sendComment() {
    if (!this.newCommentContent.trim()) return;
    const payload = { content: this.newCommentContent };

    this.commentService.createComment(this.postId, payload).subscribe({
      next: (savedComment: any) => {
        const displayComment = {
          ...savedComment,
          username: this.myUsername,
          fullName: this.myFullName,
          avatarUrl: this.myAvatarUrl,
          children: []
        };

        this.comments.unshift(displayComment);
        this.post.commentCount++;
        this.newCommentContent = '';
      },
      error: (err) => console.error('Lỗi comment:', err)
    });
  }

  // --- LOGIC REPLY---
  initReply(comment: any) {
    this.activeReplyCommentId = comment.id;
    this.replyContent = '';

    // Auto tag tên người được reply
    const targetName = comment.fullName || comment.username;
    if (comment.username !== this.myUsername) {
      this.replyContent = `@${targetName} `;
    }
  }

  cancelReply() {
    this.activeReplyCommentId = null;
    this.replyContent = '';
  }

  submitReply(parentId: number) {
    if (!this.replyContent.trim()) return;

    const payload = { content: this.replyContent, parentId: parentId };

    this.commentService.createComment(this.postId, payload).subscribe({
      next: (savedReply: any) => {
        const replyToDisplay = {
          ...savedReply,
          username: this.myUsername,
          fullName: this.myFullName,
          avatarUrl: this.myAvatarUrl,
          children: []
        };

        this.addReplyToTree(this.comments, parentId, replyToDisplay);
        this.post.commentCount++;
        this.cancelReply();
      },
      error: (err) => alert('Lỗi gửi trả lời: ' + err.message)
    });
  }

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

  // --- LOGIC DELETE ---
  deleteComment(commentId: number) {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        if (this.removeNodeFromTree(this.comments, commentId)) {
          this.post.commentCount--;
        }
      },
      error: (err) => alert('Lỗi xóa comment: ' + err.message)
    });
  }

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
}