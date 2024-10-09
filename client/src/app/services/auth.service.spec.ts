import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpHeaders } from '@angular/common/http';
import { User } from '../models/user.model';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    _id: '123',
    username: 'testuser',
    password: 'password123',
    groupId: 'group123',
    roles: ['user']
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should store user in localStorage and set currentUser on successful login', () => {
      const mockResponse = { user: mockUser };

      service.login('testuser', 'password').subscribe((response) => {
        expect(response.user).toEqual(mockUser);
        expect(localStorage.getItem('user')).toEqual(JSON.stringify(mockUser));
        expect(service.getCurrentUser()).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if user is in localStorage', () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should return false if no user is in localStorage', () => {
      localStorage.removeItem('user');
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('getCurrentUser', () => {
    it('should return currentUser from memory if set', () => {
      service['currentUser'] = mockUser;
      expect(service.getCurrentUser()).toEqual(mockUser);
    });

    it('should return currentUser from localStorage if not in memory', () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      service['currentUser'] = null;
      expect(service.getCurrentUser()).toEqual(mockUser);
    });

    it('should return null if no user in memory or localStorage', () => {
      localStorage.removeItem('user');
      service['currentUser'] = null;
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should handle errors when deletion fails', () => {
      service.deleteUser('123').subscribe((response) => {
        expect(response.success).toBeFalse();
        expect(response.message).toBe('Deletion error');
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/delete/123`);
      req.flush({ success: false, message: 'Deletion error' }, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('promoteToSuperAdmin', () => {
    it('should promote user to Super Admin', () => {
      const mockResponse = { success: true, user: { ...mockUser, roles: ['super-admin'] } };
      service['currentUser'] = mockUser; // Ensure user is logged in
    
      service.promoteToSuperAdmin('123').subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(response?.user?.roles.includes('super-admin')).toBeTrue();
      });
    
      const req = httpMock.expectOne(`${service['baseUrl']}/promote-to-superadmin`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });    

    it('should handle errors when promotion fails', () => {
      service['currentUser'] = mockUser; // Ensure user is logged in
      service.promoteToSuperAdmin('123').subscribe((response) => {
        expect(response).toBeNull();
      });
    
      const req = httpMock.expectOne(`${service['baseUrl']}/promote-to-superadmin`);
      req.flush('Promotion failed', { status: 500, statusText: 'Server Error' });
    });
    
  });

  describe('register', () => {
    it('should register a new user', () => {
      const mockResponse = { success: true };

      service.register('newuser', 'password').subscribe((response) => {
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${service['baseUrl']}/register`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle registration failure', () => {
      const mockError = { error: { message: 'Username already exists' } };
    
      service.register('existinguser', 'password').subscribe({
        next: (response) => {
          expect(response.success).toBeFalse();
          expect(response.message).toBe('Username already exists');
        },
        error: (error) => {
          expect(error.error.message).toBe('Username already exists');
        }
      });
    
      const req = httpMock.expectOne(`${service['baseUrl']}/register`);
      req.flush(mockError, { status: 400, statusText: 'Bad Request' });
    });
    
  });
});
