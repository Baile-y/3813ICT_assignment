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

  constructor(private http: HttpClient, private authService: AuthService) { }

  // Create a new group
  createGroup(name: string): Observable<Group | null> {
    const user = this.authService.getCurrentUser();
    const groupData = {
      name,
      adminId: user.id,
      members: [{ userId: user.id, role: 'admin' }] // Creator is the admin
    };

    return this.http.post<{ success: boolean; group: Group }>(`${this.baseUrl}/create`, groupData, {
      headers: this.buildHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          this.saveGroupToLocal(response.group);
          return response.group;
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
    const user = this.authService.getCurrentUser();
    return this.http.get<{ groups: Group[] }>(`${this.baseUrl}`, {
      headers: this.buildHeaders()
    }).pipe(
      map(response => {
        console.log(response.groups);
        return response.groups;
      }),
      catchError(error => {
        console.error('Failed to fetch groups', error);
        return of([]); // Return an empty array on failure
      })
    );
  }


  // Delete a group by its ID
  deleteGroup(groupId: number): Observable<any> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${groupId}`, {
      headers: this.buildHeaders()
    }).pipe(
      map(response => {
        if (response && response.success) {
          this.removeGroupFromLocalStorage(groupId);
        }
        return response;
      }),
      catchError(error => {
        console.error('Failed to delete group', error);
        return of(null); // Handle the error appropriately
      })
    );
  }

  deleteUserFromGroup(groupId: number, userId: number): Observable<{ success: boolean }> {
    const headers = this.buildHeaders(); // Assuming you have a method to build headers

    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${groupId}/users/${userId}`, { headers }).pipe(
      tap(response => {
        if (response.success) {
          // Update local storage after successful deletion from the server
          this.updateLocalStorageAfterUserDeletion(groupId, userId);
        }
      }),
      catchError(error => {
        console.error('Failed to remove user from group:', error);
        return of({ success: false });
      })
    );
  }

  private updateLocalStorageAfterUserDeletion(groupId: number, userId: number): void {
    const groupsJson = localStorage.getItem('groups');
    const groups = groupsJson ? JSON.parse(groupsJson) : [];

    const groupIndex = groups.findIndex((group: Group) => group.id === groupId);
    if (groupIndex !== -1) {
      const group = groups[groupIndex];
      group.members = group.members.filter((member: any) => member.userId !== userId);
      localStorage.setItem('groups', JSON.stringify(groups));
      console.log(`User with ID ${userId} removed from group ${groupId} in local storage.`);
    }
  }


  private removeGroupFromLocalStorage(groupId: number): void {
    const groupsJson = localStorage.getItem('groups');
    let groups = groupsJson ? JSON.parse(groupsJson) : [];

    groups = groups.filter((group: Group) => group.id !== groupId);
    localStorage.setItem('groups', JSON.stringify(groups));
  }

  // Save a group to local storage
  private saveGroupToLocal(group: Group): void {
    const groupsJson = localStorage.getItem('groups');
    const groups = groupsJson ? JSON.parse(groupsJson) : [];

    groups.push(group);
    localStorage.setItem('groups', JSON.stringify(groups));
  }

  // Load groups from local storage
  private loadGroupsFromLocalStorage(): Group[] {
    const user = this.authService.getCurrentUser();
    const userGroupsJson = localStorage.getItem(`groups_${user.id}`);
    return userGroupsJson ? JSON.parse(userGroupsJson) : [];
  }

  // Build HTTP headers for requests
  private buildHeaders(): HttpHeaders {
    const user = this.authService.getCurrentUser();
    console.log(user.id);
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'user-id': user.id.toString(),
      'user-roles': JSON.stringify(user.roles)
    });
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

  inviteUserToGroup(groupId: number, userId: number): void {
    const groupsJson = localStorage.getItem('groups');
    const groups = groupsJson ? JSON.parse(groupsJson) : [];
    const group = groups.find((g: Group) => g.id === groupId);

    if (group) {
      if (!group.invitations) {
        group.invitations = [];
      }

      // Check if the user is already invited
      const alreadyInvited = group.invitations.some((invite: { userId: number }) => invite.userId === userId);

      if (!alreadyInvited) {
        group.invitations.push({ userId });
        localStorage.setItem('groups', JSON.stringify(groups));
        console.log(`User with ID ${userId} invited to group ${groupId}`);

        // Send the invitation to the server
        this.http.post(`${this.baseUrl}/${groupId}/invite`, { userId }, {
          headers: this.buildHeaders()
        }).subscribe({
          next: (response: any) => {
            console.log('Invite sent to server successfully:', response);
          },
          error: (err: any) => {
            console.error('Failed to send invite to server:', err);
          }
        });

      } else {
        console.log(`User with ID ${userId} is already invited to group ${groupId}`);
      }
    } else {
      console.error(`Group with ID ${groupId} not found`);
    }
  }

  getInvitations(): Observable<Group[]> {
    const user = this.authService.getCurrentUser();
    const groupsJson = localStorage.getItem('groups');
    const groups: Group[] = groupsJson ? JSON.parse(groupsJson) : [];

    // Filter groups where the current user has been invited
    const invitations = groups.filter(group =>
      group.invitations?.some((invite: { userId: number }) => invite.userId === user.id)
    );

    return of(invitations);
  }

  // Accept invitation
  acceptInvite(groupId: number): Observable<boolean> {
    const user = this.authService.getCurrentUser();

    return this.http.post<GroupResponse>(`${this.baseUrl}/${groupId}/members`, { userId: user.id }, {
      headers: this.buildHeaders()
    }).pipe(
      tap(response => {
        if (response && response.success) {
          console.log(`User ${user.id} added to group ${groupId}`);

          // Update local storage after server-side update
          const groupsJson = localStorage.getItem('groups');
          const groups: Group[] = groupsJson ? JSON.parse(groupsJson) : [];
          const group = groups.find(g => g.id === groupId);
          console.log(group);

          if (group) {
            // Remove the invitation from local storage
            const inviteIndex = group.invitations?.findIndex((invite: { userId: number }) => invite.userId === user.id);
            if (inviteIndex !== undefined && inviteIndex !== -1) {
              group.invitations?.splice(inviteIndex, 1); // Remove invitation
              group.members.push({ userId: user.id, role: 'user' }); // Add user as a member
              localStorage.setItem('groups', JSON.stringify(groups));
              console.log(group);
            }
          }
        }
      }),
      map(response => !!(response && response.success)), // Return true if successful
      catchError(error => {
        console.error('Failed to accept group invitation', error);
        return of(false); // Handle the error appropriately and return false
      })
    );
  }


  // Decline invitation
  declineInvite(groupId: number): Observable<boolean> {
    const user = this.authService.getCurrentUser();
    const groupsJson = localStorage.getItem('groups');
    const groups: Group[] = groupsJson ? JSON.parse(groupsJson) : [];
    const group = groups.find(g => g.id === groupId);

    if (group) {
      const inviteIndex = group.invitations?.findIndex((invite: { userId: number }) => invite.userId === user.id);
      if (inviteIndex !== undefined && inviteIndex !== -1) {
        group.invitations?.splice(inviteIndex, 1); // Remove invitation
        localStorage.setItem('groups', JSON.stringify(groups));
        return of(true);
      }
    }
    return of(false);
  }

  // Promote a user to group admin
  promoteUserToAdmin(groupId: number, userId: number): Observable<boolean> {
    const groupsJson = localStorage.getItem('groups');
    const groups = groupsJson ? JSON.parse(groupsJson) : [];
    const group = groups.find((g: Group) => g.id === groupId);

    if (group) {
      const member = group.members.find((m: { userId: number }) => m.userId === userId);
      if (member) {
        member.role = 'group-admin';  // Update the role to 'group-admin'
        localStorage.setItem('groups', JSON.stringify(groups));

        // Optionally sync this change with the server
        return this.http.post<boolean>(`${this.baseUrl}/${groupId}/promote`, { userId, role: 'group-admin' }, {
          headers: this.buildHeaders()
        }).pipe(
          tap(() => console.log(`User ${userId} promoted to group-admin in group ${groupId}`)),
          catchError(error => {
            console.error('Failed to promote user', error);
            return of(false);
          })
        );
      }
    }
    return of(false);
  }

  // Method for users to request to join a group
  requestToJoinGroup(groupId: number, userId: number, name: string): Observable<boolean> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/${groupId}/join-request`, { userId, name }, {
      headers: this.buildHeaders()
    }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Failed to request to join group:', error);
        return of(false);
      })
    );
  }

  // Method for admins to approve a join request
  approveJoinRequest(groupId: number, userId: number): Observable<boolean> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/${groupId}/approve-request`, { userId }, {
      headers: this.buildHeaders()
    }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Failed to approve join request:', error);
        return of(false);
      })
    );
  }

  // Method for admins to deny a join request
  denyJoinRequest(groupId: number, userId: number): Observable<boolean> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/${groupId}/deny-request`, { userId }, {
      headers: this.buildHeaders()
    }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Failed to deny join request:', error);
        return of(false);
      })
    );
  }

  // Method for a user to leave a group
  leaveGroup(groupId: number): Observable<boolean> {
    const user = this.authService.getCurrentUser();
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/${groupId}/leave`, { userId: user.id }, {
      headers: this.buildHeaders()
    }).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Failed to leave group:', error);
        return of(false);
      })
    );
}

}
