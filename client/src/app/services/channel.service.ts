import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Channel } from '../models/channel.model';
import { AuthService } from './auth.service';
import { Message } from '../models/chat-message.model';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  private baseUrl = 'http://localhost:3000/api/channels';

  constructor(private http: HttpClient, private authService: AuthService) {}

  createChannel(groupId: number, name: string): Observable<Channel> {
    const headers = this.buildHeadersForGroup(groupId);
    return this.http.post<{ success: boolean, channel: Channel }>(`${this.baseUrl}/${groupId}/channels`, { name }, { headers }).pipe(
      tap((response) => {
        this.updateGroupInLocalStorage(groupId, response.channel);
      }),
      map(response => response.channel)
    );
  }  
  
  getChannels(groupId: number): Observable<Channel[]> {
    const headers = this.buildHeadersForGroup(groupId);
    return this.http.get<{ channels: Channel[] }>(`${this.baseUrl}/${groupId}`, { headers }).pipe(
      map(response => response.channels)  // Map to the channels array directly
    );
  }

  deleteChannel(groupId: number, channelId: number): Observable<void> {
    const headers = this.buildHeadersForGroup(groupId);
    return this.http.delete<void>(`${this.baseUrl}/${groupId}/channels/${channelId}`, { headers }).pipe(
      tap(() => {
        this.removeChannelFromGroupInLocalStorage(groupId, channelId);
      })
    );
  }

  private buildHeadersForGroup(groupId: number): HttpHeaders {
    const groupsJson = localStorage.getItem('groups');
    const groups = groupsJson ? JSON.parse(groupsJson) : [];
    const group = groups.find((g: any) => g.id === groupId);

    if (!group) {
      throw new Error(`Group with ID ${groupId} not found in local storage`);
    }

    const user = this.authService.getCurrentUser();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'group-data': JSON.stringify(group),
      'user-roles': JSON.stringify(user?.roles || []),
      'user-id': user?.id || ''
    });
  }

  private updateGroupInLocalStorage(groupId: number, channel: Channel): void {
    const groupsJson = localStorage.getItem('groups');
    const groups = groupsJson ? JSON.parse(groupsJson) : [];
    const groupIndex = groups.findIndex((g: any) => g.id === groupId);
  
    if (groupIndex !== -1) {
      groups[groupIndex].channels.push(channel);
      localStorage.setItem('groups', JSON.stringify(groups));
      console.log('Updated groups in local storage:', groups);
    }
  }

  private removeChannelFromGroupInLocalStorage(groupId: number, channelId: number): void {
    const groupsJson = localStorage.getItem('groups');
    const groups = groupsJson ? JSON.parse(groupsJson) : [];
    const groupIndex = groups.findIndex((g: any) => g.id === groupId);

    if (groupIndex !== -1) {
      groups[groupIndex].channels = groups[groupIndex].channels.filter((c: Channel) => c.id !== channelId);
      localStorage.setItem('groups', JSON.stringify(groups));
      console.log('Updated groups in local storage after channel deletion:', groups);
    }
  }

  getChannelsForChat(): Observable<Channel[]> {
    const groupsJson = localStorage.getItem('groups');
    const groups = groupsJson ? JSON.parse(groupsJson) : [];
    let channels: Channel[] = [];
    groups.forEach((group: any) => {
      channels = channels.concat(group.channels);
    });
    return of(channels);
  }

  updateChannelMessages(channelId: number, messages: Message[]): void {
    const groupsJson = localStorage.getItem('groups');
    const groups = groupsJson ? JSON.parse(groupsJson) : [];
    const group = groups.find((g: any) => g.channels.some((c: any) => c.id === channelId));
  
    if (group) {
      const channel = group.channels.find((c: any) => c.id === channelId);
      if (channel) {
        if (!channel.messages) {
          channel.messages = []; // Ensure the messages array exists
        }
        channel.messages = messages;
        localStorage.setItem('groups', JSON.stringify(groups));
      }
    }
  }
}
