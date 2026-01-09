import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BasePostComponent } from '../shared/base/base-post.component'; 

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css']
})
export class PostDetailComponent extends BasePostComponent implements OnInit {
  postId: any;
  post: any = null;
  comments: any[] = [];
  newCommentContent: string = '';
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private location: Location
  ) {
    super(); 
  }

   ngOnInit() {
    this.postId = this.route.snapshot.paramMap.get('id');

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

  // --- ACTIONS  ---

  toggleLike() {
    this.handleLikePost(this.post);
  }

  deleteComment(commentId: number) {
    this.handleDeleteComment(this.post, commentId, this.comments);
  }

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

  // --- NAVIGATION ---
  
  goBack(): void {
    this.location.back(); 
  }

  @HostListener('document:keydown.escape')
  onKeydownHandler() {
    this.goBack();
  }
}