import { Component, OnInit } from '@angular/core';
import { GroupService } from '../services/group.service';
import { Group } from '../models/group.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChannelComponent } from '../channel/channel.component';

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

  constructor(private groupService: GroupService) {}

  ngOnInit(): void {
    this.groupService.getGroups().subscribe((response: any) => {
      console.log('Groups data:', response);  // Debugging line
      this.groups = response.groups;  
    });
  }

  createGroup(groupName: string): void {
    this.groupService.createGroup(groupName).subscribe({
      next: (group: Group | null) => {
        if (group) {
          this.groups.push(group);
          this.selectedGroupId = group.id;
        }
      },
      error: (err: any) => {
        console.error('Failed to create group:', err);
      }
    });
  }

  deleteGroup(groupId: number): void {
    this.groupService.deleteGroup(groupId).subscribe({
      next: () => {
        this.groups = this.groups.filter(group => group.id !== groupId);
      },
      error: (err: any) => {
        console.error('Failed to delete group:', err);
      }
    });
  }

  selectGroup(group: Group): void {
  this.selectedGroupId = group.id;
}
}
