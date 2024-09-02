import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
}
