import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Channel } from '../models/channel.model';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  private baseUrl = 'http://localhost:3000/api/channels'; // Replace with your API URL

  constructor(private http: HttpClient) {}

  getChannelDetails(channelId: string): Observable<Channel> {
    return this.http.get<Channel>(`${this.baseUrl}/${channelId}`).pipe(
      catchError(this.handleError<Channel>('getChannelDetails'))
    );
  }

  createChannel(groupId: string, name: string): Observable<Channel> {
    return this.http.post<Channel>(`${this.baseUrl}/groups/${groupId}/channels`, { name }).pipe(
      catchError(this.handleError<Channel>('createChannel'))
    );
  }

  deleteChannel(channelId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${channelId}`).pipe(
      catchError(this.handleError<any>('deleteChannel'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return of(result as T);
    };
  }
}
