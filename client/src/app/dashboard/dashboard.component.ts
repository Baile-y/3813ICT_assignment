import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GroupService } from '../services/group.service';
import { Group } from '../models/group.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule]
})
export class DashboardComponent implements OnInit {
  groups: Group[] = [];

  constructor(private groupService: GroupService, private router: Router) {}

  ngOnInit() {
    this.groupService.getUserGroups().subscribe((groups) => {
      this.groups = groups;
    });
  }

  navigateToGroup(groupId: string) {
    this.router.navigate(['/chat', groupId]);
  }
}
