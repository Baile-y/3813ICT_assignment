import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Group } from '../models/group.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private baseUrl = 'http://localhost:3000/api/admin'; // Replace with your API URL

  constructor(private http: HttpClient) {}

  isSuperAdmin(): boolean {
    // Logic to determine if the current user is a super admin
    return true; // Replace with actual logic
  }

  createGroup(name: string): Observable<Group> {
    return this.http.post<Group>(`${this.baseUrl}/groups`, { name }).pipe(
      catchError(this.handleError<Group>('createGroup'))
    );
  }

  createChannel(groupId: string, name: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/groups/${groupId}/channels`, { name }).pipe(
      catchError(this.handleError<any>('createChannel'))
    );
  }

  manageUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`).pipe(
      catchError(this.handleError<User[]>('manageUsers', []))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      return of(result as T);
    };
  }
}
