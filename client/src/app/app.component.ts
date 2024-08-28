import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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
  title = 'your-angular-app';

  constructor(private authService: AuthService, private router: Router) {}

  isAdmin(): boolean {
    const token = this.authService.getToken();
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      return decodedToken.role === 'Admin';
    }
    return false;
  }

  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);  // Redirect to the login screen after logout
  }
}