import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:3000/api/auth'; // Replace with your API URL
  private tokenKey = 'authToken'; // Key to store token in localStorage

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, { username, password }).pipe(
      tap((response: any) => {
        localStorage.setItem(this.tokenKey, response.token); // Save token
      }),
      catchError((error) => {
        console.error('Login failed', error);
        throw error;
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey); // Remove token
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey); // Check if token exists
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}
