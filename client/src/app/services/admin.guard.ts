import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const token = this.authService.getToken();
    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      if (decodedToken.role === 'Admin') {
        return true;
      }
    }
    this.router.navigate(['/login']);
    return false;
  }
}
