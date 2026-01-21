import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RxStomp } from '@stomp/rx-stomp';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = '/api/posts';
  
  // Đối tượng quản lý WebSocket
  private rxStomp: RxStomp;

  constructor(private http: HttpClient) {
    // 1. Khởi tạo cấu hình WebSocket ngay khi Service được tạo
    this.rxStomp = new RxStomp();
    this.rxStomp.configure({
      // Đường dẫn tới WebSocket Endpoint của Backend
      brokerURL: 'ws://localhost:8084/ws',
      
      // Tự động kết nối lại sau 200ms nếu bị đứt
      reconnectDelay: 200,
      
      // Gửi kèm Token để Backend biết ai đang kết nối (Quan trọng)
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`
      },

      // Debug log (tắt đi khi chạy production)
      debug: (msg: string) => {
        console.log(new Date(), msg);
      },
    });

    // Kích hoạt kết nối
    this.rxStomp.activate();
  }

  // ==========================================
  // PHẦN 1: HTTP API (REST)
  // ==========================================

  /**
   * Gọi API báo cho Backend biết User đã đọc tin nhắn trong cuộc hội thoại
   * Backend sẽ: Update DB -> Reset unread count -> Bắn socket thông báo cho người kia
   */
  markAsSeen(chatId: string, userId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/mark-seen`, { chatId, userId });
  }

  /**
   * Lấy lịch sử tin nhắn của một cuộc hội thoại (khi F5 hoặc mới mở chat)
   */
  getChatHistory(chatId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/history/${chatId}`);
  }

  /**
   * Lấy danh sách các cuộc hội thoại của User (cho Sidebar bên trái)
   */
  getUserConversations(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/conversations/${userId}`);
  }

  // ==========================================
  // PHẦN 2: WEBSOCKET (REAL-TIME)
  // ==========================================

  /**
   * Gửi tin nhắn mới lên Server
   */
  sendMessage(senderId: string, recipientId: string, content: string, chatId: string) {
    const messagePayload = {
      senderId: senderId,
      recipientId: recipientId,
      content: content,
      chatId: chatId,
      timestamp: new Date()
    };

    this.rxStomp.publish({
      destination: '/app/chat', // Khớp với @MessageMapping("/chat") ở Backend
      body: JSON.stringify(messagePayload)
    });
  }

  /**
   * Lắng nghe tin nhắn đến (bao gồm tin nhắn mới & thông báo đã xem)
   * Backend gửi về: /user/queue/messages
   */
  watchMessages(): Observable<any> {
    return this.rxStomp.watch('/user/queue/messages').pipe(
      map((message) => {
        try {
          return JSON.parse(message.body);
        } catch (e) {
          console.error('Lỗi parse JSON từ socket:', e);
          return null;
        }
      })
    );
  }

  /**
   * Ngắt kết nối khi đăng xuất (Optional)
   */
  disconnect() {
    this.rxStomp.deactivate();
  }
}