import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message } from '../models/chat-message.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getMessages(groupId: number, channelId: number): Observable<{ messages: Message[] }> {
    return this.http.get<{ messages: Message[] }>(`${this.baseUrl}/${groupId}/channels/${channelId}/messages`);
  }

  sendMessage(groupId: number, channelId: number, content: string): Observable<Message> {
    const sender = this.authService.getCurrentUser().username;
    return this.http.post<Message>(`${this.baseUrl}/${groupId}/channels/${channelId}/messages`, { content, sender });
  }
}
