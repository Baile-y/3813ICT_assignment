import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Group } from '../models/group.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private baseUrl = 'http://localhost:3000/api/groups'; // API URL matching your server.js

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Helper method to get headers with JWT token
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken(); 
    console.log('JWT Token:', token); // Log the token
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
  // Fetch all groups
  getUserGroups(): Observable<Group[]> {
    console.log('Requesting groups with headers:', this.getHeaders().get('Authorization')); // Log the request
    return this.http.get<Group[]>(this.baseUrl, { headers: this.getHeaders() });
  }

  // Create a new group
  createGroup(name: string): Observable<Group> {
    return this.http.post<Group>(this.baseUrl, { name }, { headers: this.getHeaders() });
  }

  // Fetch details of a specific group
  getGroupDetails(id: string): Observable<Group> {
    return this.http.get<Group>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }
}
