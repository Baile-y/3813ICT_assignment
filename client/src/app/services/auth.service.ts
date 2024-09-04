import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';
import { catchError, tap } from 'rxjs/operators';

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

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return new Observable(observer => {
      this.http.post(`${this.baseUrl}/login`, { username, password }).subscribe({
        next: (response: any) => {
          console.log('Login successful, response:', response);
          this.setUserData(response);
          observer.next(response);
          observer.complete();
        },
        error: (err) => {
          console.error('Login failed:', err);
          observer.error(err);
        }
      });
    });
  }

  isAuthenticated(): boolean {
    // Check if the user is authenticated by checking local storage or other means
    return !!localStorage.getItem('user');
  }
  
  private setUserData(user: any): void {
    console.log('Setting user data:', user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  getCurrentUser() {
    const user = JSON.parse(localStorage.getItem('user')!);
    return user;
  }  

  clearUserData(): void {
    console.log('Clearing user data from localStorage');
    localStorage.removeItem('user');
    localStorage.removeItem('users');
  }

  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    return user && user.roles.includes('super-admin');
  }

  isGroupAdmin(): boolean {
    const user = this.getCurrentUser();
    return user && user.roles.includes('group-admin');
  }

  isUser(): boolean {
    const user = this.getCurrentUser();
    return user && user.roles.includes('user');
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  deleteUser(userId: number): Observable<any> {
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
            return of({ success: false, message: 'Deletion error' }); // Handle the error appropriately
        })
    );
}


  loadAllUsersToLocalStorage(): void {
    const headers = this.buildHeaders();

    this.http.get<User[]>(`${this.baseUrl}/all`, { headers })
      .subscribe({
        next: (users: User[]) => {
          console.log('Users fetched from server:', users);
          localStorage.setItem('users', JSON.stringify(users));
        },
        error: (err) => {
          console.error('Failed to load users from the server:', err);
        }
      });
  }

  getUsersFromLocalStorage() {
    const usersJson = localStorage.getItem('users');
    return usersJson ? JSON.parse(usersJson) : [];
  }

  // Example method to delete a user from local storage (if needed)
  deleteUserFromLocalStorage(userId: number): void {
    let users = this.getUsersFromLocalStorage();
    users = users.filter((user: User) => user.id !== userId);
    localStorage.setItem('users', JSON.stringify(users));
  }

  private buildHeaders(): HttpHeaders {
    const user = this.getCurrentUser();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'user-id': user.id.toString(),
      'user-roles': JSON.stringify(user.roles)
    });
  }

  promoteToSuperAdmin(userId: number): Observable<PromotionResponse | null> {
    const headers = this.buildHeaders();
  
    return this.http.post<PromotionResponse>(`${this.baseUrl}/promote-to-superadmin`, { userId }, { headers }).pipe(
      tap(response => {
        if (response && response.success) {
          console.log(`User ${userId} has been promoted to Super Admin`);
        }
      }),
      catchError(error => {
        console.error('Failed to promote user to Super Admin', error);
        return of(null); // Handle the error appropriately
      })
    );
  }
  
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
        // Extract the error message from the server response
        const errorMessage = error.error?.message || 'Registration error';
        return of({ success: false, message: errorMessage }); // Return the error message
      })
    );
  }
  
  
}
