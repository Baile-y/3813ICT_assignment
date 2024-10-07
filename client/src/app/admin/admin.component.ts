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
    this.loadUsers();
  }

  // Fetch users from the backend instead of local storage
  loadUsers(): void {
    this.authService.getAllUsers().subscribe({
      next: (users: User[]) => {
        this.users = users;
        this.isLoading = false; // Update loading state
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.isLoading = false; // Stop loading in case of error
      }
    });
  }

  // Delete user from the backend
  deleteUser(userId: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.authService.deleteUser(userId).subscribe({
        next: (response) => {
          console.log(response.message);
          // Remove user from the local users array after successful deletion
          this.users = this.users.filter(user => user._id !== userId);
        },
        error: (err) => {
          console.error('Failed to delete user:', err);
        }
      });
    }
  }

  // Check if the current user is a Super Admin
  isSuperAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.roles.includes('super-admin') || false; // Optional chaining and default value
  }

  // Promote a user to Super Admin
  promoteToSuperAdmin(userId: string): void {
    if (confirm('Are you sure you want to promote this user to Super Admin?')) {
      this.authService.promoteToSuperAdmin(userId).subscribe({
        next: (response) => {
          if (response && response.success) {
            console.log(`User ${userId} has been promoted to Super Admin`);
            this.loadUsers(); // Reload the users list after promotion
          }
        },
        error: (err) => {
          console.error('Failed to promote user to Super Admin:', err);
        }
      });
    }
  }
}
