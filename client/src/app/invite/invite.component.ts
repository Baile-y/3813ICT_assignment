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
    this.groupService.getInvitations().subscribe({
      next: (invitations: Group[]) => {
        this.invitations = invitations;  // Handle the list of invitations
      },
      error: (err) => {
        console.error('Failed to fetch invitations', err);
      }
    });
  }  

  loadInvitations(): void {
    this.groupService.getInvitations().subscribe((groups: Group[]) => {
      this.invitations = groups;
    });
  }
  
  acceptInvite(groupId: string): void {
    this.groupService.acceptInvite(groupId).subscribe(success => {
      if (success) {
        this.loadInvitations(); // Reload groups to update UI
      } else {
        console.error('Failed to accept invite');
      }
    });
  }


  declineInvite(groupId: string): void {
    this.groupService.declineInvite(groupId).subscribe(success => {
      if (success) {
        this.loadInvitations(); // Reload groups to update UI
      } else {
        console.error('Failed to decline invite');
      }
    });
  }

}
