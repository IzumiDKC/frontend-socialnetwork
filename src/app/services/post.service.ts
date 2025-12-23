import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private baseUrl = '/api/posts';

  constructor(private http: HttpClient) {}

  getFeed(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/feed`);
  }

  createPost(content: string): Observable<any> {
    return this.http.post(this.baseUrl, { content });
  }
  likePost(postId: number): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/${postId}/like`, {});
  }
  
  getComments(postId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${postId}/comments`);
  }

  createComment(postId: number, content: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${postId}/comments`, { content });
  }

  deleteComment(commentId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/comments/${commentId}`, { responseType: 'text' });
  }
}
