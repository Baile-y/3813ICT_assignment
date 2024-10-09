import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { User } from './models/user.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    RouterModule, CommonModule
  ],
})

export class AppComponent implements OnInit {
  currentUser: User | null = null;
  loaded = false;
  title = 'Chat System';

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser = user;  // If the user is authenticated, set the currentUser variable
      // Proceed with logic if user is authenticated
    } else {
      console.error('User is not authenticated');
      this.router.navigate(['/login']); // Redirect to login if user is not authenticated
    }
  }  
  
  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();  // Ensure this returns a boolean indicating login status
  }
  

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.roles.includes('super-admin') || false;
  }

  logout(): void {
    this.authService.clearUserData(); // Clear user data when logging out
    this.router.navigate(['/login']); // Redirect to the login page
  }

  deleteAccount(): void {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      const user = this.authService.getCurrentUser();
      if (user) {
        const userId = user._id;

        this.authService.deleteUser(userId).subscribe({
          next: (response) => {
            if (response.success) {
              console.log('Account deleted successfully.');
              this.authService.clearUserData(); // Clear user data
              this.logout(); // Redirect to login after account deletion
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
}
