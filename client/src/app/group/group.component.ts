import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { GroupService } from '../services/group.service';
import { Group } from '../models/group.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChannelComponent } from '../channel/channel.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [CommonModule, FormsModule, ChannelComponent],
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.css']
})
export class GroupComponent implements OnInit {
  groups: Group[] = [];
  selectedGroupId: string | null = null;
  newGroupName: string = '';
  selectedGroup: Group | null = null;

  constructor(private groupService: GroupService, private authService: AuthService, private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadGroups();
  }

  createGroup(groupName: string): void {
    if (!groupName.trim()) {
      console.error('Group name cannot be empty.');
      return;
    }
  
    this.groupService.createGroup(groupName).subscribe({
      next: (group: Group | null) => {
        if (group) {
          this.groups.push(group); 
          this.selectedGroupId = group._id;
          this.selectGroup(group);
        }
      },
      error: (err: any) => {
        console.error('Failed to create group:', err);
      }
    });
  }

  loadGroups(): void {
    this.groupService.getGroups().subscribe(groups => {
      this.groups = groups;
    }, error => {
      console.error('Error fetching groups:', error);
    });
  }

  canDeleteGroup(group: Group): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;  // Ensure user is not null
    const isSuperAdmin = user.roles?.includes('super-admin') || false;  // Handle null or undefined roles
    const isGroupAdmin = group.adminId === user._id;
    const isPromotedAdmin = group.members?.some(member => member.userId === user._id && member.role === 'group-admin');
    return isSuperAdmin || isGroupAdmin || isPromotedAdmin;
  }

  deleteGroup(groupId: string): void {
    this.groupService.deleteGroup(groupId).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.groups = this.groups.filter(group => group._id !== groupId);
          console.log('Group deleted successfully.');
          if (this.selectedGroupId === groupId) {
            this.selectedGroup = null;
            this.selectedGroupId = null;
          }
        } else {
          console.error('Failed to delete group on the server.');
        }
      },
      error: (err: any) => {
        console.error('Failed to delete group:', err);
      }
    });
  }

  userHasAccess(group: Group): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false; // Check for null user
    return group.members?.some(member => member.userId === user._id) || user.roles?.includes('super-admin') || false;
  }


  selectGroup(group: Group): void {
    if (this.userHasAccess(group)) {
      if (this.selectedGroupId === group._id) {
        this.selectedGroupId = null; // Unselect the group if it's already selected
        this.selectedGroup = null; // Reset the selected group
      }
      else {
        this.selectedGroupId = group._id;
        this.selectedGroup = group;
      }
    } else {
      console.error('User does not have access to this group');
      this.selectedGroupId = null;
      this.selectedGroup = null;
    }
  }

  promoteUser(groupId: string, userId: string): void {
    this.groupService.promoteUserToAdmin(groupId, userId).subscribe({
      next: (success) => {
        if (success) {
          const group = this.groups.find(g => g._id === groupId);
          const member = group?.members?.find(m => m.userId === userId);
          if (member) {
            member.role = 'admin'; // Reflect the promotion in the UI
          }
          console.log('User promoted to admin successfully.');
        } else {
          console.error('Failed to promote user to admin.');
        }
      },
      error: (err) => {
        console.error('Error promoting user to admin:', err);
      }
    });
  }

  canPromoteToAdmin(member: { userId: string, role: string }): boolean {
    const user = this.authService.getCurrentUser();
    return user?.roles?.includes('super-admin') || this.selectedGroup?.adminId === user?._id || false;
  }

  inviteUserToGroup(groupId: string, userIdString: string): void {
    this.groupService.inviteUserToGroup(groupId, userIdString);
  }

  deleteUserFromGroup(groupId: string, userId: string): void {
    if (confirm('Are you sure you want to remove this user from the group?')) {
      this.groupService.deleteUserFromGroup(groupId, userId).subscribe({
        next: (response) => {
          if (response && response.success && this.selectedGroup && this.selectedGroup.members) {
            this.selectedGroup.members = this.selectedGroup.members.filter(member => member.userId !== userId);
            console.log(this.selectedGroup.members);
          } else {
            console.error('Failed to remove user from group on the server.');
          }
        },
        error: (err) => {
          console.error('Failed to remove user from group:', err);
        }
      });
    }
  }

  canDeleteUser(member: any): boolean {
    const user = this.authService.getCurrentUser();
    return this.selectedGroup &&
      (user?.roles?.includes('super-admin') ||
        (this.selectedGroup.adminId === user?._id && member.role !== 'admin')) || false;
  }

  requestToJoin(groupId: string): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.groupService.requestToJoinGroup(groupId, user._id, user.username).subscribe(success => {
        if (success) {
          console.log('Join request sent successfully.');
        } else {
          console.error('Failed to send join request.');
        }
      });
    }
  }

  approveRequest(groupId: string, userId: string): void {
    this.groupService.approveJoinRequest(groupId, userId).subscribe(success => {
      if (success && this.selectedGroup) {
        this.selectedGroup.members.push({ userId, role: 'user' });
        this.selectedGroup.joinRequests = this.selectedGroup.joinRequests?.filter(request => request.userId !== userId);
      } else {
        console.error('Failed to approve join request.');
      }
    });
  }

  denyRequest(groupId: string, userId: string): void {
    this.groupService.denyJoinRequest(groupId, userId).subscribe(success => {
      if (success && this.selectedGroup) {
        this.selectedGroup.joinRequests = this.selectedGroup.joinRequests?.filter(request => request.userId !== userId);
      } else {
        console.error('Failed to deny join request.');
      }
    });
  }

  leaveGroup(groupId: string): void {
    if (confirm('Are you sure you want to leave this group?')) {
      this.groupService.leaveGroup(groupId).subscribe(success => {
        if (success) {
          this.groups = this.groups.filter(group => group._id !== groupId);
          this.selectedGroup = null;
          this.selectedGroupId = null;
          console.log('You have left the group.');
        } else {
          console.error('Failed to leave the group.');
        }
      });
    }
  }
  
  canCreateGroup(): boolean {
    const user = this.authService.getCurrentUser();
    return user ? user.roles.includes('super-admin') : false;
  }
  
}
