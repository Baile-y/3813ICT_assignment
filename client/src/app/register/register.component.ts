import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'] 
})

export class RegisterComponent {
  username: string = '';
  password: string = '';
  errorMessage: string | null = null;

  constructor(private authService: AuthService) { }

  register(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Username and password are required.';
      return;
    }

    this.authService.register(this.username, this.password).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('User registered successfully');
          this.errorMessage = null; // Clear error message on success
        } else {
          this.errorMessage = response.message || 'Registration failed';
        }
      },
      error: (err) => {
        console.error('Registration failed:', err);
        // Check if the error message contains the "Username already exists" string
        if (err.error && err.error.message === 'Username already exists') {
          this.errorMessage = 'Username already exists. Please choose another one.';
        } else {
          this.errorMessage = err.error.message || 'An unexpected error occurred during registration.';
        }
      }
    });
  }
}