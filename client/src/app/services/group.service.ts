import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Group } from '../models/group.model';
import { AuthService } from './auth.service';
import { catchError, map, tap } from 'rxjs/operators';

interface GroupResponse {
  success: boolean;
  group: Group;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private baseUrl = 'http://localhost:3000/api/groups';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Create a new group
  createGroup(name: string): Observable<Group | null> {
    const user = this.authService.getCurrentUser();
    if (!user) {
        console.error('User not logged in');
        return of(null);
    }

    const groupData = {
        name,
        adminId: user._id, // MongoDB ObjectId as string
        members: [{ userId: user._id, role: user.roles[0] }] // Creator is the admin
    };

    return this.http.post<GroupResponse>(`${this.baseUrl}/create`, groupData, {
        headers: this.buildHeaders()
    }).pipe(
        map(response => {
            if (response.success) {
                return { ...response.group, _id: response.group._id }; // Ensure _id is returned
            }
            return null;
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
  deleteGroup(groupId: string): Observable<any> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${groupId}`, {
      headers: this.buildHeaders()
    }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Failed to delete group', error);
        return of(null); // Handle the error appropriately
      })
    );
  }

  // Delete a user from a group
  deleteUserFromGroup(groupId: string, userId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${groupId}/users/${userId}`, {
      headers: this.buildHeaders()
    }).pipe(
      catchError(error => {
        console.error('Failed to remove user from group:', error);
        return of({ success: false });
      })
    );
  }

  // Invite a user to a group
  inviteUserToGroup(groupId: string, userId: string): Observable<boolean> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/${groupId}/invite`, { userId }, {
      headers: this.buildHeaders()
    }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Failed to invite user', error);
        return of(false);
      })
    );
  }

  // Accept invitation
  acceptInvite(groupId: string): Observable<boolean> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.error('User not logged in');
      return of(false);
    }

    return this.http.post<{ success: boolean }>(`${this.baseUrl}/${groupId}/members`, { userId: user._id }, {
      headers: this.buildHeaders()
    }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Failed to accept group invitation', error);
        return of(false); // Handle the error appropriately and return false
      })
    );
  }

  // Decline invitation
  declineInvite(groupId: string): Observable<boolean> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.error('User not logged in');
      return of(false);
    }

    return this.http.post<{ success: boolean }>(`${this.baseUrl}/${groupId}/decline-invite`, { userId: user._id }, {
      headers: this.buildHeaders()
    }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Failed to decline group invitation', error);
        return of(false);
      })
    );
  }

  // Promote a user to group admin
  promoteUserToAdmin(groupId: string, userId: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.baseUrl}/${groupId}/promote`, { userId, role: 'group-admin' }, {
      headers: this.buildHeaders()
    }).pipe(
      map(response => response),
      catchError(error => {
        console.error('Failed to promote user', error);
        return of(false);
      })
    );
  }

  // Request to join a group
  requestToJoinGroup(groupId: string, userId: string, name: string): Observable<boolean> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/${groupId}/join-request`, { userId, name }, {
      headers: this.buildHeaders()
    }).pipe(
      tap(response => console.log('Server response:', response)),  // Log response for debugging
      map(response => response.success),
      catchError(error => {
        console.error('Failed to request to join group:', error);
        return of(false); // Return false on error
      })
    );
  }
  

  // Approve a join request
  approveJoinRequest(groupId: string, userId: string): Observable<boolean> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/${groupId}/approve-request`, { userId }, {
      headers: this.buildHeaders()
    }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Failed to approve join request', error);
        return of(false);
      })
    );
  }

  // Deny a join request
  denyJoinRequest(groupId: string, userId: string): Observable<boolean> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/${groupId}/deny-request`, { userId }, {
      headers: this.buildHeaders()
    }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Failed to deny join request', error);
        return of(false);
      })
    );
  }

  // Method for a user to leave a group
  leaveGroup(groupId: string): Observable<boolean> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.error('User not logged in');
      return of(false);
    }

    return this.http.post<{ success: boolean }>(`${this.baseUrl}/${groupId}/leave`, { userId: user._id }, {
      headers: this.buildHeaders()
    }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Failed to leave group', error);
        return of(false);
      })
    );
  }

  // Fetch invitations for the user
  getInvitations(): Observable<Group[]> {
    return this.http.get<{ success: boolean, invitations: Group[] }>(`${this.baseUrl}/invitations`, {
      headers: this.buildHeaders()
    }).pipe(
      map(response => (response.success ? response.invitations : [])),
      catchError(err => {
        console.error('Failed to fetch invitations', err);
        return of([]); // Return an empty array in case of error
      })
    );
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
