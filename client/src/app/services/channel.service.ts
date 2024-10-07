import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { Channel } from '../models/channel.model';
import { AuthService } from './auth.service';
import { Message } from '../models/chat-message.model';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  private baseUrl = 'http://localhost:3000/api/channels';

  constructor(private http: HttpClient, private authService: AuthService) {}

  createChannel(groupId: string, name: string): Observable<Channel | null> {
    const headers = this.buildHeaders();
    return this.http.post<{ success: boolean, channel: Channel }>(`${this.baseUrl}/${groupId}/channels`, { name }, { headers }).pipe(
      map(response => response.success ? response.channel : null),
      catchError(error => {
        console.error('Failed to create channel', error);
        return of(null); // Return null if channel creation fails
      })
    );
  }  
  
  getChannels(groupId: string): Observable<Channel[]> {
    return this.http.get<{ channels: Channel[] }>(`${this.baseUrl}/${groupId}`, {
      headers: this.buildHeaders() // Ensure headers are built correctly
    }).pipe(
      map(response => response.channels || []),
      catchError(error => {
        console.error('Failed to fetch channels:', error);
        return of([]); // Return an empty array on failure
      })
    );
  }
  

  // Adjusted to use `string` for `groupId` and `channelId`
  deleteChannel(groupId: string, channelId: string): Observable<void> {
    const headers = this.buildHeaders();
    return this.http.delete<void>(`${this.baseUrl}/${groupId}/channels/${channelId}`, { headers }).pipe(
      catchError(error => {
        console.error('Failed to delete channel', error);
        return of(); // Return void on failure
      })
    );
  }

  // Get all channels for chat purposes
  getChannelsForChat(userId: string): Observable<Channel[]> {
    const headers = this.buildHeaders();
    return this.http.get<{ channels: Channel[] }>(`${this.baseUrl}/${userId}`, { headers }).pipe(
      map(response => response.channels),
      catchError(error => {
        console.error('Failed to fetch channels for chat', error);
        return of([]); // Return empty array if channels can't be fetched
      })
    );
  }

  // Update messages in a channel
  updateChannelMessages(channelId: string, messages: Message[]): Observable<boolean> {
    const headers = this.buildHeaders();
    return this.http.put<{ success: boolean }>(`${this.baseUrl}/${channelId}/messages`, { messages }, { headers }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Failed to update messages for channel', error);
        return of(false); // Return false if updating messages fails
      })
    );
  }

  // Build HTTP headers for requests
  private buildHeaders(): HttpHeaders {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not logged in');  // Throw an error or handle appropriately
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'user-id': user._id.toString(),  // Safe to use after check
      'user-roles': JSON.stringify(user.roles)
    });
  }
}
