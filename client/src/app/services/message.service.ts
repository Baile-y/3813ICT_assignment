import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Message } from '../models/chat-message.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private baseUrl = 'http://localhost:3000/api/channels';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Send a message
  sendMessage(message: Message): Observable<any> {
    const headers = this.buildHeaders(); // Use buildHeaders() to get the headers
    return this.http.post(`${this.baseUrl}/messages`, message, { headers });
  }
  
  // Get messages for a channel
  getMessagesForChannel(channelId: string): Observable<Message[]> {
    const headers = this.buildHeaders(); // Add headers
    return this.http.get<Message[]>(`${this.baseUrl}/channels/${channelId}/messages`, { headers });
  }  

  uploadImageWithMessage(formData: FormData) {
    return this.http.post<{ success: boolean, message: any }>('http://localhost:3000/api/channels/message', formData);
  }
  
  // Build HTTP headers for requests
  private buildHeaders(): HttpHeaders {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not logged in'); // Throw an error or handle appropriately
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'user-id': user._id.toString(), // MongoDB ObjectId as string
      'user-roles': JSON.stringify(user.roles)
    });
  }
  
}
