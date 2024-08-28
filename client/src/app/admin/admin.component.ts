import { Component, OnInit } from '@angular/core';
import { GroupService } from '../services/group.service';
import { ChannelService } from '../services/channel.service';
import { Group } from '../models/group.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class AdminComponent implements OnInit {
  newGroupName = '';
  newChannelName = '';
  selectedGroupId = '';
  groups: Group[] = [];

  constructor(private groupService: GroupService, private channelService: ChannelService) {}

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    this.groupService.getUserGroups().subscribe(groups => {
      this.groups = groups;
    });
  }

  createGroup(name: string) {
    this.groupService.createGroup(name).subscribe(group => {
      console.log('Group created:', group);
      this.loadGroups(); // Refresh the group list after creating a new group
    });
  }

  createChannel(groupId: string, name: string) {
    this.channelService.createChannel(groupId, name).subscribe(channel => {
      console.log('Channel created:', channel);
    });
  }
}
