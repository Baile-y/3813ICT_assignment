import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Group } from '../models/group.model';
import { AuthService } from './auth.service';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private baseUrl = 'http://localhost:3000/api/groups';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Create a new group
  createGroup(name: string): Observable<Group | null> {
    const adminId = this.authService.getCurrentUser().id;
    const groupData = { name, adminId };

    return this.http.post<{ success: boolean, group: Group }>(`${this.baseUrl}/create`, groupData, {
      headers: this.buildHeaders()
    }).pipe(
      map((response) => {
        if (response.success && response.group) {
          this.saveGroupToLocal(response.group);
          return response.group;
        } else {
          console.error('Group creation failed or response structure is incorrect', response);
          return null;
        }
      }),
      catchError(error => {
        console.error('Group creation failed', error);
        return of(null); // Return null on failure
      })
    );
  }

  // Get the list of groups
  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.baseUrl}`, {
      headers: this.buildHeaders()
    }).pipe(
      catchError(error => {
        console.error('Failed to fetch groups', error);
        return of([]); // Return an empty array on failure
      })
    );
  }

  // Delete a group by its ID
  deleteGroup(groupId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${groupId}`, {
      headers: this.buildHeaders()
    }).pipe(
      catchError(error => {
        console.error('Failed to delete group', error);
        return of(null); // Handle the error appropriately
      })
    );
  }

  // Save a group to local storage
  private saveGroupToLocal(group: Group): void {
    const groups = this.loadGroupsFromLocalStorage();
    groups.push(group);  // Push the group object directly
    localStorage.setItem('groups', JSON.stringify(groups));
  }

  // Load groups from local storage
  private loadGroupsFromLocalStorage(): Group[] {
    const groupsJson = localStorage.getItem('groups');
    return groupsJson ? JSON.parse(groupsJson) : [];
  }

  // Build HTTP headers for requests
  private buildHeaders(): HttpHeaders {
    const user = this.authService.getCurrentUser();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'user-id': user.id.toString(),
      'user-roles': JSON.stringify(user.roles)
    });
  }
}
