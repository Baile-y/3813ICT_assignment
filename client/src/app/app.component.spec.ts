import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { User } from './models/user.model';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  const mockUser: User = {
    _id: 'userId123',
    username: 'testuser',
    password: 'password123',
    roles: ['user', 'super-admin'],
    groupId: 'groupId123',
    avatar: 'avatar.png'
  };

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'isAuthenticated', 'clearUserData', 'deleteUser']);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]) // This sets up the RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authSpy }
      ],
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set currentUser if authenticated', () => {
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      component.ngOnInit();
      expect(component.currentUser).toEqual(mockUser);
    });

    it('should redirect to login if user is not authenticated', () => {
      authServiceSpy.getCurrentUser.and.returnValue(null);
      const navigateSpy = spyOn(router, 'navigate');  // Spy on router's navigate method
      component.ngOnInit();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('isLoggedIn', () => {
    it('should return true if user is authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);
      expect(component.isLoggedIn()).toBeTrue();
    });

    it('should return false if user is not authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);
      expect(component.isLoggedIn()).toBeFalse();
    });
  });

  describe('isAdmin', () => {
    it('should return true if user is a super-admin', () => {
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      expect(component.isAdmin()).toBeTrue();
    });

    it('should return false if user is not a super-admin', () => {
      const nonAdminUser = { ...mockUser, roles: ['user'] };
      authServiceSpy.getCurrentUser.and.returnValue(nonAdminUser);
      expect(component.isAdmin()).toBeFalse();
    });

    it('should return false if no user is logged in', () => {
      authServiceSpy.getCurrentUser.and.returnValue(null);
      expect(component.isAdmin()).toBeFalse();
    });
  });

  describe('logout', () => {
    it('should clear user data and navigate to login', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.logout();
      expect(authServiceSpy.clearUserData).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('deleteAccount', () => {
    it('should prompt for confirmation and delete account if confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true); // Mock user confirmation
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      authServiceSpy.deleteUser.and.returnValue(of({ success: true }));

      const navigateSpy = spyOn(router, 'navigate');

      component.deleteAccount();

      expect(authServiceSpy.deleteUser).toHaveBeenCalledWith(mockUser._id);
      expect(authServiceSpy.clearUserData).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    });

    it('should not delete account if confirmation is canceled', () => {
      spyOn(window, 'confirm').and.returnValue(false); // Mock user cancel
      component.deleteAccount();
      expect(authServiceSpy.deleteUser).not.toHaveBeenCalled();
      expect(authServiceSpy.clearUserData).not.toHaveBeenCalled();
    });

    it('should handle error when account deletion fails', () => {
      spyOn(window, 'confirm').and.returnValue(true); // Mock user confirmation
      authServiceSpy.getCurrentUser.and.returnValue(mockUser);
      authServiceSpy.deleteUser.and.returnValue(of({ success: false, message: 'Error' }));

      const navigateSpy = spyOn(router, 'navigate');

      component.deleteAccount();

      expect(authServiceSpy.deleteUser).toHaveBeenCalledWith(mockUser._id);
      expect(authServiceSpy.clearUserData).not.toHaveBeenCalled(); // Should not clear data on failure
      expect(navigateSpy).not.toHaveBeenCalled(); // Should not redirect on failure
    });
  });
});
