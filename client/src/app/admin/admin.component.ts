import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { User } from '../models/user.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  users: User[] = [];
  isLoading = true; // Track loading state

  constructor(private authService: AuthService) { }
  
  ngOnInit(): void {
    console.log(this.isLoading);
    this.loadUsers();
    console.log("HERE", this.users);
    console.log(this.isLoading);
  }

  loadUsers(): void {
    // this.authService.loadAllUsersToLocalStorage();
    this.users = this.authService.getUsersFromLocalStorage();
    this.isLoading = false;
  }

  deleteUser(userId: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.authService.deleteUser(userId).subscribe({
        next: (response) => {
          console.log(response.message);
          this.users = this.users.filter(user => user.id !== userId); // Update the local users array
          // this.authService.updateUsersInLocalStorage(this.users); // Update local storage
          this.authService.getUsersFromLocalStorage();
        },
        error: (err) => {
          console.error('Failed to delete user:', err);
        }
      });
    }
  }
  
  isSuperAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user.roles.includes('super-admin');
  }

  promoteToSuperAdmin(userId: number): void {
    if (confirm('Are you sure you want to promote this user to Super Admin?')) {
      this.authService.promoteToSuperAdmin(userId).subscribe({
        next: (response) => {
          if (response && response.success) {
            console.log(`User ${userId} has been promoted to Super Admin`);
            this.users = this.authService.getUsersFromLocalStorage();
          }
        },
        error: (err) => {
          console.error('Failed to promote user to Super Admin:', err);
        }
      });
    }
  }    
  
}
