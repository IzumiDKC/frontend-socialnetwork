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

  createPost(content: string, file: File | null): Observable<any> {
    const formData = new FormData();
    
    formData.append('content', content);

    if (file) {
      formData.append('file', file);
    }

    return this.http.post(this.baseUrl, formData);
  }
  likePost(postId: number): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/${postId}/like`, {});
  }
  
  getComments(postId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${postId}/comments`);
  }

  createComment(postId: number, content: string, parentId: number | null = null): Observable<any> {
    return this.http.post(`${this.baseUrl}/${postId}/comments`, { content, parentId });
  }

  deleteComment(commentId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/comments/${commentId}`, { responseType: 'text' });
  }

  deletePost(postId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${postId}`, { responseType: 'text' });
  }

  getPostsByUserId(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user/${userId}`);
  }

  getPostById(id: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }
}
