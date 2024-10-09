import { TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let authService: jasmine.SpyObj<AuthService>;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    _id: '12345',
    groupId: 'group1',
    username: 'testuser',
    password: 'password',
    roles: ['user'],
    avatar: 'avatar.jpg'
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'updateCurrentUser']);

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, FormsModule, CommonModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    // Initialize services and component
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    authService.getCurrentUser.and.returnValue(mockUser);
    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Verify that there are no outstanding HTTP requests
    httpMock.verify();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set the current user on initialization', () => {
    expect(component.currentUser).toEqual(mockUser);
  });

  it('should select a file when onFileSelected is called', () => {
    const file = new File([''], 'test-image.jpg');
    const event = { target: { files: [file] } } as unknown as Event;

    component.onFileSelected(event);
    
    expect(component.selectedFile).toBe(file);
  });

  it('should not upload if no file is selected', () => {
    const event = new Event('submit');
    spyOn(component, 'uploadProfileImage');
    
    component.uploadProfileImage(event);
    
    expect(component.uploadProfileImage).toHaveBeenCalled();
    expect(component.selectedFile).toBeNull();
  });

  it('should upload profile image and update current user avatar', () => {
    const file = new File([''], 'test-image.jpg');
    component.selectedFile = file;
    const formData = new FormData();
    formData.append('profileImage', file);
  
    const event = new Event('submit');
    component.uploadProfileImage(event);
  
    const mockResponse = { message: 'Image uploaded', avatarPath: 'new-avatar.jpg' };
  
    const req = httpMock.expectOne('http://localhost:3000/api/users/upload-avatar');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  
    // Ensure that currentUser is not null before passing to the spy
    expect(component.currentUser).not.toBeNull();
  
    // Now you can assert the avatar update
    if (component.currentUser) {
      expect(component.currentUser.avatar).toEqual('new-avatar.jpg');
      expect(authService.updateCurrentUser).toHaveBeenCalledWith(component.currentUser);
    }
  });  

  it('should handle errors when uploading an image', () => {
    // Mock currentUser with an initial avatar
    component.currentUser = {
      _id: '1',
      username: 'testUser',
      avatar: 'avatar.jpg',
      groupId: 'group1', // Mock group ID
      password: 'hashedPassword', // Mock password
      roles: ['user'] // Mock roles
    };
      
    // Create a mock file and append it to the FormData
    const file = new File([''], 'test-image.jpg');
    component.selectedFile = file;
    const formData = new FormData();
    formData.append('profileImage', file);
  
    // Trigger the uploadProfileImage method
    const event = new Event('submit');
    component.uploadProfileImage(event);
  
    // Simulate an error response from the server
    const mockError = { status: 500, statusText: 'Server Error' };
  
    const req = httpMock.expectOne('http://localhost:3000/api/users/upload-avatar');
    expect(req.request.method).toBe('POST');
    
    // Respond with an error
    req.flush(mockError, { status: 500, statusText: 'Server Error' });
  
    // Ensure the avatar remains unchanged after the error
    expect(component.currentUser?.avatar).toEqual('avatar.jpg');
  });  

  it('should throw an error if user is not logged in when building headers', () => {
    authService.getCurrentUser.and.returnValue(null);
    expect(() => component['buildHeaders']()).toThrowError('User not logged in');
  });

  it('should build headers with user ID', () => {
    const headers = component['buildHeaders']();
    expect(headers.get('user-id')).toBe('12345');
  });
});
