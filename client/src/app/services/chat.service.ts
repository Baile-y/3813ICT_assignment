import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ChatMessage } from '../models/chat-message.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messages: ChatMessage[] = [];

  constructor() {}

  // Simulate fetching messages from a backend or in-memory storage
  getMessages(): Observable<ChatMessage[]> {
    return of(this.messages);
  }

  // Simulate saving a message
  saveMessage(message: ChatMessage): Observable<void> {
    this.messages.push(message);
    return of();
  }
}
