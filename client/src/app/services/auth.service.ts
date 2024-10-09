import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../models/user.model';

interface PromotionResponse {
  success: boolean;
  user?: User;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:3000/api/users';
  private currentUser: User | null = null;  // In-memory storage for current user

  constructor(private http: HttpClient) { }

  // Method to check if user is authenticated
  isAuthenticated(): boolean {
    const user = localStorage.getItem('user'); // Check if the user is stored in local storage
    return !!user; // If user exists, return true (authenticated)
  }

  // Login method that stores user in local storage
  login(username: string, password: string): Observable<any> {
    return this.http.post<{ user: User }>(`${this.baseUrl}/login`, { username, password }).pipe(
      tap(response => {
        if (response && response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));  // Store the user in local storage
          this.currentUser = response.user;  // Store the user in memory
        }
      }),
      catchError((err) => {
        console.error('Login failed', err);
        return of(null);  // Return null in case of failure
      })
    );
  }  

  // Clears the user data from memory and local storage
  clearUserData(): void {
    localStorage.removeItem('user');  // Remove user from local storage
    this.currentUser = null;  // Clear the in-memory user data
  }

  // Returns the current user from memory or local storage
  getCurrentUser(): User | null {
    if (!this.currentUser) {
      const user = localStorage.getItem('user'); // Fetch from storage if not in memory
      return user ? JSON.parse(user) : null;
    }
    return this.currentUser;
  }

  // Update the current user in local storage
  updateCurrentUser(updatedUser: User): void {
    localStorage.setItem('user', JSON.stringify(updatedUser));  // Update user in local storage
    this.currentUser = updatedUser;  // Update the in-memory user
  }

  // Checks if a user is logged in by verifying if user exists in memory or local storage
  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  // Super Admin check
  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    return user ? user.roles.includes('super-admin') : false;
  }

  // Group Admin check
  isGroupAdmin(): boolean {
    const user = this.getCurrentUser();
    return user ? user.roles.includes('group-admin') : false;
  }

  // Standard User check
  isUser(): boolean {
    const user = this.getCurrentUser();
    return user ? user.roles.includes('user') : false;
  }

  // Delete user API call
  deleteUser(userId: string): Observable<any> {
    return this.http.delete<{ success: boolean, message?: string }>(`${this.baseUrl}/delete/${userId}`, {
      headers: this.buildHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          console.log('Account deletion successful');
        } else {
          console.error('Account deletion failed:', response.message);
        }
      }),
      catchError(error => {
        console.error('Failed to delete account:', error);
        return of({ success: false, message: 'Deletion error' });
      })
    );
  }

  // Promote user to Super Admin
  promoteToSuperAdmin(userId: string): Observable<PromotionResponse | null> {
    return this.http.post<PromotionResponse>(`${this.baseUrl}/promote-to-superadmin`, { userId }, {
      headers: this.buildHeaders()
    }).pipe(
      tap(response => {
        if (response && response.success) {
          console.log(`User ${userId} has been promoted to Super Admin`);
        }
      }),
      catchError(error => {
        console.error('Failed to promote user to Super Admin', error);
        return of(null);
      })
    );
  }

  // Register a new user
  register(username: string, password: string): Observable<{ success: boolean, message?: string }> {
    return this.http.post<{ success: boolean, message?: string }>(`${this.baseUrl}/register`, { username, password }).pipe(
      tap(response => {
        if (response.success) {
          console.log('Registration successful');
        } else {
          console.error('Registration failed:', response.message);
        }
      }),
      catchError(error => {
        console.error('Registration failed:', error);
        const errorMessage = error?.error?.message || 'Username already exists'; // Update default error message
        return of({ success: false, message: errorMessage });
      })
    );
  }


  // Helper method to build HTTP headers
  private buildHeaders(): HttpHeaders {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('No user is logged in');  // Ensure this error is thrown
    }
  
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'user-id': user._id,  // Use in-memory or local storage user
      'user-roles': JSON.stringify(user.roles)
    });
  }  

  // Fetch all users
  getAllUsers(): Observable<User[]> {
    const headers = this.buildHeaders();  // Ensure authentication headers are included
    return this.http.get<User[]>(`${this.baseUrl}/all`, { headers }).pipe(
      catchError(err => {
        console.error('Failed to fetch users', err);
        return of([]); // Return an empty array on failure
      })
    );
  }

}
