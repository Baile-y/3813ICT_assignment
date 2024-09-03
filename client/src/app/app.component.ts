import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { User } from './models/user.model';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    RouterModule, CommonModule
  ],
})

export class AppComponent {
  constructor(private router: Router, private authService: AuthService) { }
  loaded = false;
  title = 'Chat System';

  currentUser: User | null = null;

  isLoggedIn(): boolean {
    if (this.authService.isAuthenticated()) {
      if (this.loaded == false) {
        this.currentUser = this.authService.getCurrentUser();
        if (this.currentUser?.roles.includes('super-admin')) {
          this.authService.loadAllUsersToLocalStorage();
          this.loaded = true;
        }
      }
      return true;
    }
    return false;
  }

  isAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  logout(): void {
    this.authService.clearUserData();
    this.router.navigate(['/login']); // Redirect to the login page
  }

  deleteAccount(): void {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      const userId = this.authService.getCurrentUser().id;

      this.authService.deleteUser(userId).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Account deleted successfully.');
            this.authService.clearUserData(); // Clear user data from local storage
            this.logout();
            // Redirect to a different page, e.g., login or home page
          } else {
            console.error('Failed to delete account:', response.message);
          }
        },
        error: (err) => {
          console.error('Error deleting account:', err);
        }
      });
    }
  }

}