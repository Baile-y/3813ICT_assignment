import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, FormsModule],
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display an error if username and password are empty', () => {
    component.username = '';
    component.password = '';
    component.register();
    expect(component.errorMessage).toBe('Username and password are required.');
  });

  it('should clear the error message if registration is successful', () => {
    const mockResponse = { success: true };
    authService.register.and.returnValue(of(mockResponse));

    component.username = 'newuser';
    component.password = 'password';
    component.register();

    expect(component.errorMessage).toBeNull();
    expect(authService.register).toHaveBeenCalledWith('newuser', 'password');
  });

  it('should display a specific error message if username already exists', () => {
    const mockError = {
      error: { message: 'Username already exists' }
    };
    authService.register.and.returnValue(throwError(mockError));

    component.username = 'existinguser';
    component.password = 'password';
    component.register();

    expect(component.errorMessage).toBe('Username already exists. Please choose another one.');
    expect(authService.register).toHaveBeenCalledWith('existinguser', 'password');
  });

  it('should display a generic error message if registration fails unexpectedly', () => {
    const mockError = {
      error: { message: 'Unexpected error occurred' }
    };
    authService.register.and.returnValue(throwError(mockError));

    component.username = 'testuser';
    component.password = 'password';
    component.register();

    expect(component.errorMessage).toBe('Unexpected error occurred');
    expect(authService.register).toHaveBeenCalledWith('testuser', 'password');
  });

  it('should set the error message to the message from the server on registration failure', () => {
    const mockError = {
      error: { message: 'Some error from the server' }
    };
    authService.register.and.returnValue(throwError(mockError));

    component.username = 'invaliduser';
    component.password = 'invalidpassword';
    component.register();

    expect(component.errorMessage).toBe('Some error from the server');
  });
});
