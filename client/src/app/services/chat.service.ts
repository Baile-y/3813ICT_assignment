import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Message } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = 'http://localhost:3000/api/channels'; // Replace with your API URL

  constructor(private http: HttpClient) {}

  getMessages(channelId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/${channelId}/messages`).pipe(
      catchError(this.handleError<Message[]>('getMessages', []))
    );
  }

  sendMessage(channelId: string, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.baseUrl}/${channelId}/messages`, { content }).pipe(
      catchError(this.handleError<Message>('sendMessage'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return of(result as T);
    };
  }
}
