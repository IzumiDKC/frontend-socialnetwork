import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 

import { PostService } from '../services/post.service';
import { CommentService } from '../services/comment.service';

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

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private commentService: CommentService
  ) {}

  ngOnInit(): void {
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
      next: (data) => {
        this.comments = data;
      },
      error: (err) => console.error(err)
    });
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

  sendComment() {
    if (!this.newCommentContent.trim()) return;
    const payload = { content: this.newCommentContent };
    
    this.commentService.createComment(this.postId, payload).subscribe({
      next: (savedComment) => {
        this.comments.unshift(savedComment);
        this.post.commentCount++;
        this.newCommentContent = '';
      },
      error: (err) => console.error('Lỗi comment:', err)
    });
  }
}