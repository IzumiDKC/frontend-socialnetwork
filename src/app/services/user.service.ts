import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = '/api/users';

  constructor(private http: HttpClient) {}

  getMyUserId(username: string): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/search?username=${username}`);
  }

  searchUsers(query: string): Observable<any[]> {
    if (!query.trim()) return new Observable(observer => observer.next([]));
    return this.http.get<any[]>(`${this.baseUrl}/search-list?query=${query}`);
  }

  getFollowingIds(myId: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl}/${myId}/following-ids`);
  }

  followUser(sourceId: number, targetId: number): Observable<string> {
    return this.http.post(
      `${this.baseUrl}/${sourceId}/follow/${targetId}`,
      {},
      { responseType: 'text' } 
    );
  }
}