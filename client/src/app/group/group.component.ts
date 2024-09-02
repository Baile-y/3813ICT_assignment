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
  selectedGroupId: number | null = null;
  newGroupName: string = '';
  selectedGroup: Group | null = null;

  constructor(private groupService: GroupService, private authService: AuthService, private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.groupService.getGroups().subscribe((groups: Group[]) => {
      this.groups = groups;
    });
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
          this.selectedGroupId = group.id;

          // Ensure the group is saved before loading channels
          setTimeout(() => {
            this.selectGroup(group);
          }, 100); // Short delay to ensure the group is saved
        }
      },
      error: (err: any) => {
        console.error('Failed to create group:', err);
      }
    });
  }

  canDeleteGroup(group: Group): boolean {
    const user = this.authService.getCurrentUser();
    const isSuperAdmin = user.roles.includes('super-admin');
    const isGroupAdmin = group.adminId === user.id;
    const isPromotedAdmin = group.members.some(member => member.userId === user.id && member.role === 'group-admin');

    return isSuperAdmin || isGroupAdmin || isPromotedAdmin;
  }


  deleteGroup(groupId: number): void {
    this.groupService.deleteGroup(groupId).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.groups = this.groups.filter(group => group.id !== groupId);
          console.log('Group deleted successfully.');

          // Clear the selected group if the deleted group was the selected one
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
    return group.members.some(member => member.userId === user.id);
  }

  selectGroup(group: Group): void {
    if (this.userHasAccess(group)) {
      if (this.selectedGroupId === group.id) {
        this.selectedGroupId = null; // Unselect the group if it's already selected
        this.selectedGroup = null; // Reset the selected group
      }
      else {
        this.selectedGroupId = group.id;
        this.selectedGroup = group;
      }
    } else {
      console.error('User does not have access to this group');
      this.selectedGroupId = null;
      this.selectedGroup = null;
    }
  }

  promoteUser(groupId: number, userId: number): void {
    this.groupService.promoteUserToAdmin(groupId, userId).subscribe({
      next: (success) => {
        if (success) {
          // Update the UI accordingly
          const group = this.groups.find(g => g.id === groupId);
          const member = group?.members.find(m => m.userId === userId);
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

  canPromoteToAdmin(member: { userId: number, role: string }): boolean {
    const user = this.authService.getCurrentUser();
    // Only super-admins or current group admins can promote others to admin
    return user.roles.includes('super-admin') || this.selectedGroup?.adminId === user.id;
  }

  inviteUserToGroup(groupId: number, userIdString: string): void {
    const userId = parseInt(userIdString, 10); // Convert the string to a number
    if (isNaN(userId)) {
      console.error('Invalid user ID');
      return;
    }
    this.groupService.inviteUserToGroup(groupId, userId);
  }
}
