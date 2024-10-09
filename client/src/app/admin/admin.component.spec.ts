import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminComponent } from './admin.component';
import { AuthService } from '../services/auth.service';
import { of, throwError } from 'rxjs';
import { User } from '../models/user.model';
import { By } from '@angular/platform-browser';

class MockAuthService {
  getAllUsers() {
    return of([{ _id: '1', username: 'testUser', roles: ['user'] }]);
  }

  deleteUser(userId: string) {
    return of({ message: 'User deleted successfully' });
  }

  promoteToSuperAdmin(userId: string) {
    return of({ success: true });
  }

  getCurrentUser() {
    return { _id: '1', username: 'adminUser', roles: ['super-admin'] };
  }
}

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: AuthService, useClass: MockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on initialization', () => {
    spyOn(authService, 'getAllUsers').and.callThrough();
    fixture.detectChanges();  // Triggers ngOnInit
    expect(component.users.length).toBe(1);
    expect(authService.getAllUsers).toHaveBeenCalled();
  });

  it('should handle errors when loading users', () => {
    spyOn(authService, 'getAllUsers').and.returnValue(throwError('Error loading users'));
    fixture.detectChanges();  // Triggers ngOnInit
    expect(component.isLoading).toBeFalse();
    expect(component.users.length).toBe(0);
 }); 

  it('should delete a user', () => {
    spyOn(window, 'confirm').and.returnValue(true);  // Mock the confirm dialog
    spyOn(authService, 'deleteUser').and.callThrough();
    component.deleteUser('1');
    expect(authService.deleteUser).toHaveBeenCalledWith('1');
    expect(component.users.length).toBe(0);  // Check if the user was removed from the list
  });

  it('should not delete a user if cancel is clicked', () => {
    spyOn(window, 'confirm').and.returnValue(false);  // Simulate cancel action
    spyOn(authService, 'deleteUser').and.callThrough();
    component.deleteUser('1');
    expect(authService.deleteUser).not.toHaveBeenCalled();
  });

  it('should promote a user to super admin', () => {
    spyOn(window, 'confirm').and.returnValue(true);  // Mock the confirm dialog
    spyOn(authService, 'promoteToSuperAdmin').and.callThrough();
    component.promoteToSuperAdmin('1');
    expect(authService.promoteToSuperAdmin).toHaveBeenCalledWith('1');
  });

  it('should not promote a user to super admin if cancel is clicked', () => {
    spyOn(window, 'confirm').and.returnValue(false);  // Simulate cancel action
    spyOn(authService, 'promoteToSuperAdmin').and.callThrough();
    component.promoteToSuperAdmin('1');
    expect(authService.promoteToSuperAdmin).not.toHaveBeenCalled();
  });

  it('should check if the current user is a super admin', () => {
    expect(component.isSuperAdmin()).toBeTrue();
  });

  it('should return false if the current user is not a super admin', () => {
    spyOn(authService, 'getCurrentUser').and.returnValue({
      _id: '2',
      username: 'normalUser',
      roles: ['user'],
      groupId: 'group1',
      password: 'hashedPassword'
    });
    expect(component.isSuperAdmin()).toBeFalse();
  });
});
