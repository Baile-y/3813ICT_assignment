import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, FormsModule, CommonModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and navigate to /group', () => {
      const mockResponse = {
        user: {
          roles: ['user'],
          username: 'testUser'
        }
      };

      authService.login.and.returnValue(of(mockResponse));

      component.username = 'testUser';
      component.password = 'testPassword';
      component.login();

      expect(authService.login).toHaveBeenCalledWith('testUser', 'testPassword');
      expect(localStorage.getItem('role')).toBe('user');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.user));
      expect(router.navigate).toHaveBeenCalledWith(['/group']);
    });

    it('should handle login failure and set errorMessage', () => {
      authService.login.and.returnValue(throwError('Login Failed'));

      component.username = 'testUser';
      component.password = 'wrongPassword';
      component.login();

      expect(authService.login).toHaveBeenCalledWith('testUser', 'wrongPassword');
      expect(component.errorMessage).toBe('Login Failed');
    });
  });

  describe('Form interactions', () => {
    it('should bind username and password to the form controls', () => {
      const compiled = fixture.nativeElement as HTMLElement;

      const usernameInput = compiled.querySelector('input[name="username"]') as HTMLInputElement;
      const passwordInput = compiled.querySelector('input[name="password"]') as HTMLInputElement;

      // Simulate user typing in the form
      usernameInput.value = 'testUser';
      passwordInput.value = 'testPassword';

      usernameInput.dispatchEvent(new Event('input'));
      passwordInput.dispatchEvent(new Event('input'));

      expect(component.username).toBe('testUser');
      expect(component.password).toBe('testPassword');
    });
  });
});
