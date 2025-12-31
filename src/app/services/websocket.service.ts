import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  
  public notificationSubject = new Subject<any>();

  constructor() {}

  connect(userId: number) {
    if (this.stompClient && this.stompClient.active) return;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`http://localhost:8084/ws?userId=${userId}`),
  
      reconnectDelay: 5000,
      debug: (str) => console.log(str),

      onConnect: () => {
        console.log(`--- Connected Private WebSocket for User: ${userId} ---`);
        this.stompClient?.subscribe('/user/queue/notifications', (message: Message) => {
            if (message.body) {
              this.notificationSubject.next(JSON.parse(message.body));
            }
        });
      }
    });
    this.stompClient.activate();
  }

  disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }
}