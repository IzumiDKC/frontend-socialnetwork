import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private baseUrl = '/api/posts';

  constructor(private http: HttpClient) { }

  getCommentsByPostId(postId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${postId}/comments`);
  }

  createComment(postId: number, payload: { content: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${postId}/comments`, payload);
  }

  deleteComment(commentId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/comments/${commentId}`, { responseType: 'text' });
  }
}