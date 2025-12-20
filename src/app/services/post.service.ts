import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private baseUrl = '/api/posts';

  constructor(private http: HttpClient) {}

  // Lấy Feed (Đã sửa URL thành /feed theo backend)
  getFeed(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/feed`);
  }

  // Đăng bài mới
  createPost(content: string): Observable<any> {
    return this.http.post(this.baseUrl, { content });
  }
}