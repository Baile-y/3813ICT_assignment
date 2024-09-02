import { Component, OnInit } from '@angular/core';
import { GroupService } from '../services/group.service';
import { Group } from '../models/group.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.css']
})
export class InvitesComponent implements OnInit {
  invitations: Group[] = [];

  constructor(private groupService: GroupService) { }

  ngOnInit(): void {
    this.groupService.getInvitations().subscribe((groups: Group[]) => {
      this.invitations = groups;
    });
  }

  loadInvitations(): void {
    this.groupService.getInvitations().subscribe((groups: Group[]) => {
      this.invitations = groups;
    });
  }

  acceptInvite(groupId: number): void {
    this.groupService.acceptInvite(groupId).subscribe(success => {
      if (success) {
        this.loadInvitations(); // Reload invitations to update UI
      } else {
        console.error('Failed to accept invite');
      }
    });
  }

  declineInvite(groupId: number): void {
    this.groupService.declineInvite(groupId).subscribe(success => {
      if (success) {
        this.loadInvitations(); // Reload invitations to update UI
      } else {
        console.error('Failed to decline invite');
      }
    });
  }

}
