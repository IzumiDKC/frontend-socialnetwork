import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  private baseUrl = '/api/game'; 

  constructor(private http: HttpClient) { }

  getMyFarm(): Observable<any> {
    return this.http.get(`${this.baseUrl}/farm`);
  }

  plantSeed(slotId: number, seedType: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/plant`, {}, {
      params: { slotId: slotId.toString(), seedType: seedType }
    });
  }
  harvest(slotId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/harvest`, {}, {
      params: { slotId: slotId.toString() }
    });
  }
  removePlant(slotId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/remove`, {}, {
      params: { slotId: slotId.toString() }
    });
  }
  getGameConfig(): Observable<any> {
    return this.http.get(`${this.baseUrl}/config`);
  }
}