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
  constructor(private router: Router, private authService: AuthService) {}
  title = 'Chat System';

  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  logout(): void {
    this.authService.clearUserData();
    this.router.navigate(['/login']); // Redirect to the login page
  }  
}