import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Message } from '../models/chat-message.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messages: Message[] = [];

  constructor() {}

  // Simulate fetching messages from a backend or in-memory storage
  getMessages(): Observable<Message[]> {
    return of(this.messages);
  }

  // Simulate saving a message
  saveMessage(message: Message): Observable<void> {
    this.messages.push(message);
    return of();
  }
}
